const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from: `"DealsDoubled" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });
};

module.exports = { sendMail, transporter };
