import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const domains = await prisma.emailDomain.findMany({
    include: { dnsRecords: true }
  });
  
  if (domains.length === 0) {
    console.log('No email domains found in database.');
    console.log('\nYou need to add exoinafrica.com domain first via the Email Hosting page.');
  } else {
    domains.forEach(domain => {
      console.log('\n========================================');
      console.log(`Domain: ${domain.domain}`);
      console.log(`Verified: ${domain.isVerified}`);
      console.log('========================================\n');
      
      console.log('DNS Records to configure:\n');
      domain.dnsRecords.forEach(record => {
        console.log(`Type: ${record.recordType}`);
        console.log(`Name: ${record.name}`);
        console.log(`Value: ${record.value}`);
        if (record.priority) console.log(`Priority: ${record.priority}`);
        console.log('---');
      });
    });
  }
}

main().finally(() => prisma.$disconnect());
