/**
 * Brevo (Sendinblue) SMTP Setup
 * 
 * Brevo offers 300 free emails/day
 * 
 * Steps to get Brevo SMTP credentials:
 * 1. Go to https://www.brevo.com/
 * 2. Create a free account
 * 3. Go to Settings > SMTP & API
 * 4. Copy your SMTP credentials
 * 
 * Then update .env:
 * SMTP_HOST="smtp-relay.brevo.com"
 * SMTP_PORT="587"
 * SMTP_SECURE="false"
 * SMTP_USER="your-brevo-email@example.com"
 * SMTP_PASS="your-brevo-smtp-key"
 * SMTP_FROM_EMAIL="admin@exoinafrica.com"
 * SMTP_FROM_NAME="Exoin Africa"
 * 
 * Note: With Brevo, you can send FROM any verified domain,
 * so you can still use admin@exoinafrica.com as the sender.
 */

const nodemailer = require('nodemailer');

// Test with Brevo SMTP (if you have credentials)
async function testBrevoSMTP() {
  // Replace with your Brevo credentials
  const BREVO_USER = process.env.BREVO_USER || '';
  const BREVO_PASS = process.env.BREVO_PASS || '';
  
  if (!BREVO_USER || !BREVO_PASS) {
    console.log('=== Brevo SMTP Setup ===\n');
    console.log('To use Brevo (free 300 emails/day):');
    console.log('1. Sign up at https://www.brevo.com/');
    console.log('2. Go to Settings > SMTP & API');
    console.log('3. Get your SMTP key');
    console.log('4. Update your .env file:\n');
    console.log('   SMTP_HOST="smtp-relay.brevo.com"');
    console.log('   SMTP_PORT="587"');
    console.log('   SMTP_SECURE="false"');
    console.log('   SMTP_USER="your-brevo-login-email"');
    console.log('   SMTP_PASS="your-brevo-smtp-key"\n');
    console.log('5. Verify exoinafrica.com domain in Brevo settings');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: BREVO_USER,
      pass: BREVO_PASS
    }
  });

  console.log('Testing Brevo SMTP...');
  const verify = await transporter.verify();
  console.log('Connection:', verify ? '✅ OK' : '❌ Failed');

  if (verify) {
    const result = await transporter.sendMail({
      from: '"Exoin Africa" <admin@exoinafrica.com>',
      to: 'mesofrancis49@gmail.com',
      subject: 'Brevo SMTP Test - ' + new Date().toISOString(),
      text: 'Testing email via Brevo SMTP relay',
      html: '<p>Testing email via Brevo at ' + new Date().toISOString() + '</p>'
    });
    console.log('✅ Email sent via Brevo!');
    console.log('Message ID:', result.messageId);
  }
}

testBrevoSMTP().catch(console.error);
