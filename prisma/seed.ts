import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hash } from "bcryptjs";

// Parse DATABASE_URL for mariadb adapter
function parseDbUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1),
  };
}

const dbConfig = process.env.DATABASE_URL
  ? parseDbUrl(process.env.DATABASE_URL)
  : {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "fivimedia",
    };

const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@fivimedia.com" },
    update: {},
    create: {
      email: "admin@fivimedia.com",
      password: adminPassword,
      name: "Admin",
      role: "admin",
    },
  });
  console.log("✓ Admin user created");

  // Create coverage items (global master list)
  const coverageItems = [
    {
      key: "ein_filing",
      titleEn: "EIN Filing",
      titleAr: "تقديم رقم تعريف صاحب العمل",
      descriptionEn: "We file for your Employer Identification Number with the IRS",
      descriptionAr: "نقدم طلب رقم تعريف صاحب العمل الخاص بك لدى مصلحة الضرائب",
      sortOrder: 1,
    },
    {
      key: "registered_agent",
      titleEn: "Registered Agent",
      titleAr: "الوكيل المسجل",
      descriptionEn: "Professional registered agent service for your LLC",
      descriptionAr: "خدمة الوكيل المسجل المحترف لشركتك",
      sortOrder: 2,
    },
    {
      key: "mailing_address",
      titleEn: "Business Mailing Address",
      titleAr: "عنوان البريد التجاري",
      descriptionEn: "A physical mailing address for your business",
      descriptionAr: "عنوان بريدي فعلي لعملك",
      sortOrder: 3,
    },
    {
      key: "boi_filing",
      titleEn: "BOI Filing",
      titleAr: "تقديم معلومات المالك المستفيد",
      descriptionEn: "Beneficial Ownership Information filing with FinCEN",
      descriptionAr: "تقديم معلومات الملكية المستفيدة لدى FinCEN",
      sortOrder: 4,
    },
    {
      key: "certificate_good_standing",
      titleEn: "Certificate of Good Standing",
      titleAr: "شهادة حسن السير",
      descriptionEn: "Official certificate showing your LLC is in good standing",
      descriptionAr: "شهادة رسمية تثبت أن شركتك في وضع جيد",
      sortOrder: 5,
    },
  ];

  for (const item of coverageItems) {
    await prisma.coverageItem.upsert({
      where: { key: item.key },
      update: item,
      create: item,
    });
  }
  console.log("✓ Coverage items created");

  // Create states
  const states = [
    { code: "WY", name: "Wyoming", basePrice: 199, isRecommended: true },
    { code: "FL", name: "Florida", basePrice: 249, isRecommended: true },
    { code: "TX", name: "Texas", basePrice: 299, isRecommended: true },
    { code: "MT", name: "Montana", basePrice: 199, isRecommended: true },
    { code: "NM", name: "New Mexico", basePrice: 199, isRecommended: true },
    { code: "DE", name: "Delaware", basePrice: 349, isRecommended: false },
    { code: "NV", name: "Nevada", basePrice: 299, isRecommended: false },
    { code: "CA", name: "California", basePrice: 399, isRecommended: false },
    { code: "NY", name: "New York", basePrice: 399, isRecommended: false },
    { code: "AL", name: "Alabama", basePrice: 249, isRecommended: false },
    { code: "AK", name: "Alaska", basePrice: 299, isRecommended: false },
    { code: "AZ", name: "Arizona", basePrice: 249, isRecommended: false },
    { code: "AR", name: "Arkansas", basePrice: 249, isRecommended: false },
    { code: "CO", name: "Colorado", basePrice: 249, isRecommended: false },
    { code: "CT", name: "Connecticut", basePrice: 299, isRecommended: false },
    { code: "GA", name: "Georgia", basePrice: 249, isRecommended: false },
    { code: "HI", name: "Hawaii", basePrice: 299, isRecommended: false },
    { code: "ID", name: "Idaho", basePrice: 249, isRecommended: false },
    { code: "IL", name: "Illinois", basePrice: 299, isRecommended: false },
    { code: "IN", name: "Indiana", basePrice: 249, isRecommended: false },
    { code: "IA", name: "Iowa", basePrice: 249, isRecommended: false },
    { code: "KS", name: "Kansas", basePrice: 249, isRecommended: false },
    { code: "KY", name: "Kentucky", basePrice: 249, isRecommended: false },
    { code: "LA", name: "Louisiana", basePrice: 249, isRecommended: false },
    { code: "ME", name: "Maine", basePrice: 249, isRecommended: false },
    { code: "MD", name: "Maryland", basePrice: 299, isRecommended: false },
    { code: "MA", name: "Massachusetts", basePrice: 349, isRecommended: false },
    { code: "MI", name: "Michigan", basePrice: 249, isRecommended: false },
    { code: "MN", name: "Minnesota", basePrice: 249, isRecommended: false },
    { code: "MS", name: "Mississippi", basePrice: 249, isRecommended: false },
    { code: "MO", name: "Missouri", basePrice: 249, isRecommended: false },
    { code: "NE", name: "Nebraska", basePrice: 249, isRecommended: false },
    { code: "NH", name: "New Hampshire", basePrice: 249, isRecommended: false },
    { code: "NJ", name: "New Jersey", basePrice: 299, isRecommended: false },
    { code: "NC", name: "North Carolina", basePrice: 249, isRecommended: false },
    { code: "ND", name: "North Dakota", basePrice: 249, isRecommended: false },
    { code: "OH", name: "Ohio", basePrice: 249, isRecommended: false },
    { code: "OK", name: "Oklahoma", basePrice: 249, isRecommended: false },
    { code: "OR", name: "Oregon", basePrice: 249, isRecommended: false },
    { code: "PA", name: "Pennsylvania", basePrice: 299, isRecommended: false },
    { code: "RI", name: "Rhode Island", basePrice: 249, isRecommended: false },
    { code: "SC", name: "South Carolina", basePrice: 249, isRecommended: false },
    { code: "SD", name: "South Dakota", basePrice: 249, isRecommended: false },
    { code: "TN", name: "Tennessee", basePrice: 249, isRecommended: false },
    { code: "UT", name: "Utah", basePrice: 249, isRecommended: false },
    { code: "VT", name: "Vermont", basePrice: 249, isRecommended: false },
    { code: "VA", name: "Virginia", basePrice: 249, isRecommended: false },
    { code: "WA", name: "Washington", basePrice: 299, isRecommended: false },
    { code: "WV", name: "West Virginia", basePrice: 249, isRecommended: false },
    { code: "WI", name: "Wisconsin", basePrice: 249, isRecommended: false },
    { code: "DC", name: "District of Columbia", basePrice: 349, isRecommended: false },
  ];

  for (const state of states) {
    await prisma.state.upsert({
      where: { code: state.code },
      update: state,
      create: state,
    });
  }
  console.log("✓ States created");

  // Create state coverage (all items enabled for all states by default)
  const allStates = await prisma.state.findMany();
  const allCoverageItems = await prisma.coverageItem.findMany();

  for (const state of allStates) {
    for (const coverageItem of allCoverageItems) {
      // Set processing time for EIN filing
      const processingTime = coverageItem.key === "ein_filing" ? "10-12 business days" : null;

      await prisma.stateCoverage.upsert({
        where: {
          stateId_coverageItemId: {
            stateId: state.id,
            coverageItemId: coverageItem.id,
          },
        },
        update: { enabled: true, processingTime },
        create: {
          stateId: state.id,
          coverageItemId: coverageItem.id,
          enabled: true,
          processingTime,
        },
      });
    }
  }
  console.log("✓ State coverage created");

  // Create add-ons
  const addOns = [
    {
      slug: "bank_setup",
      nameEn: "Bank Setup Assistance",
      nameAr: "المساعدة في إعداد الحساب البنكي",
      descriptionEn: "We help you open a US business bank account",
      descriptionAr: "نساعدك في فتح حساب بنكي تجاري أمريكي",
      price: 99,
      sortOrder: 1,
      isActive: true,
    },
    {
      slug: "business_address",
      nameEn: "Business Address",
      nameAr: "عنوان العمل",
      descriptionEn: "A physical business address for your LLC",
      descriptionAr: "عنوان عمل فعلي لشركتك",
      price: 49,
      sortOrder: 2,
      isActive: true,
    },
    {
      slug: "us_phone",
      nameEn: "US Phone Number",
      nameAr: "رقم هاتف أمريكي",
      descriptionEn: "A dedicated US phone number for your business",
      descriptionAr: "رقم هاتف أمريكي مخصص لعملك",
      price: 29,
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (const addon of addOns) {
    await prisma.addOn.upsert({
      where: { slug: addon.slug },
      update: addon,
      create: addon,
    });
  }
  console.log("✓ Add-ons created");

  // Create default languages
  const languages = [
    {
      code: "en",
      name: "English",
      direction: "ltr",
      isDefault: true,
      isActive: true,
      sortOrder: 1,
    },
    {
      code: "ar",
      name: "العربية",
      direction: "rtl",
      isDefault: false,
      isActive: true,
      sortOrder: 2,
    },
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: lang,
      create: lang,
    });
  }
  console.log("✓ Languages created");

  // Create sample promo codes
  const promoCodes = [
    {
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      usageLimit: 100,
      minOrderAmount: 100,
      isActive: true,
    },
    {
      code: "SAVE50",
      type: "fixed",
      value: 50,
      usageLimit: 50,
      minOrderAmount: 200,
      isActive: true,
    },
    {
      code: "FIRST20",
      type: "percentage",
      value: 20,
      usageLimit: 25,
      minOrderAmount: 150,
      isActive: true,
    },
  ];

  for (const promo of promoCodes) {
    await prisma.promoCode.upsert({
      where: { code: promo.code },
      update: promo,
      create: promo,
    });
  }
  console.log("✓ Promo codes created");

  // Create FAQ categories
  const faqCategories = [
    {
      key: "general",
      sortOrder: 1,
      isActive: true,
      translations: [
        { locale: "en", name: "General Questions" },
        { locale: "ar", name: "الأسئلة العامة" },
      ],
    },
    {
      key: "pricing",
      sortOrder: 2,
      isActive: true,
      translations: [
        { locale: "en", name: "Pricing & Payments" },
        { locale: "ar", name: "الأسعار والمدفوعات" },
      ],
    },
    {
      key: "process",
      sortOrder: 3,
      isActive: true,
      translations: [
        { locale: "en", name: "Formation Process" },
        { locale: "ar", name: "عملية التأسيس" },
      ],
    },
  ];

  for (const category of faqCategories) {
    const existingCategory = await prisma.faqCategory.findUnique({
      where: { key: category.key },
    });

    if (!existingCategory) {
      await prisma.faqCategory.create({
        data: {
          key: category.key,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          translations: {
            create: category.translations,
          },
        },
      });
    }
  }
  console.log("✓ FAQ categories created");

  // Create sample FAQs
  const generalCategory = await prisma.faqCategory.findUnique({
    where: { key: "general" },
  });
  const pricingCategory = await prisma.faqCategory.findUnique({
    where: { key: "pricing" },
  });
  const processCategory = await prisma.faqCategory.findUnique({
    where: { key: "process" },
  });

  if (generalCategory && pricingCategory && processCategory) {
    const faqs = [
      {
        categoryId: generalCategory.id,
        sortOrder: 1,
        isActive: true,
        translations: [
          {
            locale: "en",
            question: "What is an LLC?",
            answer:
              "An LLC (Limited Liability Company) is a business structure that combines the pass-through taxation of a partnership with the limited liability protection of a corporation. It protects your personal assets from business debts and lawsuits.",
          },
          {
            locale: "ar",
            question: "ما هي الشركة ذات المسؤولية المحدودة؟",
            answer:
              "الشركة ذات المسؤولية المحدودة هي هيكل تجاري يجمع بين الضرائب المارة للشراكة مع حماية المسؤولية المحدودة للشركة. إنها تحمي أصولك الشخصية من ديون ودعاوى العمل.",
          },
        ],
      },
      {
        categoryId: generalCategory.id,
        sortOrder: 2,
        isActive: true,
        translations: [
          {
            locale: "en",
            question: "Do I need to be a US citizen to form an LLC?",
            answer:
              "No, you do not need to be a US citizen or resident to form an LLC in the United States. Non-US residents can form and own an LLC in any state.",
          },
          {
            locale: "ar",
            question: "هل يجب أن أكون مواطناً أمريكياً لتأسيس شركة؟",
            answer:
              "لا، لا تحتاج أن تكون مواطناً أمريكياً أو مقيماً لتأسيس شركة ذات مسؤولية محدودة في الولايات المتحدة. يمكن لغير المقيمين تأسيس وامتلاك شركة في أي ولاية.",
          },
        ],
      },
      {
        categoryId: pricingCategory.id,
        sortOrder: 1,
        isActive: true,
        translations: [
          {
            locale: "en",
            question: "What is included in the base price?",
            answer:
              "The base price includes LLC formation, EIN filing, registered agent service for the first year, business mailing address, BOI filing, and certificate of good standing.",
          },
          {
            locale: "ar",
            question: "ما الذي يتضمنه السعر الأساسي؟",
            answer:
              "يتضمن السعر الأساسي تأسيس الشركة، تقديم رقم تعريف صاحب العمل، خدمة الوكيل المسجل للسنة الأولى، عنوان البريد التجاري، تقديم معلومات المالك المستفيد، وشهادة حسن السير.",
          },
        ],
      },
      {
        categoryId: pricingCategory.id,
        sortOrder: 2,
        isActive: true,
        translations: [
          {
            locale: "en",
            question: "Why do prices vary by state?",
            answer:
              "Each state has different filing fees and requirements for LLC formation. Our service fee combined with state filing fees results in different total prices for each state.",
          },
          {
            locale: "ar",
            question: "لماذا تختلف الأسعار حسب الولاية؟",
            answer:
              "كل ولاية لديها رسوم تقديم ومتطلبات مختلفة لتأسيس الشركة. رسوم خدمتنا مع رسوم تقديم الولاية تؤدي إلى أسعار إجمالية مختلفة لكل ولاية.",
          },
        ],
      },
      {
        categoryId: processCategory.id,
        sortOrder: 1,
        isActive: true,
        translations: [
          {
            locale: "en",
            question: "How long does it take to form an LLC?",
            answer:
              "The formation timeline varies by state. Most states process LLC formations within 5-10 business days. EIN filing typically takes 10-12 business days after the LLC is formed.",
          },
          {
            locale: "ar",
            question: "كم يستغرق تأسيس الشركة؟",
            answer:
              "يختلف الجدول الزمني للتأسيس حسب الولاية. معظم الولايات تعالج تأسيس الشركات خلال 5-10 أيام عمل. تقديم رقم تعريف صاحب العمل يستغرق عادة 10-12 يوم عمل بعد تأسيس الشركة.",
          },
        ],
      },
      {
        categoryId: processCategory.id,
        sortOrder: 2,
        isActive: true,
        translations: [
          {
            locale: "en",
            question: "What documents will I receive?",
            answer:
              "You will receive your Articles of Organization (formation document), Operating Agreement template, EIN confirmation letter, Certificate of Good Standing, and all filing receipts.",
          },
          {
            locale: "ar",
            question: "ما المستندات التي سأستلمها؟",
            answer:
              "ستستلم مواد التنظيم (وثيقة التأسيس)، نموذج اتفاقية التشغيل، خطاب تأكيد رقم تعريف صاحب العمل، شهادة حسن السير، وجميع إيصالات التقديم.",
          },
        ],
      },
    ];

    // Check if FAQs already exist
    const existingFaqCount = await prisma.faq.count();
    if (existingFaqCount === 0) {
      for (const faq of faqs) {
        await prisma.faq.create({
          data: {
            categoryId: faq.categoryId,
            sortOrder: faq.sortOrder,
            isActive: faq.isActive,
            translations: {
              create: faq.translations,
            },
          },
        });
      }
      console.log("✓ Sample FAQs created");
    } else {
      console.log("✓ FAQs already exist, skipping");
    }
  }

  console.log("\n✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
