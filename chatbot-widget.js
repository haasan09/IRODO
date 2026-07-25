(function () {
  'use strict';

  const CONFIG = Object.assign({
    brand: 'IRODO',
    botName: 'IRODO Smart Assistant',
    whatsapp: '923215602867',
    apiBaseUrl: '',
    logoUrl: './assets/irodo-mark.png',
    language: 'auto',
    welcomeDelayMs: 350,
    responseDelayMs: 520
  }, window.IRODO_CHATBOT_CONFIG || {});

  const state = {
    opened: false,
    initialized: false,
    history: [],
    lead: { active: false, step: 0, name: '', business: '', service: '', budget: '', phone: '' }
  };

  const knowledge = {
    services: [
      'Business websites', 'Restaurant and café websites', 'Clinic and doctor websites',
      'Salon and beauty websites', 'Portfolio websites', 'Landing pages',
      'Website redesign', 'Bug fixing', 'Mobile responsiveness', 'Basic SEO',
      'Speed optimisation', 'Monthly maintenance', 'E-commerce websites',
      'Digital marketing and Meta Ads', 'AI chatbot integration', 'Lead generation systems', 'Admin dashboards and CMS', 'Booking and appointment systems', 'Google Business and local SEO'
    ],
    packages: [
      { name: 'Starter Website', price: 'Rs. 15,000', pages: '1–3 pages', delivery: '5–7 working days' },
      { name: 'Business Website', price: 'Rs. 25,000', pages: 'Up to 6 pages', delivery: '8–12 working days' },
      { name: 'Premium Website', price: 'Rs. 50,000', pages: 'Up to 10 pages', delivery: '12–18 working days' },
      { name: 'Corporate Website', price: 'Rs. 75,000+', pages: '10–15+ pages', delivery: '18–25 working days' }
    ],
    payment: 'Standard project payment is 50% advance, 30% after design approval, and 20% before final launch or handover. Final terms are confirmed in writing.',
    extras: 'Domain, hosting, premium plugins, licences, paid integrations and third-party services are quoted separately when required.',
    location: 'IRODO serves businesses in Pakistan and can work remotely with clients in other locations.',
    support: 'Monthly maintenance can include content updates, routine checks, backups, minor bug fixes and priority support.',
    portfolio: 'IRODO portfolio includes Safa Cafe, Care 32 Dental Clinic, Noor’s Beauty Salon, Dr. Tania Habib and Cafe District 17.'
  };

  const normalize = (text) => String(text || '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff\u0900-\u097f\s.+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const containsAny = (text, words) => words.some((word) => text.includes(word));
  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function detectRomanUrdu(text) {
    const t = normalize(text);
    return containsAny(t, ['mujhe', 'mugha', 'mjy', 'ap', 'aap', 'kia', 'kya', 'kaise', 'kasy', 'chahiye', 'chahia', 'batao', 'website banani', 'price kia', 'kitna', 'han', 'nahi']);
  }

  function detectHindiUrduScript(text) {
    return /[\u0600-\u06FF\u0900-\u097F]/.test(text);
  }

  function langText(en, ur) {
    const last = state.history.filter((x) => x.role === 'user').slice(-1)[0]?.content || '';
    return detectRomanUrdu(last) || detectHindiUrduScript(last) ? ur : en;
  }

  function createMarkup() {
    const root = document.createElement('div');
    root.id = 'irodo-chatbot-root';
    root.innerHTML = `
      <button class="irodo-chat-launcher" type="button" aria-label="Open IRODO chatbot" aria-expanded="false">
        <span class="pulse"></span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
          <path d="M8 9h8M8 13h5"/>
        </svg>
      </button>
      <section class="irodo-chat-panel" role="dialog" aria-label="IRODO Smart Assistant" aria-hidden="true">
        <header class="irodo-chat-header">
          <div class="irodo-chat-avatar"><img src="${escapeHtml(CONFIG.logoUrl)}" alt="IRODO logo"></div>
          <div class="irodo-chat-title"><strong>${escapeHtml(CONFIG.botName)}</strong><span><i></i> Online • Replies instantly</span></div>
          <button class="irodo-chat-close" type="button" aria-label="Close chatbot">×</button>
        </header>
        <div class="irodo-chat-messages" aria-live="polite"></div>
        <div class="irodo-chat-quick">
          <button class="irodo-quick-btn" data-message="What services do you offer?">Services</button>
          <button class="irodo-quick-btn" data-message="Show website packages and prices">Pricing</button>
          <button class="irodo-quick-btn" data-message="How long does a website take?">Timeline</button>
          <button class="irodo-quick-btn" data-message="I want a free quotation">Get Quote</button>
          <button class="irodo-quick-btn" data-message="Connect me on WhatsApp">WhatsApp</button>
        </div>
        <form class="irodo-chat-compose">
          <textarea class="irodo-chat-input" rows="1" maxlength="700" placeholder="Ask about websites, pricing or services…" aria-label="Message"></textarea>
          <button class="irodo-chat-send" type="submit" aria-label="Send message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
        <div class="irodo-chat-note">Smart business assistant • Complex enquiries can be sent to WhatsApp</div>
      </section>`;
    document.body.appendChild(root);
    return root;
  }

  const root = createMarkup();
  const launcher = root.querySelector('.irodo-chat-launcher');
  const panel = root.querySelector('.irodo-chat-panel');
  const closeBtn = root.querySelector('.irodo-chat-close');
  const messages = root.querySelector('.irodo-chat-messages');
  const form = root.querySelector('.irodo-chat-compose');
  const input = root.querySelector('.irodo-chat-input');
  const sendBtn = root.querySelector('.irodo-chat-send');

  function openChat() {
    state.opened = true;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    launcher.setAttribute('aria-expanded', 'true');
    if (!state.initialized) {
      state.initialized = true;
      setTimeout(() => {
        addBotMessage('Assalam-o-Alaikum! I am the IRODO Smart Assistant. I can explain our website services, prices, delivery time, payment terms, portfolio and help prepare your quotation.');
      }, CONFIG.welcomeDelayMs);
    }
    setTimeout(() => input.focus(), 80);
  }

  function closeChat() {
    state.opened = false;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    launcher.setAttribute('aria-expanded', 'false');
  }

  function addMessage(role, text, html) {
    const row = document.createElement('div');
    row.className = `irodo-msg-row ${role}`;
    const bubble = document.createElement('div');
    bubble.className = `irodo-msg ${role}`;
    if (html) bubble.innerHTML = html;
    else bubble.textContent = text;
    const time = document.createElement('span');
    time.className = 'irodo-msg-time';
    time.textContent = now();
    bubble.appendChild(time);
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    state.history.push({ role, content: text || bubble.textContent, at: Date.now() });
  }

  function addBotMessage(text, html) { addMessage('bot', text, html); }
  function addUserMessage(text) { addMessage('user', text); }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'irodo-msg-row bot';
    row.dataset.typing = '1';
    row.innerHTML = '<div class="irodo-msg bot"><span class="irodo-typing"><i></i><i></i><i></i></span></div>';
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function whatsappLink(message) {
    return `https://wa.me/${String(CONFIG.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  }

  function pricingReply() {
    const lines = knowledge.packages.map((p) => `• ${p.name}: ${p.price} — ${p.pages}, ${p.delivery}`).join('\n');
    return `${langText('Our current website packages are:', 'Hamare current website packages:')}\n${lines}\n\n${knowledge.extras}`;
  }

  function servicesReply() {
    return `${langText('IRODO offers:', 'IRODO ye services offer karta hai:')}\n• ${knowledge.services.join('\n• ')}\n\n${langText('Tell me your business type and I will suggest the most suitable option.', 'Apna business type batayein, main suitable option suggest kar dunga.')}`;
  }

  function beginLead() {
    state.lead = { active: true, step: 1, name: '', business: '', service: '', budget: '', phone: '' };
    return langText('Great — let us prepare your free quotation. What is your name?', 'Theek hai — free quotation tayyar karte hain. Aap ka naam kya hai?');
  }

  function handleLeadAnswer(raw) {
    const value = raw.trim();
    const lead = state.lead;
    if (lead.step === 1) {
      lead.name = value.slice(0, 80);
      lead.step = 2;
      return langText(`Thanks, ${lead.name}. What is your business or brand name?`, `Shukriya ${lead.name}. Aap ke business ya brand ka naam kya hai?`);
    }
    if (lead.step === 2) {
      lead.business = value.slice(0, 120);
      lead.step = 3;
      return langText('Which service do you need? For example: business website, e-commerce, redesign, SEO or Meta Ads.', 'Aap ko konsi service chahiye? Misal: business website, e-commerce, redesign, SEO ya Meta Ads.');
    }
    if (lead.step === 3) {
      lead.service = value.slice(0, 160);
      lead.step = 4;
      return langText('What is your estimated budget?', 'Aap ka estimated budget kitna hai?');
    }
    if (lead.step === 4) {
      lead.budget = value.slice(0, 80);
      lead.step = 5;
      return langText('Please share your WhatsApp number.', 'Apna WhatsApp number share kar dein.');
    }
    if (lead.step === 5) {
      lead.phone = value.slice(0, 40);
      lead.active = false;
      lead.step = 0;
      const summary = `Hello IRODO, I need a quotation.\n\nName: ${lead.name}\nBusiness: ${lead.business}\nService: ${lead.service}\nBudget: ${lead.budget}\nCustomer WhatsApp: ${lead.phone}`;
      saveLead(lead).catch(() => {});
      const url = whatsappLink(summary);
      return {
        text: langText('Your quotation details are ready. Tap the button below to send them to IRODO on WhatsApp.', 'Aap ki quotation details ready hain. Neeche button se WhatsApp par IRODO ko send kar dein.'),
        html: `${escapeHtml(langText('Your quotation details are ready.', 'Aap ki quotation details ready hain.'))}<br><br><a href="${url}" target="_blank" rel="noopener">Send quotation on WhatsApp →</a>`
      };
    }
    return beginLead();
  }

  async function saveLead(lead) {
    if (!CONFIG.apiBaseUrl) return;
    const body = {
      name: lead.name,
      phone: lead.phone,
      email: '',
      businessName: lead.business,
      service: mapService(lead.service),
      budget: lead.budget,
      timeline: '',
      details: `Chatbot lead requesting: ${lead.service}`
    };
    await fetch(`${CONFIG.apiBaseUrl.replace(/\/$/, '')}/api/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  function mapService(value) {
    const t = normalize(value);
    if (containsAny(t, ['ecommerce', 'e commerce', 'shop', 'store'])) return 'ecommerce';
    if (containsAny(t, ['seo'])) return 'seo';
    if (containsAny(t, ['meta', 'facebook ad', 'instagram ad'])) return 'meta-ads';
    if (containsAny(t, ['marketing'])) return 'digital-marketing';
    if (containsAny(t, ['brand', 'logo'])) return 'branding';
    if (containsAny(t, ['maintenance', 'support'])) return 'maintenance';
    if (containsAny(t, ['website', 'web'])) return 'website';
    return 'other';
  }

  function localReply(raw) {
    const t = normalize(raw);

    if (state.lead.active) return handleLeadAnswer(raw);

    if (!t) return langText('Please type your question.', 'Apna sawal type karein.');
    if (containsAny(t, ['cancel quote', 'stop quote', 'quotation cancel', 'cancel'])) {
      state.lead.active = false;
      return langText('Quotation collection has been cancelled.', 'Quotation collection cancel kar di gayi hai.');
    }
    if (containsAny(t, ['hello', 'hi', 'hey', 'salam', 'assalam', 'aoa', 'اسلام', 'नमस्ते'])) {
      return langText('Welcome to IRODO. Ask me about services, prices, delivery time, portfolio or a free quotation.', 'IRODO mein khush aamdeed. Services, prices, delivery time, portfolio ya free quotation ke bare mein pooch sakte hain.');
    }
    if (containsAny(t, ['quote', 'quotation', 'estimate', 'project start', 'website chahiye', 'website banani', 'free consultation', 'free quote'])) return beginLead();
    if (containsAny(t, ['service', 'services', 'what do you do', 'kya karte', 'kia krty', 'website type'])) return servicesReply();
    if (containsAny(t, ['price', 'pricing', 'package', 'packages', 'cost', 'rate', 'kitna', 'charges', 'budget'])) return pricingReply();
    if (containsAny(t, ['time', 'timeline', 'how long', 'delivery', 'days', 'kitne din'])) {
      return langText('Typical delivery: Starter 5–7 working days, Business 8–12, Premium 12–18, and Corporate 18–25. The final timeline depends on content, approvals and features.', 'Typical delivery: Starter 5–7 working days, Business 8–12, Premium 12–18 aur Corporate 18–25 din. Final time content, approvals aur features par depend karta hai.');
    }
    if (containsAny(t, ['payment', 'advance', 'installment', 'pay', 'deposit'])) return knowledge.payment;
    if (containsAny(t, ['domain', 'hosting', 'plugin', 'license', 'licence'])) return knowledge.extras;
    if (containsAny(t, ['portfolio', 'work', 'projects', 'sample', 'examples'])) return knowledge.portfolio;
    if (containsAny(t, ['maintenance', 'support', 'after launch', 'update website'])) return knowledge.support;
    if (containsAny(t, ['ecommerce', 'e commerce', 'online store', 'shop website', 'product website'])) {
      return langText('Yes. IRODO can build e-commerce websites with product categories, cart, checkout, payment-method setup, WhatsApp ordering and order management. Pricing is confirmed after the product count and required features are reviewed.', 'Ji. IRODO e-commerce website bana sakta hai jisme product categories, cart, checkout, payment setup, WhatsApp ordering aur order management ho. Final price products aur features dekh kar confirm hoti hai.');
    }
    if (containsAny(t, ['seo', 'google ranking', 'rank on google'])) {
      return langText('IRODO provides basic on-page SEO, including page titles, descriptions, heading structure, image alt text and indexing setup. Advanced monthly SEO is quoted separately.', 'IRODO basic on-page SEO deta hai: page titles, descriptions, headings, image alt text aur indexing setup. Advanced monthly SEO alag quote hota hai.');
    }
    if (containsAny(t, ['meta ads', 'facebook ads', 'instagram ads', 'digital marketing', 'marketing'])) {
      return langText('IRODO can support digital marketing and Meta Ads. The quote depends on campaign goals, ad creatives, target location, monthly management and the separate advertising budget.', 'IRODO digital marketing aur Meta Ads support karta hai. Quote campaign goal, creatives, target location, monthly management aur separate ad budget par depend karta hai.');
    }
    if (containsAny(t, ['whatsapp', 'contact', 'human', 'agent', 'call', 'phone', 'number', 'owner'])) {
      const url = whatsappLink('Hello IRODO, I am contacting you through the website chatbot.');
      return { text: 'Contact IRODO on WhatsApp.', html: `You can speak directly with IRODO here:<br><br><a href="${url}" target="_blank" rel="noopener">Open WhatsApp →</a>` };
    }
    if (containsAny(t, ['location', 'where', 'city', 'pakistan'])) return knowledge.location;
    if (containsAny(t, ['thank', 'thanks', 'shukriya'])) return langText('You are welcome. I can also prepare your free quotation.', 'Khush rahiye. Main aap ki free quotation bhi prepare kar sakta hoon.');

    return langText(
      'I can answer IRODO-related questions about websites, services, packages, timelines, payments, SEO, Meta Ads and maintenance. For a custom requirement, type “Get Quote” or connect on WhatsApp.',
      'Main IRODO ki website services, packages, timeline, payment, SEO, Meta Ads aur maintenance ke sawalat ka jawab de sakta hoon. Custom requirement ke liye “Get Quote” likhein ya WhatsApp par connect karein.'
    );
  }

  async function getReply(message) {
    if (CONFIG.apiBaseUrl) {
      try {
        const response = await fetch(`${CONFIG.apiBaseUrl.replace(/\/$/, '')}/api/chatbot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history: state.history.slice(-10) })
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.reply) return data.reply;
        }
      } catch (_) {
        // The free local knowledge bot continues to work if the API is offline.
      }
    }
    return localReply(message);
  }

  async function sendMessage(text) {
    const clean = String(text || '').trim();
    if (!clean) return;
    addUserMessage(clean);
    input.value = '';
    input.style.height = '44px';
    sendBtn.disabled = true;
    const typing = showTyping();
    await new Promise((resolve) => setTimeout(resolve, CONFIG.responseDelayMs));
    let reply;
    try {
      reply = await getReply(clean);
    } catch (_) {
      reply = localReply(clean);
    }
    typing.remove();
    if (typeof reply === 'object' && reply.html) addBotMessage(reply.text || '', reply.html);
    else addBotMessage(String(reply));
    sendBtn.disabled = false;
    input.focus();
  }

  launcher.addEventListener('click', () => state.opened ? closeChat() : openChat());
  closeBtn.addEventListener('click', closeChat);
  form.addEventListener('submit', (event) => { event.preventDefault(); sendMessage(input.value); });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 108)}px`;
  });
  root.querySelectorAll('[data-message]').forEach((button) => {
    button.addEventListener('click', () => sendMessage(button.dataset.message));
  });

  window.IRODO_CHATBOT = { open: openChat, close: closeChat, send: sendMessage };
})();
