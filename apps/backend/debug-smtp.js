const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('=== SMTP Debug Test ===\n');
  
  const config = {
    host: 'mail.exoinafrica.com',
    port: 465,
    secure: true,
    auth: {
      user: 'admin@exoinafrica.com',
      pass: 'Admin@2030'
    },
    debug: true,
    logger: true
  };
  
  console.log('Config:', JSON.stringify({ ...config, auth: { user: config.auth.user, pass: '***' } }, null, 2));
  
  const transporter = nodemailer.createTransport(config);

  console.log('\n--- Verifying connection ---');
  try {
    const verify = await transporter.verify();
    console.log('✅ Verify result:', verify);
  } catch (err) {
    console.log('❌ Verify error:', err.message);
    return;
  }

  console.log('\n--- Sending test email to Gmail ---');
  try {
    const result = await transporter.sendMail({
      from: '"Exoin Test" <admin@exoinafrica.com>',
      to: 'mesofrancis49@gmail.com',
      subject: 'Direct SMTP Test - ' + new Date().toISOString(),
      text: 'This is a direct SMTP test sent at ' + new Date().toISOString(),
      html: '<h1>SMTP Test</h1><p>This email was sent at: ' + new Date().toISOString() + '</p>'
    });

    console.log('\n✅ Email sent!');
    console.log('   Message ID:', result.messageId);
    console.log('   Accepted:', result.accepted);
    console.log('   Rejected:', result.rejected);
    console.log('   Response:', result.response);
  } catch (err) {
    console.log('❌ Send error:', err.message);
    console.log('   Full error:', err);
  }
}

testSMTP();
