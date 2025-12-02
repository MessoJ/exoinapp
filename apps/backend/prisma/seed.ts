import { PrismaClient, UserRole, DocumentType, DocumentStatus, AssetType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ==================== COMPANY ====================
  const company = await prisma.company.upsert({
    where: { id: 'exoin-africa-001' },
    update: {},
    create: {
      id: 'exoin-africa-001',
      name: 'Exoin Africa',
      tagline: 'Powering African Innovation',
      email: 'info@exoinafrica.com',
      phone: '+254 700 000 000',
      website: 'https://exoin.africa',
      addressLine1: 'Exoin Tower, Westlands',
      addressLine2: 'Floor 12, Suite A',
      city: 'Nairobi',
      country: 'Kenya',
      postalCode: '00100',
      primaryColor: '#1E3A8A',
      secondaryColor: '#F97316',
      taxId: 'P051234567A',
      registrationNo: 'PVT-2024-12345',
      bankName: 'Equity Bank',
      bankAccount: '1234567890',
      bankBranch: 'Westlands Branch',
    },
  });
  console.log('✅ Company created:', company.name);

  // ==================== ADMIN USER ====================
  const adminPassword = await argon2.hash('Admin@123');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@exoinafrica.com' },
    update: {},
    create: {
      email: 'admin@exoinafrica.com',
      passwordHash: adminPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.ADMIN,
      jobTitle: 'Chief Executive Officer',
      phone: '+254 712 345 678',
      companyId: company.id,
      // Email Signature
      signatureEnabled: true,
      signatureStyle: 'executive',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      twitterUrl: 'https://x.com/johndoe',
      instagramUrl: 'https://instagram.com/exoinafrica',
      location: 'Nairobi, Kenya',
      officeAddress: 'Exoin Tower, Westlands Road',
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // ==================== STAFF USERS ====================
  const staffPassword = await argon2.hash('Staff@123');
  
  const staffUser1 = await prisma.user.upsert({
    where: { email: 'jane@exoinafrica.com' },
    update: {},
    create: {
      email: 'jane@exoinafrica.com',
      passwordHash: staffPassword,
      firstName: 'Jane',
      lastName: 'Wanjiku',
      role: UserRole.STAFF,
      jobTitle: 'Senior Engineer',
      phone: '+254 723 456 789',
      companyId: company.id,
      signatureEnabled: true,
      signatureStyle: 'executive',
      location: 'Nairobi, Kenya',
      officeAddress: 'Exoin Tower, Westlands Road',
    },
  });

  const staffUser2 = await prisma.user.upsert({
    where: { email: 'peter@exoinafrica.com' },
    update: {},
    create: {
      email: 'peter@exoinafrica.com',
      passwordHash: staffPassword,
      firstName: 'Peter',
      lastName: 'Ochieng',
      role: UserRole.MANAGER,
      jobTitle: 'Operations Manager',
      phone: '+254 734 567 890',
      companyId: company.id,
    },
  });
  console.log('✅ Staff users created');

  // ==================== CLIENTS ====================
  const client1 = await prisma.client.upsert({
    where: { id: 'client-klogistics' },
    update: {},
    create: {
      id: 'client-klogistics',
      name: 'K-Logistics Ltd.',
      email: 'accounts@klogistics.co.ke',
      phone: '+254 700 111 222',
      contactPerson: 'Accounts Payable',
      addressLine1: 'Mombasa Road, Unit 4B',
      city: 'Nairobi',
      country: 'Kenya',
      companyId: company.id,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'client-safaricom' },
    update: {},
    create: {
      id: 'client-safaricom',
      name: 'Safaricom PLC',
      email: 'procurement@safaricom.co.ke',
      phone: '+254 722 000 000',
      contactPerson: 'Procurement Department',
      addressLine1: 'Safaricom House, Waiyaki Way',
      city: 'Nairobi',
      country: 'Kenya',
      companyId: company.id,
    },
  });

  const client3 = await prisma.client.upsert({
    where: { id: 'client-kplc' },
    update: {},
    create: {
      id: 'client-kplc',
      name: 'Kenya Power & Lighting Co.',
      email: 'finance@kplc.co.ke',
      phone: '+254 703 054 000',
      contactPerson: 'Finance Division',
      addressLine1: 'Stima Plaza, Kolobot Road',
      city: 'Nairobi',
      country: 'Kenya',
      companyId: company.id,
    },
  });
  console.log('✅ Clients created');

  // ==================== SAMPLE INVOICE ====================
  const invoice1 = await prisma.document.upsert({
    where: { id: 'inv-2025-0042' },
    update: {},
    create: {
      id: 'inv-2025-0042',
      documentNumber: 'INV-2025-0042',
      type: DocumentType.INVOICE,
      status: DocumentStatus.SENT,
      issueDate: new Date('2025-10-26'),
      dueDate: new Date('2025-11-10'),
      subtotal: 165000,
      taxRate: 16,
      taxAmount: 26400,
      total: 191400,
      currency: 'KES',
      notes: 'Thank you for your business. Payment due within 15 days.',
      terms: 'Net 15',
      companyId: company.id,
      clientId: client1.id,
      createdById: adminUser.id,
      items: {
        create: [
          {
            description: 'Autonomous Floor Scrubbing (Zone A)',
            quantity: 1,
            unitPrice: 50000,
            total: 50000,
          },
          {
            description: 'High-Bay Drone Inspection',
            quantity: 4,
            unitPrice: 15000,
            total: 60000,
          },
          {
            description: 'Power Scrub™ Chemical Supply (20L)',
            quantity: 10,
            unitPrice: 4500,
            total: 45000,
          },
          {
            description: 'Technician Deployment (Supervisor)',
            quantity: 2,
            unitPrice: 5000,
            total: 10000,
          },
        ],
      },
    },
  });
  console.log('✅ Sample Invoice created:', invoice1.documentNumber);

  // ==================== SAMPLE QUOTATION ====================
  const quotation1 = await prisma.document.upsert({
    where: { id: 'quo-2025-0018' },
    update: {},
    create: {
      id: 'quo-2025-0018',
      documentNumber: 'QUO-2025-0018',
      type: DocumentType.QUOTATION,
      status: DocumentStatus.DRAFT,
      issueDate: new Date('2025-11-20'),
      dueDate: new Date('2025-12-05'),
      subtotal: 450000,
      taxRate: 16,
      taxAmount: 72000,
      total: 522000,
      currency: 'KES',
      notes: 'This quotation is valid for 15 days from the issue date.',
      terms: 'Valid for 15 days',
      companyId: company.id,
      clientId: client2.id,
      createdById: staffUser2.id,
      items: {
        create: [
          {
            description: 'Enterprise Cleaning Solution - Annual Contract',
            quantity: 1,
            unitPrice: 300000,
            total: 300000,
          },
          {
            description: 'Smart Sensor Installation (10 units)',
            quantity: 10,
            unitPrice: 8000,
            total: 80000,
          },
          {
            description: 'Monthly Maintenance Package',
            quantity: 12,
            unitPrice: 5833,
            total: 70000,
          },
        ],
      },
    },
  });
  console.log('✅ Sample Quotation created:', quotation1.documentNumber);

  // ==================== TEMPLATES ====================
  const invoiceTemplate = await prisma.template.upsert({
    where: { id: 'template-invoice-default' },
    update: {},
    create: {
      id: 'template-invoice-default',
      name: 'Modern Invoice',
      type: DocumentType.INVOICE,
      description: 'Clean, professional invoice template with orange accent',
      isDefault: true,
      config: {
        accentColor: '#F97316',
        showLogo: true,
        showQrCode: true,
        footerText: 'Thank you for your business',
      },
      companyId: company.id,
    },
  });

  const quotationTemplate = await prisma.template.upsert({
    where: { id: 'template-quotation-default' },
    update: {},
    create: {
      id: 'template-quotation-default',
      name: 'Sales Proposal',
      type: DocumentType.QUOTATION,
      description: 'Professional quotation template for sales proposals',
      isDefault: true,
      config: {
        accentColor: '#1E3A8A',
        showLogo: true,
        showTerms: true,
        validityDays: 15,
      },
      companyId: company.id,
    },
  });

  const letterheadTemplate = await prisma.template.upsert({
    where: { id: 'template-letterhead-default' },
    update: {},
    create: {
      id: 'template-letterhead-default',
      name: 'Official Letterhead',
      type: DocumentType.LETTERHEAD,
      description: 'Formal letterhead for official correspondence',
      isDefault: true,
      config: {
        headerStyle: 'modern',
        showFooter: true,
        watermark: false,
      },
      companyId: company.id,
    },
  });
  console.log('✅ Templates created');

  // ==================== SAMPLE EMAILS ====================
  // Clear existing emails first
  await prisma.email.deleteMany({});
  
  // Admin inbox emails
  const adminEmails = await prisma.email.createMany({
    data: [
      {
        messageId: '<welcome-001@exoinafrica.com>',
        folder: 'INBOX',
        fromName: 'ExoinAfrica Platform',
        fromAddress: 'noreply@exoinafrica.com',
        toAddresses: ['admin@exoinafrica.com'],
        ccAddresses: [],
        bccAddresses: [],
        subject: 'Welcome to ExoinAfrica Workspace',
        textBody: 'Welcome to your new workspace! We are excited to have you on board. Your workspace account has been successfully created.',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F97316;">Welcome to ExoinAfrica Workspace!</h2>
            <p>Dear Team Member,</p>
            <p>We are excited to have you on board. Your workspace account has been successfully created.</p>
            <p>Here's what you can do:</p>
            <ul>
              <li>Create and manage documents (Invoices, Quotations, Letterheads)</li>
              <li>Access brand assets and templates</li>
              <li>Manage clients and contacts</li>
              <li>Send and receive emails</li>
            </ul>
            <p>If you have any questions, please don't hesitate to reach out.</p>
            <p>Best regards,<br/>The ExoinAfrica Team</p>
          </div>
        `,
        snippet: 'Welcome to your new workspace! We are excited to have you on board...',
        isRead: false,
        isStarred: false,
        hasAttachments: false,
        userId: adminUser.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        messageId: '<invoice-notification-001@exoinafrica.com>',
        folder: 'INBOX',
        fromName: 'Billing System',
        fromAddress: 'billing@exoinafrica.com',
        toAddresses: ['admin@exoinafrica.com'],
        ccAddresses: [],
        bccAddresses: [],
        subject: 'Invoice INV-2025-0042 has been sent to K-Logistics Ltd.',
        textBody: 'Invoice INV-2025-0042 for KES 191,400.00 has been successfully sent to K-Logistics Ltd. You can track its status in the Documents section.',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h3 style="color: #1E3A8A;">Invoice Notification</h3>
            <p>Invoice <strong>INV-2025-0042</strong> for <strong>KES 191,400.00</strong> has been successfully sent to K-Logistics Ltd.</p>
            <p>You can track its status in the Documents section.</p>
            <p><a href="#" style="color: #F97316;">View Invoice →</a></p>
          </div>
        `,
        snippet: 'Invoice INV-2025-0042 for KES 191,400.00 has been successfully sent to K-Logistics Ltd.',
        isRead: true,
        isStarred: false,
        hasAttachments: true,
        userId: adminUser.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      },
      {
        messageId: '<meeting-reminder-001@exoinafrica.com>',
        folder: 'INBOX',
        fromName: 'Jane Wanjiku',
        fromAddress: 'jane@exoinafrica.com',
        toAddresses: ['admin@exoinafrica.com'],
        ccAddresses: ['peter@exoinafrica.com'],
        bccAddresses: [],
        subject: 'Meeting Tomorrow at 10 AM - Q4 Review',
        textBody: 'Hi John, Just a reminder about our Q4 review meeting tomorrow at 10 AM. We will be discussing the quarterly results and planning for next year.',
        htmlBody: `
          <div style="font-family: Arial, sans-serif;">
            <p>Hi John,</p>
            <p>Just a reminder about our <strong>Q4 review meeting</strong> tomorrow at <strong>10 AM</strong>.</p>
            <p>We will be discussing:</p>
            <ul>
              <li>Quarterly results</li>
              <li>Client feedback summary</li>
              <li>Planning for next year</li>
            </ul>
            <p>See you there!</p>
            <p>Best,<br/>Jane</p>
          </div>
        `,
        snippet: 'Hi John, Just a reminder about our Q4 review meeting tomorrow at 10 AM...',
        isRead: true,
        isStarred: true,
        hasAttachments: false,
        userId: adminUser.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      },
      {
        messageId: '<quotation-request-001@techsolutions.co.ke>',
        folder: 'INBOX',
        fromName: 'Tech Solutions Procurement',
        fromAddress: 'procurement@techsolutions.co.ke',
        toAddresses: ['admin@exoinafrica.com'],
        ccAddresses: [],
        bccAddresses: [],
        subject: 'Quotation Request - Office Equipment',
        textBody: 'Dear ExoinAfrica, We would like to request a quotation for office equipment and cleaning services for our new branch in Mombasa.',
        htmlBody: `
          <div style="font-family: Arial, sans-serif;">
            <p>Dear ExoinAfrica,</p>
            <p>We would like to request a quotation for the following:</p>
            <ul>
              <li>Industrial cleaning equipment (2 units)</li>
              <li>Monthly maintenance contract</li>
              <li>Staff training for our team</li>
            </ul>
            <p>This is for our new branch in Mombasa, opening January 2026.</p>
            <p>Please send your quotation at your earliest convenience.</p>
            <p>Kind regards,<br/>Procurement Team<br/>Tech Solutions Ltd</p>
          </div>
        `,
        snippet: 'Dear ExoinAfrica, We would like to request a quotation for office equipment...',
        isRead: false,
        isStarred: false,
        hasAttachments: false,
        userId: adminUser.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
      },
      {
        messageId: '<brand-update-001@exoinafrica.com>',
        folder: 'INBOX',
        fromName: 'Design Team',
        fromAddress: 'design@exoinafrica.com',
        toAddresses: ['admin@exoinafrica.com'],
        ccAddresses: ['jane@exoinafrica.com', 'peter@exoinafrica.com'],
        bccAddresses: [],
        subject: 'Brand Guidelines Update - New Logo Variations',
        textBody: 'Hi Team, We have updated our brand guidelines with new logo variations for different contexts. Please review the attached document.',
        htmlBody: `
          <div style="font-family: Arial, sans-serif;">
            <p>Hi Team,</p>
            <p>We have updated our brand guidelines with new logo variations for different contexts:</p>
            <ul>
              <li>Primary logo (horizontal)</li>
              <li>Icon-only version</li>
              <li>Monochrome versions</li>
              <li>Minimum size requirements</li>
            </ul>
            <p>Please review the attached document and use these guidelines for all external communications.</p>
            <p>Let me know if you have any questions.</p>
            <p>Best,<br/>Design Team</p>
          </div>
        `,
        snippet: 'Hi Team, We have updated our brand guidelines with new logo variations...',
        isRead: true,
        isStarred: false,
        hasAttachments: true,
        userId: adminUser.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 days ago
      },
    ],
  });

  // Admin sent emails
  await prisma.email.createMany({
    data: [
      {
        messageId: '<sent-quotation-001@exoinafrica.com>',
        folder: 'SENT',
        fromName: 'John Doe',
        fromAddress: 'admin@exoinafrica.com',
        toAddresses: ['procurement@safaricom.co.ke'],
        ccAddresses: [],
        bccAddresses: [],
        subject: 'Re: Enterprise Cleaning Solution - Quotation QUO-2025-0018',
        textBody: 'Dear Safaricom Team, Please find attached our quotation for the Enterprise Cleaning Solution annual contract.',
        htmlBody: `
          <div style="font-family: Arial, sans-serif;">
            <p>Dear Safaricom Team,</p>
            <p>Please find attached our quotation for the <strong>Enterprise Cleaning Solution</strong> annual contract.</p>
            <p>Quotation Details:</p>
            <ul>
              <li>Reference: QUO-2025-0018</li>
              <li>Total: KES 522,000.00 (incl. VAT)</li>
              <li>Valid until: December 5, 2025</li>
            </ul>
            <p>We look forward to working with you.</p>
            <p>Best regards,<br/>John Doe<br/>CEO, Exoin Africa</p>
          </div>
        `,
        snippet: 'Dear Safaricom Team, Please find attached our quotation for the Enterprise...',
        isRead: true,
        isStarred: false,
        hasAttachments: true,
        userId: adminUser.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      },
      {
        messageId: '<sent-meeting-001@exoinafrica.com>',
        folder: 'SENT',
        fromName: 'John Doe',
        fromAddress: 'admin@exoinafrica.com',
        toAddresses: ['jane@exoinafrica.com', 'peter@exoinafrica.com'],
        ccAddresses: [],
        bccAddresses: [],
        subject: 'Team Update - Q4 Performance',
        textBody: 'Hi Team, I wanted to share some positive news about our Q4 performance. We have exceeded our targets by 15%!',
        htmlBody: `
          <div style="font-family: Arial, sans-serif;">
            <p>Hi Team,</p>
            <p>I wanted to share some positive news about our Q4 performance:</p>
            <ul>
              <li>Revenue target exceeded by 15%</li>
              <li>3 new enterprise clients onboarded</li>
              <li>Customer satisfaction at 94%</li>
            </ul>
            <p>Great work everyone! Let's discuss next steps in our meeting tomorrow.</p>
            <p>Best,<br/>John</p>
          </div>
        `,
        snippet: 'Hi Team, I wanted to share some positive news about our Q4 performance...',
        isRead: true,
        isStarred: false,
        hasAttachments: false,
        userId: adminUser.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      },
    ],
  });

  // Admin draft
  await prisma.email.create({
    data: {
      messageId: '<draft-001@exoinafrica.com>',
      folder: 'DRAFTS',
      fromName: 'John Doe',
      fromAddress: 'admin@exoinafrica.com',
      toAddresses: ['finance@kplc.co.ke'],
      ccAddresses: [],
      bccAddresses: [],
      subject: 'Partnership Proposal - Exoin Africa',
      textBody: 'Dear Kenya Power Team, We would like to propose a partnership...',
      htmlBody: '<div><p>Dear Kenya Power Team,</p><p>We would like to propose a partnership...</p></div>',
      snippet: 'Dear Kenya Power Team, We would like to propose a partnership...',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      userId: adminUser.id,
      sentAt: new Date(),
    },
  });

  // Jane's inbox emails
  await prisma.email.createMany({
    data: [
      {
        messageId: '<jane-welcome-001@exoinafrica.com>',
        folder: 'INBOX',
        fromName: 'ExoinAfrica Platform',
        fromAddress: 'noreply@exoinafrica.com',
        toAddresses: ['jane@exoinafrica.com'],
        ccAddresses: [],
        bccAddresses: [],
        subject: 'Welcome to ExoinAfrica Workspace',
        textBody: 'Welcome to ExoinAfrica! Your account has been set up successfully.',
        htmlBody: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #F97316;">Welcome, Jane!</h2>
            <p>Your ExoinAfrica workspace account has been set up successfully.</p>
            <p>You can start creating documents and managing clients right away.</p>
            <p>Best,<br/>ExoinAfrica Team</p>
          </div>
        `,
        snippet: 'Welcome to ExoinAfrica! Your account has been set up successfully.',
        isRead: true,
        isStarred: false,
        hasAttachments: false,
        userId: staffUser1.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      },
      {
        messageId: '<jane-task-001@exoinafrica.com>',
        folder: 'INBOX',
        fromName: 'John Doe',
        fromAddress: 'admin@exoinafrica.com',
        toAddresses: ['jane@exoinafrica.com'],
        ccAddresses: [],
        bccAddresses: [],
        subject: 'Re: Technical Review - New Client Integration',
        textBody: 'Hi Jane, Thanks for your detailed review. Please proceed with the integration as discussed.',
        htmlBody: `
          <div style="font-family: Arial, sans-serif;">
            <p>Hi Jane,</p>
            <p>Thanks for your detailed review. Please proceed with the integration as discussed.</p>
            <p>Let me know if you need any resources.</p>
            <p>Best,<br/>John</p>
          </div>
        `,
        snippet: 'Hi Jane, Thanks for your detailed review. Please proceed with the integration...',
        isRead: false,
        isStarred: true,
        hasAttachments: false,
        userId: staffUser1.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      },
    ],
  });

  console.log('✅ Sample emails created');

  // ==================== EMAIL HOSTING ====================
  // Create email domain
  const emailDomain = await prisma.emailDomain.upsert({
    where: { id: 'domain-exoinafrica' },
    update: {},
    create: {
      id: 'domain-exoinafrica',
      domain: 'exoinafrica.com',
      isVerified: true,
      isActive: true,
      verificationCode: 'exoin-verify-abc123',
      mxVerified: true,
      spfVerified: true,
      dkimVerified: true,
      dmarcVerified: true,
      maxMailboxes: 50,
      maxAliases: 100,
      totalStorageQuotaMb: 51200, // 50GB
      usedStorageMb: 0,
      companyId: company.id,
    },
  });
  console.log('✅ Email domain created:', emailDomain.domain);

  // Create mailboxes for users
  const adminMailbox = await prisma.mailbox.upsert({
    where: { id: 'mailbox-admin' },
    update: {},
    create: {
      id: 'mailbox-admin',
      localPart: 'john.doe',
      displayName: 'John Doe',
      passwordHash: adminPassword,
      quotaMb: 10240, // 10GB
      usedMb: 512,
      maxSendPerDay: 1000,
      isActive: true,
      isAdmin: true,
      domainId: emailDomain.id,
      userId: adminUser.id,
    },
  });

  const janeMailbox = await prisma.mailbox.upsert({
    where: { id: 'mailbox-jane' },
    update: {},
    create: {
      id: 'mailbox-jane',
      localPart: 'jane.wanjiku',
      displayName: 'Jane Wanjiku',
      passwordHash: staffPassword,
      quotaMb: 5120, // 5GB
      usedMb: 128,
      maxSendPerDay: 500,
      isActive: true,
      domainId: emailDomain.id,
      userId: staffUser1.id,
    },
  });

  const peterMailbox = await prisma.mailbox.upsert({
    where: { id: 'mailbox-peter' },
    update: {},
    create: {
      id: 'mailbox-peter',
      localPart: 'peter.ochieng',
      displayName: 'Peter Ochieng',
      passwordHash: staffPassword,
      quotaMb: 5120, // 5GB
      usedMb: 64,
      maxSendPerDay: 500,
      isActive: true,
      domainId: emailDomain.id,
      userId: staffUser2.id,
    },
  });

  // Update users with primary mailbox
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { primaryMailboxId: adminMailbox.id },
  });

  await prisma.user.update({
    where: { id: staffUser1.id },
    data: { primaryMailboxId: janeMailbox.id },
  });

  await prisma.user.update({
    where: { id: staffUser2.id },
    data: { primaryMailboxId: peterMailbox.id },
  });

  console.log('✅ Mailboxes created and linked to users');

  // Create email aliases
  await prisma.emailAlias.upsert({
    where: { id: 'alias-info' },
    update: {},
    create: {
      id: 'alias-info',
      localPart: 'info',
      targetMailboxId: adminMailbox.id,
      isActive: true,
      domainId: emailDomain.id,
    },
  });

  await prisma.emailAlias.upsert({
    where: { id: 'alias-support' },
    update: {},
    create: {
      id: 'alias-support',
      localPart: 'support',
      targetMailboxId: janeMailbox.id,
      isActive: true,
      domainId: emailDomain.id,
    },
  });

  console.log('✅ Email aliases created');

  // Create email hosting settings
  await prisma.emailHostingSettings.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      defaultDomainId: emailDomain.id,
      emailFormat: 'firstname.lastname',
      autoProvisionEnabled: true,
      defaultQuotaMb: 5120,
      defaultMaxSendPerDay: 500,
      notifyOnProvision: true,
      requireStrongPassword: true,
      minPasswordLength: 8,
      companyId: company.id,
    },
  });
  console.log('✅ Email hosting settings created');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log('   Admin: admin@exoinafrica.com / Admin@123');
  console.log('   Staff: jane@exoinafrica.com / Staff@123');
  console.log('   Manager: peter@exoinafrica.com / Staff@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
