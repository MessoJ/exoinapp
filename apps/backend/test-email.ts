/**
 * Email Test Script
 * 
 * This script helps you test the email sending functionality.
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Configure SMTP in .env file:
 *    - SMTP_HOST=smtp.gmail.com
 *    - SMTP_PORT=587
 *    - SMTP_SECURE=false
 *    - SMTP_USER=your-gmail@gmail.com
 *    - SMTP_PASS=your-app-password
 *    - SMTP_FROM_EMAIL=your-gmail@gmail.com
 *    - SMTP_FROM_NAME=Exoin Africa
 * 
 * 2. For Gmail App Password:
 *    a. Go to https://myaccount.google.com
 *    b. Enable 2-Step Verification
 *    c. Go to https://myaccount.google.com/apppasswords
 *    d. Generate an App Password for "Mail"
 *    e. Use that 16-character password as SMTP_PASS
 * 
 * 3. Run this test:
 *    npx ts-node test-email.ts
 * 
 * 4. Or test via the UI:
 *    a. Start the app (npm run dev)
 *    b. Go to Mail page
 *    c. Click Compose
 *    d. Send to: mesofrancis49@gmail.com
 *    e. Check inbox for delivery
 */

import 'dotenv/config';
import { emailService } from './src/services/emailService';

async function testEmail() {
  console.log('\n📧 Email Service Test\n');
  console.log('='.repeat(50));
  
  // 1. Check configuration status
  const status = emailService.getStatus();
  console.log('\n1️⃣ Configuration Status:');
  console.log(`   Configured: ${status.configured ? '✅ Yes' : '❌ No'}`);
  console.log(`   From: ${status.fromName} <${status.fromAddress}>`);
  
  if (!status.configured) {
    console.log('\n⚠️  SMTP not configured!');
    console.log('   Please set these environment variables:');
    console.log('   - SMTP_HOST');
    console.log('   - SMTP_USER');
    console.log('   - SMTP_PASS');
    console.log('\n   See comments at top of this file for Gmail setup.\n');
    return;
  }
  
  // 2. Verify connection
  console.log('\n2️⃣ Testing SMTP Connection...');
  const verifyResult = await emailService.verifyConnection();
  console.log(`   ${verifyResult.success ? '✅' : '❌'} ${verifyResult.message}`);
  
  if (!verifyResult.success) {
    console.log('\n   Connection failed. Check your credentials.\n');
    return;
  }
  
  // 3. Send test email
  const testRecipient = process.env.TEST_EMAIL || 'mesofrancis@outlook.com';
  console.log(`\n3️⃣ Sending Test Email to ${testRecipient}...`);
  
  const result = await emailService.sendEmail({
    to: testRecipient,
    subject: `📧 Test Email from Exoin Africa - ${new Date().toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1E3A8A 0%, #F97316 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 Email System Working!</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="color: #1E3A8A; margin-top: 0;">Congratulations!</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            This is a test email from your Exoin Africa application. If you're reading this, your email system is working correctly!
          </p>
          <ul style="color: #334155; font-size: 14px; line-height: 2;">
            <li>✅ SMTP connection established</li>
            <li>✅ Email composed and sent</li>
            <li>✅ Delivery confirmed</li>
          </ul>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              Sent at: ${new Date().toLocaleString()}<br>
              From: Exoin Africa Email System
            </p>
          </div>
        </div>
      </div>
    `,
    text: 'This is a test email from Exoin Africa. Your email system is working correctly!',
    priority: 'normal',
  });
  
  if (result.success) {
    console.log('\n   ✅ Email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Accepted: ${result.accepted.join(', ')}`);
    console.log(`\n   📬 Check ${testRecipient} for the test email!\n`);
  } else {
    console.log('\n   ❌ Failed to send email');
    console.log(`   Error: ${result.error}`);
    console.log(`   Rejected: ${result.rejected.join(', ')}\n`);
  }
  
  console.log('='.repeat(50));
  console.log('Test complete!\n');
}

testEmail().catch(console.error);
