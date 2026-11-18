const nodemailer = require('nodemailer');

// Same function as before: sendEmail(to, subject, text)
//
// Online (Render): sends through Brevo's HTTPS API, because Render's free plan blocks
//   the SMTP ports that Gmail uses. Needs BREVO_API_KEY and EMAIL_FROM.
// Local computer: if BREVO_API_KEY is not set, it falls back to Gmail like before.

const sendWithBrevo = async (to, subject, text) => {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Campus Lost & Found', email: process.env.EMAIL_FROM || process.env.EMAIL_USER },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${res.status}: ${body}`);
  }
  return res.json();
};

let gmailTransporter = null;
const sendWithGmail = (to, subject, text) => {
  if (!gmailTransporter) {
    gmailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return gmailTransporter.sendMail({
    from: `"Campus Lost & Found" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

const sendEmail = async (to, subject, text) => {
  try {
    const info = process.env.BREVO_API_KEY
      ? await sendWithBrevo(to, subject, text)
      : await sendWithGmail(to, subject, text);
    console.log(`[EMAIL SENT] -> ${to}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;