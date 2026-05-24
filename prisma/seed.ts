import { PrismaClient, ServiceCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Portrait & Gallery helpers ────────────────────────────────────────────────
function portrait(gender: "men" | "women", n: number) { return `https://randomuser.me/api/portraits/${gender}/${n}.jpg`; }
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
  console.log("Cleaning up existing data...");
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.event.deleteMany();
  await prisma.package.deleteMany();
  await prisma.service.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.providerAvailability.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding database...");

  const providerPassword = await bcrypt.hash("Provider@123!", 10);
  const customerPassword = await bcrypt.hash("Customer@123!", 10);
  const adminPassword    = await bcrypt.hash("Admin@123!", 10);

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@chronos.com",
      password: adminPassword,
      role: "ADMIN",
      avatarUrl: portrait("women", 44),
    },
  });

  // ── CUSTOMERS ─────────────────────────────────────────────────────────────
  const customersData = [
    { name: "Yasmine El-Sayed", email: "yasmine@example.com", avatar: portrait("women", 22) },
    { name: "Mohamed Youssef", email: "mohamed@example.com", avatar: portrait("men", 33) },
    { name: "Omar Hassan", email: "omar@example.com", avatar: portrait("men", 15) },
  ];

  for (const c of customersData) {
    await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        password: customerPassword,
        role: "CUSTOMER",
        avatarUrl: c.avatar,
      },
    });
  }

  // ── DYNAMIC PROVIDERS ──────────────────────────────────────────────────────
  console.log(`Generating providers across ${CATEGORIES.length} categories...`);

  let providerCount = 0;

  for (const category of CATEGORIES) {
    const tpl = CATEGORY_TEMPLATES[category];
    
    // Generate 5 providers for each category
    for (let i = 1; i <= 5; i++) {
      providerCount++;
      const isPerson = Math.random() > 0.5;
      
      let businessName = "";
      let avatarUrl = "";
      
      if (isPerson) {
        const isMale = Math.random() > 0.5;
        const firstName = isMale ? randomItem(FIRST_NAMES_MALE) : randomItem(FIRST_NAMES_FEMALE);
        businessName = `${firstName} ${randomItem(LAST_NAMES)} ${randomItem(tpl.suffix)}`;
        avatarUrl = portrait(isMale ? "men" : "women", randomInt(1, 99));
      } else {
        const prefix = Math.random() > 0.3 ? randomItem(ADJECTIVES) : randomItem(tpl.prefix);
        businessName = `${prefix} ${randomItem(tpl.suffix)}`;
        avatarUrl = portrait(Math.random() > 0.5 ? "men" : "women", randomInt(1, 99));
      }

      // 1 service per provider (to simplify and ensure exactly 3 tiered packages)
      const serviceData = Array.from({ length: 1 }).map((_, sIdx) => {
        
        // 3 Tiers
        const tiers = ["Essential", "Signature", "Prestige"];
        const hasPromotion = Math.random() > 0.5; // 50% chance of promotion on this provider
        const promotionTier = randomInt(0, 2); // Which tier gets the promo?

        const packageData = tiers.map((tierName, pIdx) => {
          const isPromo = hasPromotion && pIdx === promotionTier;
          const discountPercentage = isPromo ? randomItem([10, 15, 20, 25, 30]) : null;

          // Price scales with tier
          const basePrice = randomInt(1500, 5000) * (pIdx + 1) * (pIdx === 2 ? 1.5 : 1);
          
          return {
            name: `${tierName} ${randomItem(tpl.pkgNames)}`,
            description: `Comprehensive ${tierName.toLowerCase()} package tailored for your occasion including ${randomItem(tpl.pkgFeatures).toLowerCase()}.`,
            price: Math.floor(basePrice),
            duration: `${randomInt(2 + pIdx * 2, 4 + pIdx * 2)} Hours`,
            isHighlight: pIdx === 1, // Make Signature the highlight
            features: randomItems(tpl.pkgFeatures, randomInt(3, 5 + pIdx)),
            isPromotion: isPromo,
            discountPercentage: discountPercentage
          };
        });

        return {
          name: `${businessName} Service`,
          category: category,
          packages: { create: packageData }
        };
      });

      const user = await prisma.user.create({
        data: {
          name: businessName,
          email: `provider${providerCount}@chronos.com`,
          password: providerPassword,
          role: "PROVIDER",
          avatarUrl: avatarUrl,
        },
      });

      const galleryData = Array.from({ length: randomInt(3, 8) }).map((_, gIdx) => ({
        imageUrl: gallery(category.toLowerCase(), providerCount * 10 + gIdx),
        label: `${category} showcase ${gIdx + 1}`,
        aspect: randomItem(["landscape", "portrait", "square"])
      }));

      await prisma.providerProfile.create({
        data: {
          userId: user.id,
          businessName: businessName,
          bio: randomItem(tpl.bio),
          location: randomItem(LOCATIONS),
          since: randomInt(2005, 2024),
          responseTime: randomItem(["within an hour", "within a few hours", "within a day"]),
          isVerified: Math.random() > 0.2,
          badge: Math.random() > 0.7 ? "Top Rated" : null,
          services: { create: serviceData },
          galleryItems: { create: galleryData },
        },
      });
    }
  }

  console.log(`Seeded ${providerCount} dynamic providers across all categories successfully.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
