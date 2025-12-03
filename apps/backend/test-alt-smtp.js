/**
 * Alternative SMTP Test
 * 
 * Testing with different SMTP providers to diagnose delivery issues.
 * 
 * The mail.exoinafrica.com server accepts emails but may not be
 * delivering them because:
 * 1. DigitalOcean blocks port 25 outbound by default
 * 2. Postfix may need relay configuration
 * 
 * Solutions:
 * A) Request DigitalOcean to unblock port 25
 * B) Configure Postfix to use a relay (SendGrid, Mailgun, Brevo)
 * C) Use an external SMTP service directly from the app
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Test with different SMTP configurations
async function testAlternativeSMTP() {
  console.log('=== Alternative SMTP Tests ===\n');
  
  // Get credentials from environment variables
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpUser || !smtpPass) {
    console.log('Error: SMTP credentials not configured.');
    console.log('Please set SMTP_USER and SMTP_PASS environment variables.');
    process.exit(1);
  }
  
  // Option 1: Direct via port 587 (submission port - often not blocked)
  console.log('--- Test 1: Port 587 (STARTTLS) ---');
  try {
    const transporter587 = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.exoinafrica.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    const verify587 = await transporter587.verify();
    console.log('Port 587 connection:', verify587 ? '✅ OK' : '❌ Failed');
    
    if (verify587) {
      const result = await transporter587.sendMail({
        from: '"Exoin Africa" <admin@exoinafrica.com>',
        to: 'mesofrancis49@gmail.com',
        subject: 'Port 587 Test - ' + new Date().toISOString(),
        text: 'Testing email via port 587',
        html: '<p>Testing email via port 587 at ' + new Date().toISOString() + '</p>'
      });
      console.log('Sent via 587:', result.messageId);
      console.log('Response:', result.response);
    }
  } catch (err) {
    console.log('Port 587 error:', err.message);
  }
  
  console.log('\n--- Test 2: Check if server is relaying ---');
  console.log('If emails are queued but not delivered, the mail server');
  console.log('may need configuration to relay through an external service.\n');
  
  console.log('Recommended solution: Configure Postfix on the mail server');
  console.log('to use a relay host like SendGrid, Mailgun, or Brevo.\n');
  
  console.log('Alternative: Update .env to use Gmail SMTP directly:');
  console.log('  SMTP_HOST="smtp.gmail.com"');
  console.log('  SMTP_PORT="587"');
  console.log('  SMTP_SECURE="false"');
  console.log('  SMTP_USER="your-gmail@gmail.com"');
  console.log('  SMTP_PASS="your-app-password"');
}

testAlternativeSMTP().catch(console.error);
