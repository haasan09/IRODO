(function () {
  'use strict';

  const CONFIG = Object.assign({
    brand: 'IRODO',
    botName: 'Ayaan — IRODO Digital Agent',
    agentName: 'Ayaan',
    whatsapp: '923215602867',
    apiBaseUrl: '',
    logoUrl: './assets/irodo-mark.png',
    language: 'auto',
    welcomeDelayMs: 350,
    responseDelayMs: 520
  }, window.IRODO_CHATBOT_CONFIG || {});

  const emptyLead = () => ({
    active: false,
    step: 0,
    name: '',
    phone: '',
    requirement: '',
    business: '',
    budget: '',
    analysis: null
  });

  const state = {
    opened: false,
    initialized: false,
    history: [],
    lead: emptyLead(),
    profile: {
      name: '',
      phone: '',
      requirement: '',
      business: '',
      budget: ''
    },
    conversation: {
      userTurns: 0,
      substantiveTurns: 0,
      lastTopic: '',
      requirementContext: ''
    }
  };

  const knowledge = {
    services: [
      'Website design and development',
      'Website redesign, bug fixing and mobile responsiveness',
      'E-commerce stores, admin panels and booking systems',
      'AI website chatbots and lead-generation systems',
      'Digital marketing and Meta Ads',
      'SEO, speed optimisation and website maintenance'
    ],
    futureServices: ['AI voice and call agents'],
    packages: [
      { name: 'Starter Website', price: 'Rs. 15,000', pages: '1–3 pages', delivery: '5–7 working days' },
      { name: 'Business Website', price: 'Rs. 25,000', pages: 'Up to 6 pages', delivery: '8–12 working days' },
      { name: 'Premium Website', price: 'Rs. 50,000', pages: 'Up to 10 pages', delivery: '12–18 working days' },
      { name: 'Corporate Website', price: 'Rs. 75,000+', pages: '10–15+ pages', delivery: '18–25 working days' }
    ],
    payment: 'Standard project payment is 50% advance, 30% after design approval, and 20% before final launch or handover. Final terms are confirmed in writing.',
    extras: 'Domain, hosting, premium plugins, licences, paid integrations and third-party services are quoted separately when required.',
    location: 'IRODO serves businesses across Pakistan and can work remotely with clients in other locations.',
    support: 'Monthly maintenance starts from Rs. 6,000 and can include content updates, routine checks, backups, minor bug fixes and priority support.',
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
  const escapeHtml = (value) => String(value == null ? '' : value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const unique = (items) => [...new Set(items.filter(Boolean))];
  const formatPKR = (number) => `Rs. ${Math.round(number).toLocaleString('en-PK')}`;

  function detectRomanUrdu(text) {
    const t = normalize(text);
    return containsAny(t, [
      'mujhe', 'mugha', 'mjy', 'mera', 'meri', 'ap', 'aap', 'kia', 'kya',
      'kaise', 'kasy', 'chahiye', 'chahia', 'batao', 'banani', 'kitna',
      'han', 'haan', 'nahi', 'ni', 'krna', 'karna', 'website bnani'
    ]);
  }

  function detectHindiUrduScript(text) {
    return /[\u0600-\u06FF\u0900-\u097F]/.test(text);
  }

  function langText(en, ur) {
    const last = state.history.filter((x) => x.role === 'user').slice(-1)[0]?.content || '';
    return detectRomanUrdu(last) || detectHindiUrduScript(last) ? ur : en;
  }


  function firstName() {
    return String(state.profile.name || '').trim().split(/\s+/)[0] || '';
  }

  function addressUser(prefixComma = true) {
    const name = firstName();
    if (!name) return '';
    return prefixComma ? `${name} ji, ` : `${name} ji`;
  }

  function cleanCapturedName(value) {
    return String(value || '')
      .replace(/[.!?،۔]+$/g, '')
      .replace(/\b(hoon|hun|hu|hai|here|speaking)\b.*$/i, '')
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join(' ');
  }

  function extractName(raw) {
    const text = String(raw || '').trim();
    const patterns = [
      /(?:my name is|name is)\s+([a-z][a-z .'-]{1,55})/i,
      /(?:mera|meri)\s+naam\s+([a-z][a-z .'-]{1,55})(?:\s+(?:hai|he))?/i,
      /(?:मेरा|मेरी)\s+नाम\s+([\u0900-\u097f][\u0900-\u097f\s]{1,55})(?:\s+है)?/i,
      /(?:میرا|میری)\s+نام\s+([\u0600-\u06ff][\u0600-\u06ff\s]{1,55})(?:\s+ہے)?/i,
      /^(?:i am|i'm|im)\s+([a-z][a-z .'-]{1,45})$/i,
      /^(?:main|mein)\s+([a-z][a-z .'-]{1,45})\s+(?:hoon|hun|hu)$/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (!match) continue;
      const name = cleanCapturedName(match[1]);
      const bad = ['looking', 'need', 'want', 'interested', 'from', 'making', 'building', 'website', 'fine', 'okay'];
      if (name.length >= 2 && name.length <= 60 && !containsAny(normalize(name), bad)) return name;
    }
    return '';
  }

  function extractBusiness(raw) {
    const text = String(raw || '').trim();
    const patterns = [
      /(?:business|company|brand|shop|clinic|restaurant|salon)\s+(?:name\s+)?(?:is|hai|he)\s+(.{2,80})/i,
      /(?:mera|meri|hamara|hamari)\s+(?:business|company|brand|shop|clinic|restaurant|salon)(?:\s+ka)?\s+naam\s+(.{2,80})/i,
      /(?:मेरे|मेरा|मेरी)\s+(?:बिजनेस|कंपनी|ब्रांड|दुकान)\s+का\s+नाम\s+(.{2,80})/i,
      /(?:میرے|میرا|میری)\s+(?:بزنس|کمپنی|برانڈ|دکان)\s+کا\s+نام\s+(.{2,80})/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return String(match[1]).replace(/[.!?،۔]+$/g, '').trim().slice(0, 80);
    }
    return '';
  }

  function isGreeting(t) {
    return /^(?:ass?alam(?:[ -]?o[ -]?alaikum)?|salaam|aoa|hello|hi|hey|اسلام علیکم|السلام علیکم|नमस्ते)(?:\s|$|[!,.?])/i.test(String(t || ''));
  }

  function isConversationEnding(t) {
    const clearEnding = [
      'thats all', "that's all", 'bas itna', 'bas hogaya', 'bas ho gaya', 'aur kuch nahi',
      'thank you', 'thanks', 'shukriya', 'jazakallah', 'allah hafiz', 'khuda hafiz',
      'good bye', 'goodbye', 'bye', 'done', 'theek hai bas', 'ok thanks', 'okay thanks'
    ];
    if (containsAny(t, clearEnding)) return true;
    return state.conversation.substantiveTurns > 0 && ['ok', 'okay', 'theek hai', 'thik hai', 'acha theek'].includes(t);
  }

  function looksLikeRequirement(raw) {
    const t = normalize(raw);
    return containsAny(t, [
      'website', 'web site', 'landing page', 'ecommerce', 'e commerce', 'online store',
      'admin panel', 'dashboard', 'booking', 'appointment', 'chatbot', 'seo', 'redesign',
      'restaurant', 'cafe', 'clinic', 'doctor', 'dental', 'salon', 'portfolio', 'business site',
      'login signup', 'online payment', 'meta ads', 'digital marketing',
      'integrate', 'integration', 'add in website', 'add to website', 'existing website',
      'already website', 'website already', 'call agent', 'voice agent', 'calling agent'
    ]);
  }

  function appendRequirementContext(raw) {
    const clean = String(raw || '').trim();
    if (!clean || !looksLikeRequirement(clean) || detectUnsupportedService(clean)) return;
    const current = state.conversation.requirementContext;
    if (!current) state.conversation.requirementContext = clean;
    else if (!normalize(current).includes(normalize(clean)) && !normalize(clean).includes(normalize(current))) {
      state.conversation.requirementContext = `${current}. Additional requirement: ${clean}`.slice(0, 1200);
    }
    state.profile.requirement = state.conversation.requirementContext;
  }

  function captureConversationFacts(raw) {
    const foundName = extractName(raw);
    if (foundName) state.profile.name = foundName;
    const foundBusiness = extractBusiness(raw);
    if (foundBusiness) state.profile.business = foundBusiness;
    appendRequirementContext(raw);
    const t = normalize(raw);
    if (containsAny(t, ['budget', 'my range', 'mera budget', 'बजट', 'بجٹ'])) state.profile.budget = String(raw).trim().slice(0, 100);
  }


  function isExistingWebsiteRequest(raw) {
    const t = normalize(raw);
    const existingPhrases = [
      'existing website', 'existing site', 'already have a website', 'already have website',
      'website already', 'website is already', 'my website is ready', 'website bani hui',
      'website ban chuki', 'meri website hai', 'mere pas website hai', 'hamari website hai',
      'website pe add', 'website par add', 'website mein add', 'website me add',
      'site mein add', 'site me add', 'integrate in website', 'integrate into website',
      'मेरी वेबसाइट पहले से है', 'वेबसाइट पहले से बनी', 'वेबसाइट बनी हुई', 'वेबसाइट में जोड़', 'वेबसाइट में इंटीग्रेट',
      'میری ویب سائٹ پہلے سے ہے', 'ویب سائٹ بنی ہوئی', 'ویب سائٹ میں شامل', 'ویب سائٹ میں انٹیگریٹ'
    ];
    const integrationWords = ['integrate', 'integration', 'add', 'connect', 'install', 'embed', 'plugin'];
    return containsAny(t, existingPhrases) || (containsAny(t, ['website', 'web site', 'site']) && containsAny(t, integrationWords));
  }

  function detectUnsupportedService(raw) {
    const t = normalize(raw);
    if (containsAny(t, [
      'call agent', 'calling agent', 'voice agent', 'ai voice agent', 'ai call agent',
      'phone agent', 'telephone agent', 'agent call', 'call ai agent', 'ai calling',
      'outbound calling bot', 'inbound calling bot', 'automated calls', 'automatic calling',
      'voice calling bot', 'call automation agent', 'कॉल एजेंट', 'वॉइस एजेंट', 'कॉलिंग एजेंट',
      'کال ایجنٹ', 'وائس ایجنٹ', 'کالنگ ایجنٹ', 'فون ایجنٹ'
    ])) return 'call-agent';
    return '';
  }

  function conciseServicesList() {
    return knowledge.services.map((service) => `• ${service}`).join('\n');
  }

  function unsupportedServiceReply(raw, service) {
    const greeting = isGreeting(raw)
      ? `${containsAny(normalize(raw), ['assalam', 'asalam', 'salam', 'salaam', 'aoa', 'اسلام علیکم', 'السلام علیکم']) ? 'Wa Alaikum Assalam' : 'Hello'}${firstName() ? `, ${addressUser(false)}` : ''}!\n\n`
      : '';

    if (service === 'call-agent') {
      const existingNote = isExistingWebsiteRequest(raw)
        ? 'Main samajh gaya: aapko nayi website nahi chahiye; aap apni existing website mein AI voice/call agent integrate karwana chahte hain.'
        : 'Main samajh gaya: aap AI voice/call agent service chahte hain.';
      return `${greeting}${addressUser()}${existingNote}\n\nFilhal IRODO AI voice/call agent service provide nahi karta. Ye hamari future service roadmap mein hai, aur available hone par hum iski integration offer karenge.\n\nAbhi IRODO ki main services:\n${conciseServicesList()}\n\nIn services mein se koi solution chahiye ho to apni requirement share karein; main uske mutabiq suitable option, normal estimate aur next step bata dunga.`;
    }

    return `${greeting}${addressUser()}ye service filhal IRODO ki current offering mein available nahi hai.\n\nAbhi IRODO ki main services:\n${conciseServicesList()}\n\nIn mein se kisi service ke liye main aapko proper guidance de sakta hoon.`;
  }

  function smartFollowUp(analysis, raw = '') {
    const type = analysis.type;
    const t = normalize(raw);
    if (/E-commerce/i.test(type)) return 'Approx kitne products honge, aur aapko online payment chahiye ya WhatsApp order confirmation?';
    if (/Restaurant|Café/i.test(type)) {
      if (containsAny(t, ['admin panel', 'dashboard', 'manage menu', 'manage prices'])) return 'Orders WhatsApp par confirm karne hain, ya cart/checkout wala complete online ordering system chahiye?';
      return 'Menu sirf display karna hai, ya online ordering aur admin panel bhi chahiye?';
    }
    if (/Clinic|Doctor/i.test(type)) return 'Appointment simple WhatsApp request hogi, ya date/time slots wala booking system chahiye?';
    if (/Salon|Beauty/i.test(type)) return 'Aapko services gallery ke saath appointment booking bhi chahiye?';
    if (/Portfolio/i.test(type)) return 'Approx kitne projects aur case studies show karni hain?';
    if (/Admin Panel|Dashboard|CMS/i.test(type)) return 'Admin panel mein exactly kya manage karna hai—products, prices, stock, bookings, content ya users?';
    if (/Landing Page/i.test(type)) return 'Ye page Meta Ads campaign ke liye hoga, aur lead WhatsApp par chahiye ya form/email par?';
    if (/Redesign/i.test(type)) return 'Existing website ka link share kar dein, aur sab se important problem design, speed ya mobile layout mein hai?';
    if (/Booking System Integration/i.test(type)) return 'Booking simple request form hogi, ya date/time slots aur confirmations wala complete system chahiye?';
    if (/Payment Gateway Integration/i.test(type)) return 'Aap kis payment method ya gateway ko connect karna chahte hain, aur website kis platform par bani hai?';
    if (/Lead.Generation Integration/i.test(type)) return 'Lead WhatsApp par chahiye, email par, ya dono jagah?';
    if (/Custom Feature Integration/i.test(type)) return 'Exact feature kya add karna hai, aur existing website kis platform par bani hai?';
    if (/Chatbot/i.test(type)) return 'Chatbot ko kin services, prices aur customer questions ki knowledge deni hai?';
    return 'Approx kitne pages chahiye, aur admin panel, booking, chatbot ya online payment mein se koi feature bhi add karna hai?';
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
      <section class="irodo-chat-panel" role="dialog" aria-label="IRODO Intelligent Assistant" aria-hidden="true">
        <header class="irodo-chat-header">
          <div class="irodo-chat-avatar"><img src="${escapeHtml(CONFIG.logoUrl)}" alt="IRODO logo"></div>
          <div class="irodo-chat-title"><strong>${escapeHtml(CONFIG.botName)}</strong><span><i></i> Online • IRODO digital sales agent</span></div>
          <button class="irodo-chat-close" type="button" aria-label="Close chatbot">×</button>
        </header>
        <div class="irodo-chat-messages" aria-live="polite"></div>
        <div class="irodo-chat-quick">
          <button class="irodo-quick-btn" data-message="What services do you offer?">Services</button>
          <button class="irodo-quick-btn" data-message="Show website packages and prices">Pricing</button>
          <button class="irodo-quick-btn" data-message="I need a restaurant website">Website Advice</button>
          <button class="irodo-quick-btn" data-message="I want to share my project details">Share Project</button>
          <button class="irodo-quick-btn" data-message="Connect me on WhatsApp">WhatsApp</button>
        </div>
        <form class="irodo-chat-compose">
          <textarea class="irodo-chat-input" rows="1" maxlength="900" placeholder="Describe the website you need…" aria-label="Message"></textarea>
          <button class="irodo-chat-send" type="submit" aria-label="Send message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
        <div class="irodo-chat-note">Preliminary estimates are negotiable • Final scope is confirmed after discussion</div>
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
        addBotMessage(`Assalam-o-Alaikum! Main ${CONFIG.agentName}, IRODO ka digital sales agent hoon. Main website planning, pricing, features, timelines, e-commerce, admin panels, chatbots aur digital marketing ke sawalat ka jawab de sakta hoon. Aap kis cheez ke baare mein baat karna chahte hain?`);
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

  function displayPhone() {
    const digits = String(CONFIG.whatsapp).replace(/\D/g, '');
    if (digits === '923215602867') return '+92 321 5602867';
    return `+${digits}`;
  }

  function pricingReply() {
    const lines = knowledge.packages.map((p) => `• ${p.name}: ${p.price} — ${p.pages}, ${p.delivery}`).join('\n');
    return `${langText('Our normal website pricing is:', 'Hamari normal website pricing ye hai:')}\n${lines}\n\n${knowledge.extras}\n\n${langText('Pricing is negotiable. We can discuss the scope and agree on a suitable final amount.', 'Pricing negotiable hai. Scope discuss karke suitable final amount decide ki ja sakti hai.')}`;
  }

  function servicesReply() {
    return `${langText('IRODO’s main services:', 'IRODO ki main services:')}\n${conciseServicesList()}\n\n${langText('Share your exact requirement and I will suggest the suitable solution, normal estimate and next step.', 'Apni exact requirement share karein; main suitable solution, normal estimate aur next step bata dunga.')}`;
  }

  function parseBudget(raw) {
    const text = String(raw || '').toLowerCase().replace(/,/g, '');
    if (!text || containsAny(text, ['not decided', 'no budget', 'dont know', "don't know", 'pata nahi', 'decide nahi'])) {
      return { min: null, max: null };
    }

    const values = [];
    const re = /(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand|hazar|hazaar)?/g;
    let match;
    while ((match = re.exec(text))) {
      let value = Number(match[1]);
      const unit = match[2] || '';
      if (unit === 'lakh' || unit === 'lac') value *= 100000;
      else if (unit === 'k' || unit === 'thousand' || unit === 'hazar' || unit === 'hazaar') value *= 1000;
      if (value >= 1000) values.push(value);
    }
    if (!values.length) return { min: null, max: null };
    return { min: Math.min(...values), max: Math.max(...values) };
  }

  function analyzeRequirement(raw, budgetRaw) {
    const t = normalize(raw);
    let type = 'Business Website';
    let packageName = 'Business Website Package';
    let low = 25000;
    let high = 50000;
    let timeline = '8–18 working days';
    let monthly = false;
    let confidence = false;
    let includes = ['Custom professional design', 'Mobile responsive layout', 'WhatsApp integration', 'Contact or quotation form', 'Basic on-page SEO'];
    const reasons = [];

    const hasAdmin = containsAny(t, ['admin dashboard', 'admin panel', 'cms', 'backend', 'back end', 'manage products', 'manage stock', 'stock management', 'database', 'portal', 'login signup', 'login and signup', 'user account']);
    const hasEcommerce = containsAny(t, ['ecommerce', 'e commerce', 'online store', 'online shop', 'shopping website', 'product store', 'cart', 'checkout', 'sell products']);
    const hasBooking = containsAny(t, ['booking', 'appointment', 'schedule', 'time slot']);
    const hasChatbot = containsAny(t, ['chatbot', 'chat bot', 'ai assistant', 'automation bot']);
    const hasLeadGen = containsAny(t, ['lead generation', 'lead form', 'quotation flow', 'audit form']);
    const hasAnimation = containsAny(t, ['3d', 'animation', 'animated', 'advanced animation', 'cinematic']);
    const hasMultiLanguage = containsAny(t, ['multilingual', 'multi language', 'urdu english', 'english urdu', 'two language']);
    const hasPayments = containsAny(t, ['payment gateway', 'online payment', 'card payment', 'stripe', 'paypal']);
    const hasExistingSite = isExistingWebsiteRequest(raw);
    const hasIntegration = containsAny(t, ['integrate', 'integration', 'add', 'connect', 'install', 'embed', 'plugin']);
    const hasMarketing = containsAny(t, ['digital marketing', 'meta ads', 'facebook ads', 'instagram ads', 'social media marketing']);
    const hasBusinessVertical = containsAny(t, [
      'restaurant', 'cafe', 'café', 'food', 'menu', 'bakery', 'fast food',
      'clinic', 'doctor', 'dental', 'dentist', 'hospital', 'medical', 'aesthetic',
      'salon', 'beauty', 'spa', 'makeup', 'nails', 'hair',
      'portfolio', 'personal website', 'freelancer', 'resume', 'cv website',
      'corporate', 'company website', 'construction company', 'real estate company'
    ]);

    if (hasExistingSite && hasEcommerce) {
      type = 'E-commerce Upgrade for Existing Website';
      packageName = 'Custom E-commerce Integration';
      low = 45000;
      high = 120000;
      timeline = '15–30 working days';
      includes = ['Existing website compatibility review', 'Product catalogue and categories', 'Cart or WhatsApp ordering workflow', 'Order management setup', 'Mobile responsive integration'];
      confidence = true;
      reasons.push('existing website e-commerce upgrade');
    } else if (hasExistingSite && hasChatbot) {
      type = 'AI Chatbot Integration for Existing Website';
      packageName = 'Chatbot Integration Package';
      low = 15000;
      high = 40000;
      timeline = '5–12 working days';
      includes = ['Integration into the existing website', 'Custom business knowledge', 'English/Roman Urdu replies', 'Lead qualification flow', 'WhatsApp handoff', 'Branded chatbot interface'];
      confidence = true;
      reasons.push('existing website chatbot integration');
    } else if (hasExistingSite && hasAdmin) {
      type = 'Admin Panel Integration for Existing Website';
      packageName = 'Custom Website Upgrade';
      low = 35000;
      high = 90000;
      timeline = '12–25 working days';
      includes = ['Existing website review', 'Secure admin login', 'Required management controls', 'Database connection where needed', 'Responsive admin interface'];
      confidence = true;
      reasons.push('existing website admin-panel integration');
    } else if (hasExistingSite && hasBooking) {
      type = 'Booking System Integration for Existing Website';
      packageName = 'Booking Integration Package';
      low = 15000;
      high = 40000;
      timeline = '5–14 working days';
      includes = ['Existing website compatibility review', 'Booking or appointment form', 'Date/time request workflow', 'WhatsApp or email confirmation', 'Mobile responsive setup'];
      confidence = true;
      reasons.push('existing website booking integration');
    } else if (hasExistingSite && hasPayments) {
      type = 'Payment Gateway Integration for Existing Website';
      packageName = 'Payment Integration Package';
      low = 15000;
      high = 40000;
      timeline = '5–12 working days';
      includes = ['Existing website compatibility review', 'Payment gateway setup', 'Checkout or payment flow connection', 'Success/failure handling', 'Mobile testing'];
      confidence = true;
      reasons.push('existing website payment integration');
    } else if (hasExistingSite && hasLeadGen) {
      type = 'Lead-Generation Integration for Existing Website';
      packageName = 'Lead Integration Package';
      low = 12000;
      high = 30000;
      timeline = '4–10 working days';
      includes = ['Lead capture form or guided flow', 'WhatsApp/email routing', 'Conversion-focused CTA', 'Basic tracking setup', 'Mobile responsive integration'];
      confidence = true;
      reasons.push('existing website lead-generation integration');
    } else if (hasExistingSite && hasIntegration) {
      type = 'Custom Feature Integration for Existing Website';
      packageName = 'Custom Website Upgrade';
      low = 8000;
      high = 40000;
      timeline = '3–14 working days';
      includes = ['Existing website compatibility review', 'Requested feature integration', 'Responsive implementation', 'Functional testing', 'Basic handover support'];
      confidence = true;
      reasons.push('existing website custom integration');
    } else if (hasAdmin && !hasEcommerce && !hasBusinessVertical) {
      type = 'Admin Dashboard / CMS Website';
      packageName = 'Custom Dashboard Solution';
      low = 100000;
      high = 250000;
      timeline = '25–45 working days';
      includes = ['Secure admin login', 'Content or product management', 'Stock/status controls', 'Forms and data handling', 'Responsive user interface'];
      confidence = true;
      reasons.push('admin/dashboard features');
    } else if (hasEcommerce) {
      type = 'E-commerce & Online Store';
      packageName = 'Custom E-commerce Solution';
      low = 90000;
      high = 160000;
      timeline = '20–35 working days';
      includes = ['Product catalogue and categories', 'Product detail pages', 'Cart and checkout', 'Order-management workflow', 'WhatsApp or payment-method setup'];
      confidence = true;
      reasons.push('online selling features');
    } else if (containsAny(t, ['restaurant', 'cafe', 'café', 'food', 'menu', 'bakery', 'fast food'])) {
      type = 'Restaurant & Café Website';
      packageName = 'Business or Premium Website Package';
      low = 25000;
      high = 50000;
      timeline = '8–18 working days';
      includes = ['Categorised food menu', 'Food gallery', 'Google Maps', 'WhatsApp ordering', 'Reviews and contact details'];
      confidence = true;
      reasons.push('restaurant/café requirement');
    } else if (containsAny(t, ['clinic', 'doctor', 'dental', 'dentist', 'hospital', 'medical', 'aesthetic'])) {
      type = 'Clinic / Doctor Website';
      packageName = 'Business or Premium Website Package';
      low = 25000;
      high = 50000;
      timeline = '8–18 working days';
      includes = ['Doctor profile', 'Treatment/service sections', 'Appointment request', 'Patient reviews', 'Location and contact information'];
      confidence = true;
      reasons.push('healthcare requirement');
    } else if (containsAny(t, ['salon', 'beauty', 'spa', 'makeup', 'nails', 'hair'])) {
      type = 'Salon & Beauty Website';
      packageName = 'Business or Premium Website Package';
      low = 25000;
      high = 50000;
      timeline = '8–18 working days';
      includes = ['Services catalogue', 'Treatment categories', 'Gallery', 'WhatsApp booking', 'Reviews and location'];
      confidence = true;
      reasons.push('salon/beauty requirement');
    } else if (containsAny(t, ['portfolio', 'personal website', 'freelancer', 'resume', 'cv website'])) {
      type = 'Personal Portfolio Website';
      packageName = 'Starter Website Package';
      low = 15000;
      high = 25000;
      timeline = '5–10 working days';
      includes = ['About and skills', 'Project showcase', 'Resume/CV link', 'Contact links', 'Mobile responsive design'];
      confidence = true;
      reasons.push('portfolio requirement');
    } else if (containsAny(t, ['landing page', 'one page', 'single page', 'meta ads page', 'campaign page'])) {
      type = containsAny(t, ['meta ads', 'facebook ads', 'instagram ads']) ? 'Meta Ads Landing Page' : 'Landing Page';
      packageName = 'Starter Landing Page Package';
      low = type === 'Meta Ads Landing Page' ? 18000 : 15000;
      high = 30000;
      timeline = '5–10 working days';
      includes = ['Conversion-focused layout', 'Strong headline and CTA', 'Fast mobile design', 'Lead form', 'WhatsApp integration'];
      confidence = true;
      reasons.push('landing-page requirement');
    } else if (containsAny(t, ['corporate', 'company website', 'construction company', 'real estate company', 'multiple services'])) {
      type = 'Corporate Website';
      packageName = 'Corporate Website Package';
      low = 75000;
      high = 150000;
      timeline = '18–30 working days';
      includes = ['Corporate information architecture', 'Multiple service pages', 'Team/project sections', 'Advanced forms', 'Portfolio/case studies'];
      confidence = true;
      reasons.push('corporate requirement');
    } else if (containsAny(t, ['redesign', 'old website', 'existing website improve', 'website update'])) {
      type = 'Website Redesign';
      packageName = 'Custom Redesign Package';
      low = 15000;
      high = 50000;
      timeline = '7–18 working days';
      includes = ['UI refresh', 'Mobile improvements', 'Content restructuring', 'Speed review', 'Contact and conversion improvements'];
      confidence = true;
      reasons.push('redesign requirement');
    } else if (containsAny(t, ['bug fixing', 'fix website', 'broken website', 'responsive issue'])) {
      type = 'Website Bug Fixing';
      packageName = 'Technical Fix Package';
      low = 4000;
      high = 20000;
      timeline = '1–7 working days';
      includes = ['Visible bug audit', 'Responsive fixes', 'Broken-link repair', 'Form troubleshooting'];
      confidence = true;
      reasons.push('technical fixes');
    } else if (hasChatbot) {
      type = 'AI Chatbot & Website Automation';
      packageName = 'Chatbot Integration Package';
      low = 15000;
      high = 40000;
      timeline = '5–12 working days';
      includes = ['Custom business knowledge', 'English/Roman Urdu replies', 'Lead qualification flow', 'WhatsApp handoff', 'Branded chatbot interface'];
      confidence = true;
      reasons.push('chatbot requirement');
    } else if (hasLeadGen) {
      type = 'Lead Generation System';
      packageName = 'Lead Generation Package';
      low = 12000;
      high = 30000;
      timeline = '4–10 working days';
      includes = ['Lead capture form', 'Quotation flow', 'WhatsApp/email routing', 'Conversion-focused CTA'];
      confidence = true;
      reasons.push('lead-generation requirement');
    } else if (containsAny(t, ['seo', 'google ranking', 'on page seo'])) {
      type = 'Website SEO Setup';
      packageName = 'SEO Setup Package';
      low = 8000;
      high = 18000;
      timeline = '3–8 working days';
      includes = ['Meta titles and descriptions', 'Heading structure', 'Image alt text', 'Indexing setup', 'On-page improvements'];
      confidence = true;
      reasons.push('SEO requirement');
    } else if (containsAny(t, ['maintenance', 'monthly support', 'website support'])) {
      type = 'Monthly Website Maintenance';
      packageName = 'Monthly Maintenance Plan';
      low = 6000;
      high = 15000;
      timeline = 'Monthly service';
      monthly = true;
      includes = ['Content updates', 'Routine checks', 'Small bug fixes', 'Backups', 'Priority support'];
      confidence = true;
      reasons.push('maintenance requirement');
    } else if (hasMarketing) {
      type = containsAny(t, ['meta ads', 'facebook ads', 'instagram ads']) ? 'Digital Marketing & Meta Ads' : 'Digital Marketing';
      packageName = 'Custom Monthly Marketing Plan';
      low = 15000;
      high = 50000;
      timeline = 'Initial setup in 3–7 working days';
      monthly = true;
      includes = ['Campaign planning', 'Audience and competitor research', 'Ad creative direction', 'Campaign setup and optimisation', 'Performance reporting'];
      confidence = true;
      reasons.push('digital marketing requirement');
    } else if (containsAny(t, ['website', 'web site', 'webpage', 'business site', 'site banani', 'website bnani'])) {
      confidence = true;
      reasons.push('general business website');
      if (containsAny(t, ['simple', 'basic', 'small website', '1 page', '2 page', '3 page'])) {
        type = 'Starter Business Website';
        packageName = 'Starter Website Package';
        low = 15000;
        high = 25000;
        timeline = '5–10 working days';
        includes = ['1–3 responsive pages', 'WhatsApp button', 'Contact form', 'Social links', 'Basic SEO'];
      }
    }

    const pageMatch = t.match(/(\d{1,2})\s*(?:page|pages)/);
    if (pageMatch) {
      const pages = Number(pageMatch[1]);
      if (pages >= 10 && !hasEcommerce && !hasAdmin) {
        low = Math.max(low, 75000);
        high = Math.max(high, 120000);
        packageName = 'Corporate Website Package';
        timeline = '18–30 working days';
        reasons.push(`${pages} pages`);
      } else if (pages >= 7 && !hasEcommerce && !hasAdmin) {
        low = Math.max(low, 50000);
        high = Math.max(high, 75000);
        packageName = 'Premium Website Package';
        timeline = '12–20 working days';
        reasons.push(`${pages} pages`);
      }
    }

    if (hasAdmin && !/Admin Panel|Admin Dashboard|CMS/i.test(type)) {
      low += 30000;
      high += 80000;
      includes.push('Admin login and management controls');
      timeline = '15–28 working days';
      reasons.push('admin panel add-on');
    }
    if (hasBooking && !includes.some((item) => /appointment|booking/i.test(item))) {
      low += 10000;
      high += 25000;
      includes.push('Booking or appointment workflow');
      reasons.push('booking system add-on');
    }
    if (hasChatbot && !/Chatbot/i.test(type)) {
      low += 15000;
      high += 40000;
      includes.push('Intelligent chatbot and lead qualification');
      reasons.push('AI chatbot add-on');
    }
    if (hasLeadGen && !/Lead.Generation/i.test(type)) {
      low += 12000;
      high += 25000;
      includes.push('Structured lead-generation flow');
      reasons.push('lead-generation add-on');
    }
    if (hasAnimation) {
      low += 8000;
      high += 30000;
      includes.push('Advanced animation / 3D visual work');
      reasons.push('advanced animation');
    }
    if (hasMultiLanguage) {
      low += 5000;
      high += 15000;
      includes.push('Multilingual content structure');
      reasons.push('multiple languages');
    }
    if (hasPayments && !includes.some((item) => /payment/i.test(item))) {
      low += 10000;
      high += 30000;
      includes.push('Online payment integration setup');
      reasons.push('payment integration');
    }

    const budget = parseBudget(budgetRaw);
    let budgetFit = 'Budget has not been finalised yet. The scope can be adjusted after discussion.';
    if (budget.max != null) {
      if (budget.max < low) {
        budgetFit = `The stated budget appears below the normal starting estimate of ${formatPKR(low)}. We can reduce the first-phase scope or discuss a phased solution.`;
      } else if (budget.min != null && budget.min > high) {
        budgetFit = 'The stated budget is suitable for this project and may allow premium features, stronger animations or additional pages.';
      } else {
        budgetFit = 'The stated budget appears workable for the recommended solution, subject to final feature confirmation.';
      }
    }

    const price = monthly
      ? `${formatPKR(low)}–${formatPKR(high).replace('Rs. ', '')}/month`
      : `${formatPKR(low)}–${formatPKR(high).replace('Rs. ', '')}`;

    return {
      type,
      packageName,
      price,
      low,
      high,
      timeline,
      monthly,
      includes: unique(includes).slice(0, 8),
      reasons: unique(reasons),
      budgetFit,
      confidence
    };
  }

  function projectAdviceReply(raw) {
    const context = state.conversation.requirementContext || raw;
    const analysis = analyzeRequirement(context, state.profile.budget || '');
    const features = analysis.includes.slice(0, 6).map((item) => `• ${item}`).join('\n');
    state.conversation.lastTopic = analysis.type;
    const opening = firstName() ? `${addressUser()}aapki` : 'Aapki';
    return `${opening} requirement ko dekh kar ${analysis.type} suitable lag rahi hai.

Recommended solution: ${analysis.packageName}
Normal estimated price: ${analysis.price}
Estimated timeline: ${analysis.timeline}

Important features:
${features}

${/Marketing/i.test(analysis.type) ? 'Paid advertising budget is separate from the management fee.\n\n' : ''}Ye initial estimate hai; final scope ke mutabiq pricing negotiable hai. ${smartFollowUp(analysis, context)}`;
  }

  function nextLeadStep(lead) {
    if (!lead.name) return 1;
    if (!lead.phone) return 2;
    if (!lead.requirement) return 3;
    if (!lead.business) return 4;
    if (!lead.budget) return 5;
    return 0;
  }

  function leadQuestion(step, isStart = false) {
    const name = addressUser(false);
    const intro = isStart ? 'Aapke sawalat complete ho gaye. Ab main aapka project record bana leta hoon. ' : '';
    if (step === 1) {
      if (state.profile.name) return `${intro}Maine aapka naam “${state.profile.name}” note kiya hai. “Yes” likh kar confirm karein, ya apna correct full name likhein.`;
      return `${intro}Sab se pehle aapka full name kya hai?`;
    }
    if (step === 2) {
      if (state.profile.phone) return `${name ? `${name}, ` : ''}aapka phone/WhatsApp “${state.profile.phone}” hai? Confirm karein ya correct number likhein.`;
      return `${name ? `${name}, ` : ''}apna WhatsApp ya phone number share kar dein.`;
    }
    if (step === 3) {
      if (state.profile.requirement) return `${name ? `${name}, ` : ''}maine aapki requirement ye samjhi hai: “${state.profile.requirement.slice(0, 220)}”. Confirm karein ya complete/correct requirement likhein.`;
      return `${name ? `${name}, ` : ''}ab apni complete website requirement batayein—kis type ki website aur kaun se important features chahiye?`;
    }
    if (step === 4) {
      if (state.profile.business) return `Aapke business/brand ka naam “${state.profile.business}” hai? Confirm karein ya correct naam likhein.`;
      return `Aapke business, company ya brand ka naam kya hai? Agar abhi naam final nahi hai to “Not decided” likh dein.`;
    }
    if (step === 5) {
      if (state.profile.budget) return `Aapka estimated budget “${state.profile.budget}” hai? Confirm karein ya correct budget range likhein.`;
      return `Aapka estimated budget kitna hai? “Not decided” bhi likh sakte hain.`;
    }
    return '';
  }

  function beginLead() {
    state.lead = emptyLead();
    state.lead.active = true;
    state.lead.step = 1;
    return leadQuestion(1, true);
  }

  function validName(value) {
    const clean = value.trim();
    return clean.length >= 2 && clean.length <= 80 && !/^\d+$/.test(clean);
  }

  function validPhone(value) {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  function currentLeadQuestion() {
    return leadQuestion(state.lead.step, false);
  }

  function finalLeadReply(lead) {
    const analysis = analyzeRequirement(lead.requirement, lead.budget);
    lead.analysis = analysis;

    const whatsappMessage = [
      'Hello IRODO, I completed the Smart Assistant consultation.',
      '',
      'CLIENT DETAILS',
      `Name: ${lead.name}`,
      `Phone / WhatsApp: ${lead.phone}`,
      `Business / Brand: ${lead.business || 'Not decided'}`,
      `Client Budget: ${lead.budget}`,
      '',
      'PROJECT REQUIREMENT',
      lead.requirement,
      '',
      'PRELIMINARY PROJECT ASSESSMENT',
      `Recommended website: ${analysis.type}`,
      `Recommended solution: ${analysis.packageName}`,
      `Estimated price: ${analysis.price}`,
      `Estimated timeline: ${analysis.timeline}`,
      `Suggested features: ${analysis.includes.join(', ')}`,
      `Budget assessment: ${analysis.budgetFit}`,
      '',
      'The estimate is negotiable. Final pricing and scope can be agreed after discussion.',
      `IRODO contact: ${displayPhone()}`
    ].join('\n');

    saveLead(lead).catch(() => {});
    const url = whatsappLink(whatsappMessage);
    const listHtml = analysis.includes.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const plainText = [
      `Detailed preliminary project assessment for ${lead.name}`,
      `Phone: ${lead.phone}`,
      `Requirement: ${lead.requirement}`,
      `Business / Brand: ${lead.business || 'Not decided'}`,
      `Budget: ${lead.budget}`,
      `Recommended: ${analysis.type} / ${analysis.packageName}`,
      `Estimate: ${analysis.price}`,
      `Timeline: ${analysis.timeline}`,
      analysis.budgetFit,
      'Pricing is negotiable.'
    ].join('\n');

    const html = `
      <div class="irodo-quote-card">
        <div class="irodo-quote-title">Detailed Preliminary Project Research</div>
        <div class="irodo-quote-row"><span>Client</span><strong>${escapeHtml(lead.name)}</strong></div>
        <div class="irodo-quote-row"><span>Phone</span><strong>${escapeHtml(lead.phone)}</strong></div>
        <div class="irodo-quote-row"><span>Business / Brand</span><strong>${escapeHtml(lead.business || 'Not decided')}</strong></div>
        <div class="irodo-quote-section"><span>Your Requirement</span><p>${escapeHtml(lead.requirement)}</p></div>
        <div class="irodo-quote-row"><span>Recommended Website</span><strong>${escapeHtml(analysis.type)}</strong></div>
        <div class="irodo-quote-row"><span>Recommended Package</span><strong>${escapeHtml(analysis.packageName)}</strong></div>
        <div class="irodo-quote-row highlight"><span>Estimated Price</span><strong>${escapeHtml(analysis.price)}</strong></div>
        <div class="irodo-quote-row"><span>Timeline</span><strong>${escapeHtml(analysis.timeline)}</strong></div>
        <div class="irodo-quote-section"><span>Suggested Features</span><ul>${listHtml}</ul></div>
        <div class="irodo-quote-section"><span>Budget Assessment</span><p>${escapeHtml(analysis.budgetFit)}</p></div>
        <div class="irodo-negotiable">Pricing is negotiable. Scope and final amount can be discussed and agreed in a meeting.</div>
        <div class="irodo-contact-line">IRODO: ${escapeHtml(displayPhone())}</div>
        <a class="irodo-whatsapp-action" href="${url}" target="_blank" rel="noopener">Send Full Details on WhatsApp →</a>
      </div>`;

    return { text: plainText, html };
  }

  function isConfirmation(value) {
    const t = normalize(value);
    return ['yes', 'y', 'confirm', 'confirmed', 'correct', 'right', 'ji', 'jee', 'han', 'haan', 'ha', 'bilkul', 'theek', 'sahi'].includes(t);
  }

  function handleLeadAnswer(raw) {
    const value = raw.trim();
    const t = normalize(value);
    const lead = state.lead;

    if (containsAny(t, ['cancel quote', 'stop quote', 'quotation cancel', 'cancel quotation', 'cancel'])) {
      state.lead = emptyLead();
      return `${addressUser()}project-detail collection cancel kar di gayi hai. Aap apne sawal continue kar sakte hain.`;
    }

    if (lead.step === 1) {
      const nameValue = isConfirmation(value) && state.profile.name ? state.profile.name : value;
      if (!validName(nameValue)) return 'Please apna valid full name share karein.';
      lead.name = nameValue.slice(0, 80);
      state.profile.name = lead.name;
      lead.step = 2;
      return `Shukriya ${addressUser(false)}. ${currentLeadQuestion()}`;
    }

    if (lead.step === 2) {
      const phoneValue = isConfirmation(value) && state.profile.phone ? state.profile.phone : value;
      if (!validPhone(phoneValue)) return 'Number incomplete lag raha hai. Valid number enter karein, misal: 03XX XXXXXXX.';
      lead.phone = phoneValue.slice(0, 30);
      state.profile.phone = lead.phone;
      lead.step = 3;
      return `Perfect, ${addressUser(false)}. ${currentLeadQuestion()}`;
    }

    if (lead.step === 3) {
      const requirementValue = isConfirmation(value) && state.profile.requirement ? state.profile.requirement : value;
      if (requirementValue.length < 8) return 'Requirement thori detail se batayein taake main sahi price aur solution calculate kar sakoon.';
      const unsupported = detectUnsupportedService(requirementValue);
      if (unsupported) return `${unsupportedServiceReply(requirementValue, unsupported)}\n\nAgar aap available services mein se kisi ka project record banana chahte hain to nayi requirement likhein, warna “cancel” likh dein.`;
      lead.requirement = requirementValue.slice(0, 700);
      state.profile.requirement = lead.requirement;
      state.conversation.requirementContext = lead.requirement;
      const preview = analyzeRequirement(lead.requirement, '');
      lead.step = 4;
      return `Samajh gaya. Ye ${preview.type} project lag raha hai, jiska normal estimate ${preview.price} hai. ${currentLeadQuestion()}`;
    }

    if (lead.step === 4) {
      const businessValue = isConfirmation(value) && state.profile.business ? state.profile.business : value;
      lead.business = businessValue.slice(0, 100) || 'Not decided';
      state.profile.business = lead.business;
      lead.step = 5;
      return `Theek hai. ${currentLeadQuestion()}`;
    }

    if (lead.step === 5) {
      const budgetValue = isConfirmation(value) && state.profile.budget ? state.profile.budget : value;
      lead.budget = budgetValue.slice(0, 100) || 'Not decided';
      state.profile.budget = lead.budget;
      lead.active = false;
      lead.step = 0;
      return finalLeadReply(lead);
    }

    return beginLead();
  }

  async function saveLead(lead) {
    if (!CONFIG.apiBaseUrl) return;
    const analysis = lead.analysis || analyzeRequirement(lead.requirement, lead.budget);
    const body = {
      name: lead.name,
      phone: lead.phone,
      email: '',
      businessName: lead.business || '',
      service: mapService(lead.requirement),
      budget: lead.budget,
      timeline: analysis.timeline,
      details: [
        `Requirement: ${lead.requirement}`,
        `Recommended: ${analysis.type}`,
        `Package: ${analysis.packageName}`,
        `Estimate: ${analysis.price}`,
        `Features: ${analysis.includes.join(', ')}`,
        `Budget assessment: ${analysis.budgetFit}`
      ].join('\n')
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
    if (containsAny(t, ['chatbot', 'chat bot'])) return 'other';
    if (containsAny(t, ['website', 'web'])) return 'website';
    return 'other';
  }

  function isQuoteIntent(t) {
    return containsAny(t, ['quote', 'quotation', 'detailed estimate', 'smart quote', 'project assessment', 'free consultation', 'free quote', 'share project', 'project details', 'details share']);
  }

  function isSpecificProjectIntent(raw) {
    const t = normalize(raw);
    const analysis = analyzeRequirement(raw, '');
    const actionWords = ['need', 'want', 'chahiye', 'banani', 'bnani', 'build', 'create', 'make', 'develop', 'price', 'cost', 'kitna', 'integrate', 'integration', 'add', 'connect', 'install'];
    return analysis.confidence && (containsAny(t, actionWords) || containsAny(t, ['website', 'ecommerce', 'dashboard', 'chatbot', 'landing page', 'seo', 'maintenance']));
  }

  function localReply(raw) {
    const t = normalize(raw);
    state.conversation.userTurns += 1;
    captureConversationFacts(raw);

    if (state.lead.active) return handleLeadAnswer(raw);
    if (!t) return 'Please apna sawal type karein.';

    if (containsAny(t, ['cancel quote', 'stop quote', 'quotation cancel'])) {
      state.lead = emptyLead();
      return 'Is waqt koi active project-detail form nahi chal raha. Aap apna sawal pooch sakte hain.';
    }

    const capturedName = extractName(raw);
    if (capturedName && !looksLikeRequirement(raw)) {
      return `Aap se mil kar khushi hui, ${addressUser(false)}. Main ${CONFIG.agentName}, IRODO ka digital sales agent hoon. Batayein, aapko kis website ya digital service ke baare mein maloomat chahiye?`;
    }

    const unsupportedService = detectUnsupportedService(raw);
    if (unsupportedService) {
      state.conversation.substantiveTurns += 1;
      return unsupportedServiceReply(raw, unsupportedService);
    }

    if (isGreeting(t)) {
      const islamicGreeting = containsAny(t, ['assalam', 'asalam', 'salam', 'salaam', 'aoa', 'اسلام علیکم', 'السلام علیکم']);
      const replyGreeting = islamicGreeting ? 'Wa Alaikum Assalam' : 'Hello';
      return `${replyGreeting}${firstName() ? `, ${addressUser(false)}` : ''}! Main ${CONFIG.agentName}, IRODO ka digital sales agent hoon. Website, pricing, features, timeline ya kisi project idea ke baare mein jo poochna ho pooch sakte hain.`;
    }

    if (containsAny(t, ['who are you', 'your name', 'ap ka naam', 'aap ka naam', 'tumhara naam', 'kon ho', 'kaun ho', 'agent name'])) {
      return `Mera naam ${CONFIG.agentName} hai. Main IRODO ka digital sales agent hoon—main clients ko website planning, pricing aur project consultation mein guide karta hoon.`;
    }

    if (containsAny(t, ['are you human', 'real person', 'insan ho', 'human ho', 'bot ho'])) {
      return `Main IRODO ka digital AI agent hoon, human representative nahi. Main aapko proper project guidance deta hoon aur zarurat par aapki details IRODO team ko WhatsApp par bhej deta hoon.`;
    }

    if (isConversationEnding(t)) {
      return beginLead();
    }

    if (isQuoteIntent(t)) return beginLead();

    if (isSpecificProjectIntent(raw) && !containsAny(t, ['all services', 'services list', 'what services'])) {
      state.conversation.substantiveTurns += 1;
      return projectAdviceReply(raw);
    }

    if (containsAny(t, ['service', 'services', 'what do you do', 'kya karte', 'kia krty', 'website type'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}${servicesReply()}`;
    }

    if (containsAny(t, ['price', 'pricing', 'package', 'packages', 'cost', 'rate', 'kitna', 'charges', 'budget'])) {
      state.conversation.substantiveTurns += 1;
      if (state.conversation.requirementContext) return projectAdviceReply(state.conversation.requirementContext);
      return `${pricingReply()}

${addressUser()}aap kis type ki website banwana chahte hain? Uske mutabiq main exact normal range bata dunga.`;
    }

    if (containsAny(t, ['process', 'kaise kaam', 'kasy kam', 'how do you work', 'website kaise banti', 'steps'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}hamara process simple hai: pehle requirement discussion, phir layout/design approval, development, mobile testing, revisions aur final launch. Project start karne se pehle scope, price aur timeline written form mein confirm ki jati hai. Aapke paas content aur images ready hain?`;
    }

    if (containsAny(t, ['time', 'timeline', 'how long', 'delivery', 'days', 'kitne din'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}Starter website usually 5–7 working days, Business 8–12, Premium 12–18 aur Corporate 18–25 working days leti hai. E-commerce aur custom dashboard projects mein zyada time lag sakta hai. Aapka project kis type ka hai?`;
    }

    if (containsAny(t, ['payment', 'advance', 'installment', 'pay', 'deposit'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}standard payment plan 50% advance, 30% design approval ke baad aur 20% final launch se pehle hota hai. Project scope ke hisab se terms discuss ki ja sakti hain.`;
    }

    if (containsAny(t, ['domain', 'hosting', 'plugin', 'license', 'licence'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}domain, hosting, premium plugins, licences aur paid third-party tools project price se separate quote hote hain. IRODO setup aur connection mein bhi help kar sakta hai.`;
    }

    if (containsAny(t, ['backend', 'admin', 'login signup', 'stock', 'manage products', 'cms'])) {
      state.conversation.substantiveTurns += 1;
      appendRequirementContext(raw);
      return `${addressUser()}ji, secure admin panel ban sakta hai jahan products, prices, discounts, stock, orders, bookings ya content manage kiya ja sake. Price exact modules par depend karegi. Admin panel mein aapko kya-kya manage karna hai?`;
    }

    if (containsAny(t, ['responsive', 'mobile', 'phone view', 'tablet'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}ji, website desktop, tablet aur mobile tino ke liye responsive banayi jati hai. Final delivery se pehle major screen sizes par testing bhi hoti hai.`;
    }

    if (containsAny(t, ['seo included', 'seo', 'google ranking', 'on page seo'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}basic on-page SEO mein page titles, descriptions, heading structure, image alt text aur indexing setup include kiya ja sakta hai. Monthly ranking SEO separate service hoti hai.`;
    }

    if (containsAny(t, ['content', 'images', 'photos', 'copywriting', 'text provide'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}client apna original business content aur product/service information de sakta hai. Zarurat par IRODO content structure, copy polishing aur suitable visual guidance bhi provide karta hai; premium stock assets separate ho sakte hain.`;
    }

    if (containsAny(t, ['revision', 'changes', 'edit after', 'update later'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}design stage par agreed revisions ki jati hain. Launch ke baad small updates maintenance plan ya separate task ke through handle kiye ja sakte hain.`;
    }

    if (containsAny(t, ['negotiable', 'negotiate', 'discount', 'kam ho sakta', 'price reduce'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}ji, preliminary pricing negotiable hai. Budget ke mutabiq non-essential features reduce, project phases mein divide, ya suitable final scope agree kiya ja sakta hai.`;
    }

    if (containsAny(t, ['portfolio', 'work', 'projects', 'sample', 'examples'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}IRODO ne restaurant, café, clinic, dental, doctor, salon aur service-business websites par kaam kiya hai, including Safa Cafe, Care 32, Noor’s Beauty Salon aur Dr. Tania Habib. Aap kis category ka sample dekhna chahte hain?`;
    }

    if (containsAny(t, ['meeting', 'call discuss', 'zoom', 'meet'])) {
      state.conversation.substantiveTurns += 1;
      return `${addressUser()}project details collect hone ke baad IRODO team call ya meeting mein scope, design direction, timeline aur negotiable final price discuss kar sakti hai.`;
    }

    if (containsAny(t, ['whatsapp', 'contact', 'human', 'agent', 'call', 'phone', 'number', 'owner'])) {
      const message = `Hello IRODO, I am contacting you through ${CONFIG.agentName}, the website digital agent.`;
      const url = whatsappLink(message);
      const text = `IRODO WhatsApp / Phone: ${displayPhone()}`;
      return {
        text,
        html: `${escapeHtml(addressUser())}${escapeHtml(text)}<br><br><a class="irodo-whatsapp-action inline" href="${url}" target="_blank" rel="noopener">Open WhatsApp →</a>`
      };
    }

    if (containsAny(t, ['location', 'where', 'city', 'pakistan'])) return `${addressUser()}${knowledge.location}`;

    state.conversation.substantiveTurns += 1;
    return `${addressUser()}main aapki exact requirement confirm karna chahta hoon. Ek line mein batayein ke aapko kis cheez mein help chahiye.\n\nIRODO ki main services:\n${conciseServicesList()}\n\nMisal: “Meri existing website mein chatbot integrate karna hai” ya “Mujhe restaurant website with admin panel chahiye.”`;
  }

  async function getReply(message) {
    if (!CONFIG.useApi) return localReply(message);
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
      // Local conversational assistant remains available if the API is offline.
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
