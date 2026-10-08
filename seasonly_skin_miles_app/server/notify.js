'use strict';
/* Email, SMS and web push. Every message is written to the outbox table so the admin panel shows
   what was sent. Without provider credentials, messages are logged instead of delivered (dev mode). */
const nodemailer = require('nodemailer');
const webpush = require('web-push');

function createNotifier(db, env, log = console) {
  const now = () => Date.now();
  const record = (channel, to, subject, body, status, error = null) =>
    db.prepare('INSERT INTO outbox (channel, to_addr, subject, body, status, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(channel, to, subject || null, body, status, error, now());

  const mailer = env.SMTP_URL ? nodemailer.createTransport(env.SMTP_URL) : null;
  const from = env.MAIL_FROM || 'Seasonly <hello@seasonly.fr>';
  const smsReady = !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && (env.TWILIO_FROM || env.TWILIO_MESSAGING_SERVICE_SID));

  // VAPID keys: from env, or generated once and stored so existing subscriptions keep working.
  let vapid = env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY ? { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY } : db.getSetting('vapid');
  if (!vapid) { vapid = webpush.generateVAPIDKeys(); db.setSetting('vapid', vapid); }
  webpush.setVapidDetails(env.VAPID_SUBJECT || 'mailto:hello@seasonly.fr', vapid.publicKey, vapid.privateKey);

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const htmlEmail = (subject, text) => `<!doctype html><html><body style="margin:0;background:#FBFAF9;font-family:Helvetica,Arial,sans-serif;color:#0E0E10">
    <div style="max-width:520px;margin:0 auto;padding:32px 24px">
      <div style="font-family:Georgia,serif;font-size:30px">seasonly</div>
      <div style="font-size:9px;letter-spacing:4px;margin:2px 0 28px 20px">PARIS</div>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:0 0 16px">${esc(subject)}</h1>
      ${text.split(/\n{2,}/).map((p) => `<p style="font-size:15px;line-height:1.55;margin:0 0 14px">${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}
      <p style="font-size:12px;color:#78726F;margin-top:32px">Seasonly Paris · Skin Miles</p>
    </div></body></html>`;

  async function email(to, subject, text) {
    if (!mailer) { record('email', to, subject, text, 'logged'); log.info?.(`[email:logged] ${to} — ${subject}`); return { delivered: false }; }
    try {
      await mailer.sendMail({ from, to, subject, text, html: htmlEmail(subject, text) });
      record('email', to, subject, text, 'sent');
      return { delivered: true };
    } catch (e) { record('email', to, subject, text, 'failed', e.message); throw e; }
  }

  async function sms(to, body) {
    if (!smsReady) { record('sms', to, null, body, 'logged'); log.info?.(`[sms:logged] ${to}`); return { delivered: false }; }
    const params = new URLSearchParams({ To: to, Body: body });
    if (env.TWILIO_MESSAGING_SERVICE_SID) params.set('MessagingServiceSid', env.TWILIO_MESSAGING_SERVICE_SID); else params.set('From', env.TWILIO_FROM);
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    if (!res.ok) { const err = (await res.text()).slice(0, 300); record('sms', to, null, body, 'failed', err); throw new Error('SMS could not be sent.'); }
    record('sms', to, null, body, 'sent');
    return { delivered: true };
  }

  /* Push to every subscription of the given users (or everyone). Expired subscriptions are removed. */
  async function push(userIds, payload) {
    const subs = userIds === 'all'
      ? db.prepare('SELECT * FROM push_subs').all()
      : userIds.length ? db.prepare(`SELECT * FROM push_subs WHERE user_id IN (${userIds.map(() => '?').join(',')})`).all(...userIds) : [];
    let sent = 0, failed = 0;
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 86400 });
        sent++;
      } catch (e) {
        failed++;
        if (e.statusCode === 404 || e.statusCode === 410) db.prepare('DELETE FROM push_subs WHERE id = ?').run(s.id);
      }
    }));
    record('push', userIds === 'all' ? 'all subscribers' : `${userIds.length} user(s)`, payload.title, `${payload.body} — ${sent} delivered, ${failed} failed`, failed && !sent ? 'failed' : 'sent');
    return { subscriptions: subs.length, sent, failed };
  }

  return { email, sms, push, vapidPublicKey: vapid.publicKey, status: { email: !!mailer, sms: smsReady, push: true } };
}

module.exports = { createNotifier };
