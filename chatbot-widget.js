:root {
  --irodo-blue: #0029cc;
  --irodo-blue-dark: #071f7e;
  --irodo-cyan: #06b6d4;
  --irodo-ink: #101828;
  --irodo-muted: #667085;
  --irodo-bg: #f5f7ff;
}

#irodo-chatbot-root,
#irodo-chatbot-root * {
  box-sizing: border-box;
}

.irodo-chat-launcher {
  position: fixed;
  right: 22px;
  bottom: 92px;
  z-index: 2147483000;
  width: 62px;
  height: 62px;
  border: 0;
  border-radius: 22px;
  background: linear-gradient(135deg, var(--irodo-blue), #3654ff 58%, var(--irodo-cyan));
  color: #fff;
  box-shadow: 0 18px 45px rgba(0, 41, 204, 0.34);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform .2s ease, box-shadow .2s ease;
}

.irodo-chat-launcher:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 24px 54px rgba(0, 41, 204, 0.42);
}

.irodo-chat-launcher svg { width: 28px; height: 28px; }
.irodo-chat-launcher .pulse {
  position: absolute;
  right: -1px;
  top: -1px;
  width: 15px;
  height: 15px;
  border-radius: 999px;
  background: #22c55e;
  border: 3px solid #fff;
}

.irodo-chat-panel {
  position: fixed;
  right: 22px;
  bottom: 168px;
  z-index: 2147483001;
  width: min(390px, calc(100vw - 28px));
  height: min(620px, calc(100vh - 205px));
  min-height: 480px;
  border: 1px solid rgba(16, 24, 40, .08);
  border-radius: 26px;
  background: rgba(255,255,255,.98);
  box-shadow: 0 30px 90px rgba(16,24,40,.24);
  overflow: hidden;
  display: none;
  flex-direction: column;
  font-family: Poppins, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  transform-origin: bottom right;
}

.irodo-chat-panel.is-open {
  display: flex;
  animation: irodoChatOpen .22s ease-out;
}

@keyframes irodoChatOpen {
  from { opacity: 0; transform: translateY(12px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.irodo-chat-header {
  padding: 16px 16px 15px;
  color: #fff;
  background:
    radial-gradient(circle at 90% 0%, rgba(6,182,212,.45), transparent 34%),
    linear-gradient(135deg, #071a69, var(--irodo-blue));
  display: flex;
  gap: 12px;
  align-items: center;
}

.irodo-chat-avatar {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: rgba(255,255,255,.13);
  border: 1px solid rgba(255,255,255,.25);
  display: grid;
  place-items: center;
  overflow: hidden;
  flex: 0 0 auto;
}
.irodo-chat-avatar img { width: 100%; height: 100%; object-fit: cover; }
.irodo-chat-title { min-width: 0; flex: 1; }
.irodo-chat-title strong { display: block; font-size: 15px; line-height: 1.3; }
.irodo-chat-title span { display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 11px; color: #dbeafe; }
.irodo-chat-title i { width: 7px; height: 7px; border-radius: 999px; background: #4ade80; display: inline-block; }
.irodo-chat-close {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 13px;
  color: #fff;
  background: rgba(255,255,255,.12);
  cursor: pointer;
  font-size: 22px;
}

.irodo-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 18px 14px 14px;
  background:
    linear-gradient(rgba(245,247,255,.94), rgba(245,247,255,.94)),
    radial-gradient(circle at 30% 20%, rgba(0,41,204,.08), transparent 42%);
  scroll-behavior: smooth;
}

.irodo-msg-row { display: flex; margin: 0 0 12px; }
.irodo-msg-row.user { justify-content: flex-end; }
.irodo-msg {
  max-width: 84%;
  padding: 11px 13px;
  border-radius: 17px;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
.irodo-msg.bot {
  color: #344054;
  background: #fff;
  border: 1px solid #e6eaf2;
  border-bottom-left-radius: 6px;
  box-shadow: 0 6px 18px rgba(16,24,40,.05);
}
.irodo-msg.user {
  color: #fff;
  background: linear-gradient(135deg, var(--irodo-blue), #3654ff);
  border-bottom-right-radius: 6px;
}
.irodo-msg a { color: inherit; font-weight: 700; text-decoration: underline; }
.irodo-msg-time { display: block; opacity: .62; font-size: 9px; margin-top: 5px; }

.irodo-typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  min-width: 56px;
}
.irodo-typing i { width: 7px; height: 7px; border-radius: 999px; background: #98a2b3; animation: irodoTyping 1s infinite ease-in-out; }
.irodo-typing i:nth-child(2) { animation-delay: .14s; }
.irodo-typing i:nth-child(3) { animation-delay: .28s; }
@keyframes irodoTyping { 0%, 60%, 100% { transform: translateY(0); opacity: .45; } 30% { transform: translateY(-4px); opacity: 1; } }

.irodo-chat-quick {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  overflow-x: auto;
  background: #fff;
  border-top: 1px solid #eef1f6;
  scrollbar-width: none;
}
.irodo-chat-quick::-webkit-scrollbar { display:none; }
.irodo-quick-btn {
  flex: 0 0 auto;
  border: 1px solid #dbe3ff;
  background: #f8faff;
  color: var(--irodo-blue);
  border-radius: 999px;
  padding: 8px 11px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.irodo-quick-btn:hover { background: #eef3ff; }

.irodo-chat-compose {
  display: flex;
  gap: 9px;
  align-items: flex-end;
  padding: 12px;
  background: #fff;
  border-top: 1px solid #eef1f6;
}
.irodo-chat-input {
  flex: 1;
  min-height: 44px;
  max-height: 108px;
  resize: none;
  border: 1px solid #dfe4ec;
  border-radius: 15px;
  padding: 11px 12px;
  outline: none;
  color: var(--irodo-ink);
  background: #fff;
  font: inherit;
  font-size: 13px;
  line-height: 1.45;
}
.irodo-chat-input:focus { border-color: #7890f5; box-shadow: 0 0 0 4px rgba(0,41,204,.08); }
.irodo-chat-send {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border: 0;
  border-radius: 15px;
  background: var(--irodo-blue);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.irodo-chat-send:disabled { opacity: .55; cursor: not-allowed; }
.irodo-chat-send svg { width: 19px; height: 19px; }

.irodo-chat-note {
  padding: 0 12px 10px;
  text-align: center;
  background: #fff;
  color: #98a2b3;
  font-size: 9px;
}

@media (max-width: 640px) {
  .irodo-chat-launcher { right: 14px; bottom: 82px; }
  .irodo-chat-panel {
    right: 8px;
    bottom: 151px;
    width: calc(100vw - 16px);
    height: min(650px, calc(100vh - 165px));
    border-radius: 22px;
  }
}

/* Intelligent quotation assessment */
.irodo-quote-card {
  display: grid;
  gap: 9px;
  white-space: normal;
}

.irodo-quote-title {
  font-weight: 800;
  color: var(--irodo-blue-dark);
  font-size: 14px;
  padding-bottom: 9px;
  border-bottom: 1px solid #e6eaf2;
}

.irodo-quote-row {
  display: grid;
  gap: 3px;
  padding: 8px 9px;
  border-radius: 11px;
  background: #f8faff;
  border: 1px solid #e8edff;
}

.irodo-quote-row span,
.irodo-quote-section > span {
  color: #667085;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.irodo-quote-row strong {
  color: #1d2939;
  font-size: 12px;
}

.irodo-quote-row.highlight {
  background: #eef3ff;
  border-color: #cdd8ff;
}

.irodo-quote-row.highlight strong {
  color: var(--irodo-blue);
  font-size: 14px;
}

.irodo-quote-section {
  padding: 9px;
  border-radius: 11px;
  background: #fff;
  border: 1px solid #e6eaf2;
}

.irodo-quote-section p {
  margin: 5px 0 0;
  color: #344054;
  font-size: 12px;
  line-height: 1.55;
}

.irodo-quote-section ul {
  margin: 7px 0 0;
  padding-left: 18px;
  color: #344054;
  font-size: 12px;
  line-height: 1.55;
}

.irodo-negotiable {
  padding: 10px;
  border-radius: 11px;
  background: #ecfdf3;
  border: 1px solid #abefc6;
  color: #067647;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.5;
}

.irodo-contact-line {
  color: #344054;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.irodo-whatsapp-action {
  display: block;
  padding: 11px 12px;
  border-radius: 12px;
  color: #fff !important;
  background: #16a34a;
  text-align: center;
  text-decoration: none !important;
  font-size: 12px;
  font-weight: 800;
}

.irodo-whatsapp-action:hover { background: #15803d; }
.irodo-whatsapp-action.inline { display: inline-block; }


/* Clear WhatsApp branding inside chatbot actions */
.irodo-whatsapp-action .irodo-wa-icon {
  width: 20px;
  height: 20px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 7px;
  object-fit: contain;
}
