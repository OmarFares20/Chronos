import { PrismaClient, ServiceCategory, PaymentMethod, PaymentStatus, BookingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Avatar & Gallery helpers ────────────────────────────────────────────────
function businessAvatar(name: string, bg = "1a1b2e", fg = "C4A452") {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bg}&color=${fg}&size=200&bold=true&font-size=0.45`;
}
function gallery(category: string, n: number) { return `https://picsum.photos/seed/${category}-${n}/400/300`; }

function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ── Data Generation Dictionaries ───────────────────────────────────────────────
const FIRST_NAMES_MALE = ["Omar", "Youssef", "Ahmed", "Mohamed", "Mahmoud", "Khaled", "Hassan", "Kareem", "Tariq", "Hisham"];
const FIRST_NAMES_FEMALE = ["Yasmine", "Salma", "Nadia", "Mona", "Aya", "Fatima", "Heba", "Laila", "Nour", "Rana"];
const LAST_NAMES = ["El-Sayed", "Hassan", "Youssef", "Ibrahim", "Abdel-Rahman", "Fouad", "Tawfik", "Gaber", "Osman", "Mansour", "El-Masry", "Ali", "Mostafa", "Kamal", "Zaki"];
const ADJECTIVES = ["Royal", "Nile", "Golden", "Pyramid", "Pharaoh", "Crystal", "Cairo", "Alex", "Zahra", "Layali", "Sahra", "Lotus", "Crown", "Elite", "Grand"];
const LOCATIONS = ["Cairo", "Alexandria", "Giza", "Sharm El-Sheikh", "Hurghada", "Luxor", "Aswan", "New Cairo", "Zayed City", "Mansoura"];

const CATEGORY_TEMPLATES: Record<string, { prefix: string[], suffix: string[], pkgNames: string[], pkgFeatures: string[], bio: string[] }> = {
  PHOTOGRAPHY: {
    prefix: ["Studio", "Lens", "Focus", "Capture", "Frame", "Flash", "Pixel"],
    suffix: ["Photography", "Studios", "Visuals", "Captures", "Art"],
    pkgNames: ["Katb El Kitab Session", "Full Farah Coverage", "Pre-Wedding Shoot", "Engagement Mini-Session", "Bridal Portraits"],
    pkgFeatures: ["1 Photographer", "2 Photographers", "Drone Footage", "Printed Album", "Same Day Edit", "Digital Gallery"],
    bio: ["Capturing your raw, authentic Egyptian moments.", "Award-winning wedding photography.", "Timeless portraits for your Farah."]
  },
  CATERING: {
    prefix: ["Chef", "Sofret", "Zad", "Feast", "Bites", "El Omda", "Baladi", "Sofretna"],
    suffix: ["Catering", "Kitchen", "Grills", "Feasts", "Bites", "Food"],
    pkgNames: ["VIP Mashweyat Buffet", "Royal Iftar Spread", "Oriental Dessert Station", "Fruit Juice Bar", "Drop-off Catering"],
    pkgFeatures: ["Om Ali Station", "Live Shawarma", "Stuffed Pigeon", "Koshary Cart", "3 Oriental Sides", "Plated Service"],
    bio: ["Authentic Egyptian cuisine for all family gatherings.", "Luxurious feasts that will leave your guests amazed.", "Modern fusion with traditional Egyptian roots."]
  },
  DECOR: {
    prefix: ["Kosha", "Velvet", "Sahra", "Glamour", "Design", "Arabesque", "Flora"],
    suffix: ["Decor", "Designs", "Setups", "Events", "Visions"],
    pkgNames: ["Full Kosha Setup", "Sahra Lighting Package", "Oriental Seating", "Floral Arch & Draping", "Guest Tables Setup"],
    pkgFeatures: ["Custom Kosha", "Sahra Lighting", "Oriental Carpets", "Arabesque Lanterns", "Centerpieces", "Dance Floor Wrap"],
    bio: ["Transforming empty halls into magical Egyptian nights.", "Bespoke Kosha and decor designs.", "Creating unforgettable atmospheres."]
  },
  ENTERTAINMENT: {
    prefix: ["Zaffet", "Layali", "Mizmar", "DJ", "Star", "Oriental", "Beats"],
    suffix: ["Entertainment", "Band", "Shows", "Beats", "Zaffa", "Group"],
    pkgNames: ["Classic Zaffa Entrance", "DJ & Lighting Combo", "Belly Dancer Performance", "Mizmar Band Show", "Full Wedding Entertainment"],
    pkgFeatures: ["10-Piece Zaffa Band", "Mizmar Players", "Fire Show", "Laser Lights", "Belly Dancer", "Tannoura Show"],
    bio: ["High-energy Zaffa and entertainment to keep the dance floor packed.", "The best oriental beats and wedding entrances in town.", "Unforgettable performances for your Farah."]
  },
  VENUE: {
    prefix: ["Al Qasr", "Grand", "Nile", "Royal", "Oasis", "Sunset", "Majestic"],
    suffix: ["Ballroom", "Gardens", "Hall", "Resort", "Club", "Villa"],
    pkgNames: ["Half-Day Katb El Kitab", "Full-Day Farah", "Outdoor Garden Reception", "Intimate Villa Rental", "Corporate Conference Hall"],
    pkgFeatures: ["600 Guest Capacity", "Bridal Suite", "Valet Parking", "Nile View", "Open Air Setup", "Full AC"],
    bio: ["A majestic venue for luxurious weddings.", "Stunning Nile views for your perfect day.", "Elegant ballrooms and spacious gardens."]
  },
  FLORIST: {
    prefix: ["Zohoor", "Rose", "Bloom", "Lotus", "Jasmine", "Floral", "Tulip"],
    suffix: ["Florists", "Blooms", "Arrangements", "Boutique", "Petals"],
    pkgNames: ["Bridal Bouquet & Accessories", "Full Venue Floral", "Kosha Floral Arch", "Table Centerpieces", "Car Decoration"],
    pkgFeatures: ["Imported Roses", "Custom Colors", "Hanging Florals", "Bridal Bouquet", "Boutonnieres", "Flower Walls"],
    bio: ["Beautiful blooms for beautiful occasions.", "Custom floral arrangements and stunning Kosha designs.", "Fresh, elegant, and timeless floristry."]
  },
  MAKEUP: {
    prefix: ["Glam", "Beauty", "Glow", "Flawless", "Radiance", "Queen"],
    suffix: ["Makeup", "Artistry", "Studio", "Lounge", "Cosmetics"],
    pkgNames: ["Bridal Makeup (Full Day)", "Engagement Makeup", "Soiree Makeup", "Bridal Hair & Makeup Combo", "Touch-up Package"],
    pkgFeatures: ["Airbrush Makeup", "Lashes Included", "Veil Styling", "On-location Service", "Trial Session", "Premium Brands"],
    bio: ["Enhancing your natural beauty for your big day.", "Professional makeup artist specializing in bridal glam.", "Flawless and long-lasting bridal looks."]
  },
  PLANNING: {
    prefix: ["Leila", "Perfect", "Dream", "Elite", "Signature", "Bespoke"],
    suffix: ["Planners", "Events", "Occasions", "Coordination", "Weddings"],
    pkgNames: ["Month-of Coordination", "Full Farah Planning", "Katb El Kitab Planning", "Design & Styling Only", "Corporate Event Management"],
    pkgFeatures: ["Vendor Management", "Timeline Creation", "On-site Coordination", "Budget Management", "RSVP Tracking", "Design Concept"],
    bio: ["Full-service luxury occasion planning.", "Ensuring your Farah is flawlessly executed.", "Stress-free planning for the modern Egyptian couple."]
  },
  MUSIC: {
    prefix: ["Melody", "Rhythm", "Harmony", "Tarab", "Oud", "Strings", "Sound"],
    suffix: ["Band", "Ensemble", "Music", "Trio", "Orchestra", "Live"],
    pkgNames: ["Classical Tarab Band", "Oud & Violin Duo", "Modern Pop Band", "Reception Background Music", "Full Wedding Orchestra"],
    pkgFeatures: ["Live Vocals", "Oud Player", "Violinist", "Sound System Included", "Custom Playlist", "3 Hours Live Music"],
    bio: ["Live music that touches the soul.", "From classical Tarab to modern hits.", "The perfect soundtrack for your special occasion."]
  },
  TRANSPORT: {
    prefix: ["Royal", "Elite", "VIP", "Classic", "Luxury", "Nile", "Premium"],
    suffix: ["Limo", "Transport", "Rides", "Chauffeurs", "Cars"],
    pkgNames: ["Bridal Limo Service", "Classic Vintage Car", "Guest Shuttle Bus", "Airport Transfer", "Full Day VIP Chauffeur"],
    pkgFeatures: ["Mercedes S-Class", "Floral Decoration", "Red Carpet", "Professional Chauffeur", "Refreshments", "Coaster Bus"],
    bio: ["Arrive in style and luxury.", "Premium transportation for the bride, groom, and guests.", "Reliable and elegant chauffeur services."]
  },
  SECURITY: {
    prefix: ["Safe", "Guard", "Elite", "Iron", "Shield", "Falcon"],
    suffix: ["Security", "Guards", "Protection", "Services"],
    pkgNames: ["Event Door Security", "VIP Bodyguard", "Crowd Control Team", "Valet & Parking Security"],
    pkgFeatures: ["2 Security Guards", "Suit & Tie Uniform", "Radio Communication", "Guest List Checking", "VIP Escort", "Traffic Management"],
    bio: ["Professional security for peaceful and safe occasions.", "Discreet and reliable event protection.", "Ensuring your guests' safety and comfort."]
  },
  VIDEOGRAPHY: {
    prefix: ["Cinema", "Motion", "Frame", "Story", "Reel", "Visuals", "Focus"],
    suffix: ["Videography", "Films", "Studios", "Productions", "Cinematography"],
    pkgNames: ["Highlight Reel", "Full Farah Film", "Pre-Wedding Cinematic Video", "Same Day Edit Show", "Documentary Edit"],
    pkgFeatures: ["Drone Footage", "4K Resolution", "2 Videographers", "Audio Recording", "Teaser Trailer", "Raw Footage"],
    bio: ["Cinematic storytelling for your most precious moments.", "Award-winning wedding films.", "Capturing the emotion and energy of your Farah."]
  },
  HOSPITALITY: {
    prefix: ["Welcome", "Guest", "Royal", "Premium", "Elite"],
    suffix: ["Hospitality", "Hosts", "Services", "Greeting"],
    pkgNames: ["VIP Guest Greeting", "Ushers & Seating Team", "Bridal Party Assistance", "Cloakroom Management"],
    pkgFeatures: ["Bilingual Hosts", "Uniformed Ushers", "Seating Assistance", "Gift Management", "Guest Orientation", "VIP Handling"],
    bio: ["Exceptional hospitality services for your guests.", "Professional ushers and hosts for seamless events.", "Making every guest feel like royalty."]
  },
  STATIONERY: {
    prefix: ["Paper", "Ink", "Gold", "Classic", "Elegant", "Signature"],
    suffix: ["Stationery", "Invites", "Designs", "Press", "Prints"],
    pkgNames: ["Custom Wedding Invitations", "Menu & Program Cards", "Welcome Signs & Seating Charts", "Digital Video Invitations"],
    pkgFeatures: ["Gold Foil Printing", "Wax Seals", "Calligraphy", "Custom Envelopes", "Digital RSVP", "Acrylic Signs"],
    bio: ["Bespoke invitations and event stationery.", "Setting the tone for your occasion with elegant designs.", "High-quality printing and custom calligraphy."]
  },
  CHILDCARE: {
    prefix: ["Kids", "Little", "Happy", "Play", "Safe", "Joy"],
    suffix: ["Care", "Corner", "Nannies", "Entertainment"],
    pkgNames: ["Wedding Kids Corner", "Professional Nanny Service", "Children's Entertainment Show", "Sleepy Time Care"],
    pkgFeatures: ["CPR Certified Nannies", "Arts & Crafts", "Face Painting", "Movie Setup", "Toys & Games", "Quiet Area"],
    bio: ["Professional childcare so adults can enjoy the party.", "Fun and safe entertainment for your little guests.", "Reliable nannies and engaging kids' corners."]
  },
  EMCEE: {
    prefix: ["Master", "Voice", "Host", "Charisma", "Star"],
    suffix: ["Emcee", "Presenter", "Hosts", "Speaker"],
    pkgNames: ["Bilingual Farah Emcee", "Corporate Event Host", "Zaffa Announcer", "Interactive Game Host"],
    pkgFeatures: ["Fluent English/Arabic", "Timeline Management", "Crowd Engagement", "Grand Entrance Announcement", "Professional Attire"],
    bio: ["The voice of your occasion.", "Professional and charismatic emcees for any event.", "Keeping your guests engaged and informed."]
  },
  SOUND_SYSTEM: {
    prefix: ["Audio", "Bass", "Sonic", "Crystal", "Loud", "Echo"],
    suffix: ["Sound", "Systems", "AV", "Acoustics", "Tech"],
    pkgNames: ["Basic PA System", "Full Concert Audio", "Band Backline Setup", "Speech & Background Audio"],
    pkgFeatures: ["Line Array Speakers", "Wireless Mics", "Sound Engineer", "Subwoofers", "DJ Monitor", "Backup Power"],
    bio: ["Crystal clear audio for your event.", "Professional sound systems for weddings, bands, and speeches.", "Top-tier AV equipment and engineering."]
  },
  TENT_RENTAL: {
    prefix: ["Sahara", "Royal", "Arabian", "Oasis", "Majestic", "Canopy"],
    suffix: ["Tents", "Marquees", "Rentals", "Structures"],
    pkgNames: ["Traditional Oriental Tent", "Clear Span Marquee", "Bedouin Seating Tent", "Outdoor Canopy"],
    pkgFeatures: ["AC/Heating", "Draping & Lighting", "Chandelier Setup", "Carpet Flooring", "Glass Panels", "Setup & Takedown"],
    bio: ["Transforming outdoor spaces with elegant tents.", "High-quality marquees and traditional oriental tents.", "Weatherproof solutions for your outdoor Farah."]
  },
  WAITSTAFF: {
    prefix: ["Elite", "Service", "Prime", "Silver", "Impeccable"],
    suffix: ["Waitstaff", "Servers", "Staffing", "Crew"],
    pkgNames: ["Buffet Servers", "Plated Dinner Waitstaff", "Tray Service Crew", "Bartenders & Baristas"],
    pkgFeatures: ["Uniformed Staff", "Experienced Captain", "Table Clearing", "Beverage Service", "Setup & Cleanup", "VIP Service"],
    bio: ["Professional waitstaff and servers for seamless dining.", "Experienced and courteous event crew.", "Elevating your guests' dining experience."]
  }
};

const CATEGORIES = Object.keys(CATEGORY_TEMPLATES) as ServiceCategory[];

async function main() {
  console.log("🧹 Cleaning up existing data...");
  // Use raw SQL truncation in dependency order — safe even if some tables
  // don't exist yet (e.g. before migrations have run for newer models).
  const tablesTruncate = [
    "dispute_attachments",
    "disputes",
    "payments",
    "reviews",
    "messages",
    "bookings",
    "events",
    "packages",
    "services",
    "gallery_items",
    "provider_availabilities",
    "provider_profiles",
    "provider_applications",
    "users",
  ];
  for (const table of tablesTruncate) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "${table}";`
    ).catch(() => {
      // Table may not exist yet (pending migration) — skip silently
      console.log(`  ↳ skipped "${table}" (table may not exist yet)`);
    });
  }
  console.log("✓ Cleaned.");

  const providerPassword = await bcrypt.hash("Provider@123!", 10);
  const customerPassword = await bcrypt.hash("Customer@123!", 10);
  const adminPassword    = await bcrypt.hash("Admin@123!", 10);

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@chronos.com",
      password: adminPassword,
      role: "ADMIN",
      avatarUrl: businessAvatar("Chronos Admin"),
    },
  });
  console.log("✓ Admin created.");

  // ── 10 CUSTOMERS (Egyptian names) ──────────────────────────────────────────
  const CUSTOMERS_DATA = [
    { name: "Yasmine El-Sayed",   email: "yasmine@example.com",  gender: "women", n: 22 },
    { name: "Mohamed Youssef",    email: "mohamed@example.com",  gender: "men",   n: 33 },
    { name: "Omar Hassan",        email: "omar@example.com",     gender: "men",   n: 15 },
    { name: "Nour Ibrahim",       email: "nour@example.com",     gender: "women", n: 44 },
    { name: "Salma Fouad",        email: "salma@example.com",    gender: "women", n: 55 },
    { name: "Kareem Mansour",     email: "kareem@example.com",   gender: "men",   n: 12 },
    { name: "Aya Tawfik",         email: "aya@example.com",      gender: "women", n: 67 },
    { name: "Ahmed Zaki",         email: "ahmed@example.com",    gender: "men",   n: 41 },
    { name: "Laila Osman",        email: "laila@example.com",    gender: "women", n: 31 },
    { name: "Mahmoud El-Masry",   email: "mahmoud@example.com",  gender: "men",   n: 52 },
  ];

  const createdCustomers: { id: string; name: string }[] = [];
  for (const c of CUSTOMERS_DATA) {
    const u = await prisma.user.create({
      data: {
        name:      c.name,
        email:     c.email,
        password:  customerPassword,
        role:      "CUSTOMER",
        avatarUrl: `https://randomuser.me/api/portraits/${c.gender}/${c.n}.jpg`,
      },
    });
    createdCustomers.push({ id: u.id, name: u.name });
  }
  console.log(`✓ ${createdCustomers.length} customers created.`);

  // ── PROVIDERS (dynamic — kept from original) ───────────────────────────────
  console.log(`Generating providers across ${CATEGORIES.length} categories...`);
  let providerCount = 0;

  for (const category of CATEGORIES) {
    const tpl = CATEGORY_TEMPLATES[category];
    if (!tpl) continue;
    const count = randomInt(3, 5);

    for (let i = 0; i < count; i++) {
      const isPerson = Math.random() > 0.5;
      let businessName = "";

      if (isPerson) {
        const isMale = Math.random() > 0.5;
        const firstName = isMale ? randomItem(FIRST_NAMES_MALE) : randomItem(FIRST_NAMES_FEMALE);
        businessName = `${firstName} ${randomItem(LAST_NAMES)} ${randomItem(tpl.suffix)}`;
      } else {
        const prefix = Math.random() > 0.3 ? randomItem(ADJECTIVES) : randomItem(tpl.prefix);
        businessName = `${prefix} ${randomItem(tpl.suffix)}`;
      }
      const avatarUrl = businessAvatar(businessName);

      const isVerified  = Math.random() > 0.35;
      const isTopRated  = Math.random() > 0.65;
      const hasPromo    = Math.random() > 0.75;
      const badge       = isTopRated ? "Top Rated" : Math.random() > 0.7 ? "Premium" : null;
      const location    = randomItem(LOCATIONS);
      const bio         = randomItem(tpl.bio);
      const rating      = Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
      const reviewCount = randomInt(5, 120);
      const minPrice    = randomInt(1500, 5000);
      const provEmail   = `${businessName.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "").slice(0, 20)}@chronos-provider.com`;

      const provUser = await prisma.user.create({
        data: {
          name:      businessName,
          email:     provEmail,
          password:  providerPassword,
          role:      "PROVIDER",
          avatarUrl,
        },
      });

      const packages: { name: string; price: number; features: string[] }[] = [];
      const numPackages = randomInt(2, 4);
      for (let p = 0; p < numPackages; p++) {
        const pkgFeatureCount = randomInt(3, 6);
        packages.push({
          name:     randomItem(tpl.pkgNames),
          price:    minPrice * (p + 1) + randomInt(0, 500),
          features: randomItems(tpl.pkgFeatures, pkgFeatureCount),
        });
      }

      await prisma.providerProfile.create({
        data: {
          userId:        provUser.id,
          businessName,
          bio,
          location,
          avatarUrl,
          isVerified,
          badge,
          rating,
          reviewCount,
          minPrice,
          categories:    [category as never],
          socialLinks:   {},
          applicationStatus: "APPROVED",
          services: {
            create: [{
              name:        `${businessName} — ${category.replace("_", " ")}`,
              category:    category as never,
              description: bio,
              isActive:    true,
              packages: {
                create: packages.map((pkg, pi) => ({
                  name:          pkg.name,
                  price:         pkg.price,
                  currency:      "EGP",
                  features:      pkg.features,
                  isHighlight:   pi === 1,
                  isPromotion:   hasPromo && pi === 0,
                  discountPercentage: hasPromo && pi === 0 ? randomInt(10, 30) : null,
                  originalPrice:     hasPromo && pi === 0 ? Math.round(pkg.price * 1.25) : null,
                })),
              },
            }],
          },
          gallery: {
            create: Array.from({ length: randomInt(3, 6) }, (_, gi) => ({
              url:      gallery(category.toLowerCase(), providerCount * 10 + gi),
              caption:  `${businessName} portfolio shot ${gi + 1}`,
              category: category as never,
            })),
          },
        },
      });

      providerCount++;
    }
  }
  console.log(`✓ ${providerCount} providers seeded.`);

  // ── FETCH SEEDED DATA ──────────────────────────────────────────────────────
  const customers = await prisma.user.findMany({ where: { role: "CUSTOMER" } });
  const providers = await prisma.providerProfile.findMany({
    include: { services: { include: { packages: true } }, user: { select: { id: true } } },
  });
  const providersWithPkgs = providers.filter(p => p.services.some(s => s.packages.length > 0));

  const PAYMENT_METHODS: PaymentMethod[] = ["CARD", "FAWRY", "VODAFONE_CASH", "INSTAPAY", "BANK_TRANSFER"];

  function pastDate(monthsBack: number, daysVariance = 28): Date {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsBack);
    d.setDate(d.getDate() - randomInt(0, daysVariance));
    return d;
  }

  const EVENT_NAMES  = ["Farah El-Sayed", "Corporate Gala", "Eid Celebration", "Birthday Hafla", "Graduation Night", "Engagement Party", "Nile Cruise Dinner", "Company Retreat", "Charity Gala", "Anniversary Night"];
  const EVENT_TYPES  = ["wedding", "corporate", "birthday", "engagement", "graduation", "celebration", "cruise", "retreat", "charity", "anniversary"];
  const REVIEW_COMMENTS = [
    "Absolutely stunning! Exceeded every expectation we had.",
    "Professional, punctual, and delivered exactly what was promised.",
    "Our guests were completely blown away. Cannot recommend enough!",
    "Beautiful work — very attentive to every detail.",
    "Would book again without a second thought. 5 stars all the way!",
    "A truly magical experience from start to finish.",
    "Very responsive and the final result was breathtaking.",
    "Great value for the quality delivered. Highly satisfied.",
    "The team was amazing and made our day so special.",
    "Everything was perfect — thank you for making it unforgettable.",
    "Decent service but a few small hiccups. Would still recommend.",
    "Good quality but arrived a bit late. Overall satisfactory.",
  ];

  // ── 70 BOOKINGS across all statuses ────────────────────────────────────────
  // Status distribution: RELEASED×25, IN_ESCROW×12, CONFIRMED×12, PENDING×10, DECLINED×7, CANCELLED×4
  const STATUS_PLAN: BookingStatus[] = [
    ...Array(25).fill("RELEASED"),
    ...Array(12).fill("IN_ESCROW"),
    ...Array(12).fill("CONFIRMED"),
    ...Array(10).fill("PENDING"),
    ...Array(7).fill("DECLINED"),
    ...Array(4).fill("CANCELLED"),
  ];

  let bookingCount = 0;
  const bookingsForMessages: { bookingId: string; customerId: string; providerUserId: string }[] = [];

  for (let i = 0; i < STATUS_PLAN.length; i++) {
    const status     = STATUS_PLAN[i];
    const customer   = customers[i % customers.length];
    const provider   = providersWithPkgs[i % providersWithPkgs.length];
    const service    = randomItem(provider.services.filter(s => s.packages.length > 0));
    const pkg        = randomItem(service.packages);
    const monthsBack = Math.floor(i / 12);
    const eventDate  = pastDate(monthsBack);
    const createdAt  = new Date(eventDate.getTime() - randomInt(3, 30) * 86400000);
    const nameIdx    = i % EVENT_NAMES.length;

    const event = await prisma.event.create({
      data: {
        customerId: customer.id,
        name:       EVENT_NAMES[nameIdx],
        type:       EVENT_TYPES[nameIdx],
        date:       eventDate,
        location:   randomItem(LOCATIONS),
        guestCount: randomInt(50, 500),
        budget:     randomInt(15000, 150000),
        status:     status === "RELEASED" ? "COMPLETED" : status === "DECLINED" || status === "CANCELLED" ? "CANCELLED" : "CONFIRMED",
        createdAt,
        updatedAt:  createdAt,
      },
    });

    const amount         = Number(pkg.price);
    const platformFee    = Math.round(amount * 0.05);
    const providerPayout = amount - platformFee;

    const booking = await prisma.booking.create({
      data: {
        eventId:          event.id,
        customerId:       customer.id,
        providerId:       provider.id,
        packageId:        pkg.id,
        status,
        amount,
        platformFee,
        providerPayout,
        eventDate,
        scheduledTime:    eventDate,
        message:          randomItem(["Looking forward to working with you!", "Can we discuss the details?", "Please confirm availability.", "Excited to have you at our event!", "Hope we can finalize soon."]),
        escrowReleasedAt: status === "RELEASED" ? new Date(eventDate.getTime() + randomInt(2, 5) * 86400000) : null,
        createdAt,
        updatedAt:        createdAt,
      },
    });

    // Payment for paid bookings
    if (status === "RELEASED" || status === "IN_ESCROW") {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount,
          method:    randomItem(PAYMENT_METHODS),
          status:    "COMPLETED",
          reference: `CHR-${booking.id.slice(-8).toUpperCase()}`,
          paidAt:    new Date(createdAt.getTime() + randomInt(1, 3) * 86400000),
          createdAt,
          updatedAt: createdAt,
        },
      });
    }

    // Review for released bookings
    if (status === "RELEASED") {
      const rating = randomItem([3, 4, 4, 4, 5, 5, 5, 5]);
      await prisma.review.create({
        data: {
          bookingId:    booking.id,
          customerId:   customer.id,
          providerId:   provider.id,
          rating,
          comment:      randomItem(REVIEW_COMMENTS),
          helpfulCount: randomInt(0, 25),
          createdAt:    new Date(eventDate.getTime() + randomInt(3, 14) * 86400000),
        },
      }).catch(() => {});
    }

    // Collect some bookings for message threads
    if (["RELEASED", "IN_ESCROW", "CONFIRMED"].includes(status) && bookingsForMessages.length < 8) {
      bookingsForMessages.push({
        bookingId:     booking.id,
        customerId:    customer.id,
        providerUserId: provider.user.id,
      });
    }

    bookingCount++;
  }
  console.log(`✓ ${bookingCount} bookings seeded (with payments & reviews).`);

  // ── ROLL UP RATINGS ───────────────────────────────────────────────────────
  // After all reviews are created, compute real avg rating + count per provider
  const allProviderIds = (await prisma.providerProfile.findMany({ select: { id: true } })).map(p => p.id);
  let ratingUpdates = 0;
  for (const pid of allProviderIds) {
    const agg = await prisma.review.aggregate({
      where: { providerId: pid },
      _avg:   { rating: true },
      _count: { rating: true },
    });
    const avg   = agg._avg.rating  ? Math.round(agg._avg.rating * 10) / 10 : 0;
    const count = agg._count.rating || 0;
    await prisma.providerProfile.update({
      where: { id: pid },
      data:  { rating: avg, reviewCount: count },
    });
    ratingUpdates++;
  }
  console.log(`✓ Rolled up ratings for ${ratingUpdates} providers.`);

  // ── MESSAGES (conversations for 8 booking pairs) ───────────────────────────
  const MESSAGE_SCRIPTS = [
    [
      { from: "customer", text: "Hi! I'd like to learn more about your services." },
      { from: "provider", text: "Of course! Welcome. What occasion are you planning?" },
      { from: "customer", text: "We're planning a wedding reception for around 200 guests." },
      { from: "provider", text: "Wonderful! We specialize in exactly that. Which date do you have in mind?" },
      { from: "customer", text: "We're looking at sometime in October or November." },
      { from: "provider", text: "We have availability in both months. Would you like to schedule a call to discuss details?" },
      { from: "customer", text: "Yes, that would be perfect! What's your process?" },
      { from: "provider", text: "We start with a consultation, then send a custom proposal within 48 hours." },
    ],
    [
      { from: "customer", text: "Good morning! I saw your portfolio and I'm very impressed." },
      { from: "provider", text: "Thank you so much! Which package caught your attention?" },
      { from: "customer", text: "The full coverage package looks great. What's included exactly?" },
      { from: "provider", text: "It includes 2 photographers, drone footage, a printed album, and a digital gallery." },
      { from: "customer", text: "Perfect. Can we customize it a bit?" },
      { from: "provider", text: "Absolutely, all our packages can be tailored to your needs." },
    ],
    [
      { from: "customer", text: "Hello, can you accommodate 300 guests for catering?" },
      { from: "provider", text: "Yes we can! We've handled events up to 500 guests." },
      { from: "customer", text: "Amazing. What's your most popular menu?" },
      { from: "provider", text: "Our VIP Mashweyat Buffet is always a hit at weddings." },
      { from: "customer", text: "Sounds delicious. Can we do a tasting session?" },
      { from: "provider", text: "Of course! We schedule complimentary tastings every Saturday." },
      { from: "customer", text: "This Saturday works for us!" },
    ],
    [
      { from: "customer", text: "Hi, we're interested in your decor services for our engagement." },
      { from: "provider", text: "Congratulations on your engagement! Let's make it magical." },
      { from: "customer", text: "We're going for an oriental theme with lots of flowers." },
      { from: "provider", text: "Beautiful choice. We have stunning arabesque and floral setups." },
      { from: "customer", text: "Do you also handle lighting?" },
      { from: "provider", text: "Yes — our Sahra Lighting package is perfect for evening events." },
    ],
    [
      { from: "customer", text: "Are you available for a corporate event next month?" },
      { from: "provider", text: "Let me check our calendar... Yes, we have openings in the last two weeks." },
      { from: "customer", text: "Great. It's a formal gala dinner for about 150 people." },
      { from: "provider", text: "We handle corporate galas regularly. Professional setup guaranteed." },
      { from: "customer", text: "Excellent. Please send your proposal when ready." },
      { from: "provider", text: "I'll have a detailed proposal in your inbox by tomorrow morning." },
    ],
  ];

  let msgCount = 0;
  for (let i = 0; i < bookingsForMessages.length && i < MESSAGE_SCRIPTS.length; i++) {
    const { customerId, providerUserId } = bookingsForMessages[i];
    const script = MESSAGE_SCRIPTS[i % MESSAGE_SCRIPTS.length];

    for (let j = 0; j < script.length; j++) {
      const line      = script[j];
      const senderId  = line.from === "customer" ? customerId : providerUserId;
      const recvId    = line.from === "customer" ? providerUserId : customerId;
      const sentAt    = new Date(Date.now() - (script.length - j) * randomInt(3, 15) * 60000);
      const isUnread  = j === script.length - 1; // last message unread

      await prisma.message.create({
        data: {
          senderId:   senderId,
          receiverId: recvId,
          content:    line.text,
          isRead:     !isUnread,
          createdAt:  sentAt,
          updatedAt:  sentAt,
        },
      });
      msgCount++;
    }
  }
  console.log(`✓ ${msgCount} messages seeded across ${Math.min(bookingsForMessages.length, MESSAGE_SCRIPTS.length)} conversations.`);

  // ── DISPUTES (5 disputes with varied statuses) ─────────────────────────────
  const DISPUTE_DATA = [
    {
      title:       "Provider did not show up on event day",
      description: "We booked a photography team for our wedding on October 15th. Despite full payment being held in escrow, the photographer did not arrive at the venue. We had to hire a last-minute replacement at great expense. We are requesting a full refund and compensation for the inconvenience caused.",
      status:      "OPEN",
      creatorIdx:  0, // customer index
      role:        "CUSTOMER",
      adminResponse: null,
    },
    {
      title:       "Customer is refusing to release payment after service",
      description: "We successfully completed the full catering service for the client's event on September 22nd. All 250 guests were served, the food quality was exceptional, and we received compliments on the day. However, the customer has not released the escrow payment despite multiple follow-ups. It has been 3 weeks since the event.",
      status:      "IN_PROGRESS",
      creatorIdx:  2, // provider index
      role:        "PROVIDER",
      adminResponse: "We have contacted the customer and are reviewing the evidence from both parties. A resolution is expected within 5 business days.",
    },
    {
      title:       "Decor quality was significantly below what was agreed",
      description: "The decor package we purchased included a custom Kosha, arabesque lanterns, and full floral arrangements. On the day, only a basic backdrop was set up with minimal flowers. The Kosha was a standard rental piece, nothing like the custom design shown in the portfolio. We paid EGP 45,000 for a service worth far less.",
      status:      "RESOLVED",
      creatorIdx:  1,
      role:        "CUSTOMER",
      adminResponse: "After reviewing the contract and photos submitted by both parties, we have determined that the service delivered did not match the agreed specifications. A partial refund of EGP 15,000 has been processed. The provider has been issued a formal warning.",
    },
    {
      title:       "Incorrect billing — charged twice for the same booking",
      description: "My account was charged twice for the same booking. I see two Payment entries for Booking #A3F291. The second charge appeared 3 days after the first. Please reverse the duplicate charge immediately.",
      status:      "RESOLVED",
      creatorIdx:  3,
      role:        "CUSTOMER",
      adminResponse: "We have investigated and confirmed the duplicate charge. The second payment has been reversed. Please allow 3-5 business days for the refund to appear.",
    },
    {
      title:       "Customer left a false negative review",
      description: "A customer who booked our photography service left a 1-star review claiming we were unprofessional. We have video evidence and testimonials from other guests at the same event showing our team was courteous and professional throughout. The review appears to be malicious and is severely harming our business.",
      status:      "CLOSED",
      creatorIdx:  4, // provider index
      role:        "PROVIDER",
      adminResponse: "We reviewed the evidence submitted by the provider and the customer's account history. The review has been flagged and removed from the platform as it violates our content guidelines. The customer has been warned.",
    },
  ];

  let disputeCount = 0;
  try {
    for (const d of DISPUTE_DATA) {
    const creator = d.role === "CUSTOMER"
      ? createdCustomers[d.creatorIdx]
      : { id: providers[d.creatorIdx].user.id, name: providers[d.creatorIdx].businessName };

    await prisma.dispute.create({
      data: {
        title:         d.title,
        description:   d.description,
        status:        d.status as never,
        creatorId:     creator.id,
        creatorRole:   d.role as never,
        adminResponse: d.adminResponse,
        resolvedAt:    ["RESOLVED", "CLOSED"].includes(d.status) ? new Date(Date.now() - randomInt(1, 14) * 86400000) : null,
        attachments: {
          create: [
            {
              filePath: `https://picsum.photos/seed/dispute-${d.creatorIdx}-a/400/300`,
              fileName: "evidence_photo_1.jpg",
              fileSize: randomInt(200000, 800000),
            },
            {
              filePath: `https://picsum.photos/seed/dispute-${d.creatorIdx}-b/400/300`,
              fileName: "evidence_photo_2.jpg",
              fileSize: randomInt(200000, 800000),
            },
          ],
        },
      },
    });
  }
    disputeCount++;
    }
    console.log(`✓ ${disputeCount} disputes seeded.`);
  } catch (e) {
    console.log("  ↳ Skipped disputes (run 'npx prisma migrate dev --name add-dispute-model' first):", (e as Error).message?.slice(0, 80));
  }

  console.log("\n🎉 Database fully seeded!");
  console.log("   Admin:     admin@chronos.com   / Admin@123!");
  console.log("   Customer:  yasmine@example.com / Customer@123!");
  console.log("   Provider:  (see DB for emails)  / Provider@123!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
