require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing email with:');
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_APP_PASSWORD length:', process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.length : 0);

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Error:', error);
  } else {
    console.log('Server is ready to send emails');
    
    // Test sending an email
    transporter.sendMail({
      from: `"Test" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Send to yourself
      subject: 'Test Email',
      text: 'This is a test email to verify the SMTP setup',
      html: '<p>This is a test email to verify the SMTP setup</p>'
    }, (err, info) => {
      if (err) {
        console.error('Failed to send test email:', err);
      } else {
        console.log('Test email sent:', info.response);
      }
    });
  }
});