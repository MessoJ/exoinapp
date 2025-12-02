// Test script to verify IMAP connection to Mailu server
// Run with: npx ts-node test-imap.ts

import { ImapFlow } from 'imapflow';

const IMAP_HOST = 'mail.exoinafrica.com';
const IMAP_PORT = 993;
const EMAIL = 'admin@exoinafrica.com';
const PASSWORD = 'Admin@2030';

async function testIMAPConnection() {
  console.log('🔌 Testing IMAP Connection');
  console.log(`   Server: ${IMAP_HOST}:${IMAP_PORT}`);
  console.log(`   User: ${EMAIL}`);
  console.log('');

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
    logger: {
      debug: (msg) => console.log('  [DEBUG]', msg.msg || msg),
      info: (msg) => console.log('  [INFO]', msg.msg || msg),
      warn: (msg) => console.log('  [WARN]', msg.msg || msg),
      error: (msg) => console.log('  [ERROR]', msg.msg || msg),
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
    },
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });

  try {
    console.log('1️⃣ Connecting...');
    await client.connect();
    console.log('   ✅ Connected successfully!\n');

    console.log('2️⃣ Listing folders...');
    const folders = await client.list();
    console.log(`   ✅ Found ${folders.length} folders:`);
    for (const folder of folders) {
      console.log(`      - ${folder.path} (${folder.name})`);
    }
    console.log('');

    console.log('3️⃣ Opening INBOX...');
    const mailbox = await client.mailboxOpen('INBOX');
    console.log(`   ✅ INBOX opened: ${mailbox.exists} messages\n`);

    console.log('4️⃣ Fetching last 5 messages...');
    if (mailbox.exists > 0) {
      const messages: any[] = [];
      for await (const message of client.fetch(
        `${Math.max(1, mailbox.exists - 4)}:${mailbox.exists}`,
        { envelope: true, bodyStructure: true }
      )) {
        messages.push({
          uid: message.uid,
          subject: message.envelope?.subject || '(no subject)',
          from: message.envelope?.from?.[0]?.address || 'unknown',
          date: message.envelope?.date,
        });
      }
      console.log('   ✅ Messages:');
      for (const msg of messages.reverse()) {
        console.log(`      [${msg.uid}] ${msg.subject} - from ${msg.from}`);
      }
    } else {
      console.log('   📭 No messages in INBOX');
    }
    console.log('');

    console.log('5️⃣ Logging out...');
    await client.logout();
    console.log('   ✅ Logged out cleanly\n');

    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED - IMAP is working!');
    console.log('═══════════════════════════════════════');
    
  } catch (error: any) {
    console.error('\n❌ IMAP Test Failed!');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Response:', error.responseText);
    console.error('\n   Full error:', error);
    process.exit(1);
  }
}

testIMAPConnection();
