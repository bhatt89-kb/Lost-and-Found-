const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: `"Campus Lost & Found" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`[EMAIL SENT] -> ${to}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;