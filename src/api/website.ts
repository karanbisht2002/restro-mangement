export interface WebsiteContent {
  restaurantName: string;
  tagline: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutStoryP1: string;
  aboutStoryP2: string;
  experienceHighlights: string[];
  phone: string;
  reservationHotline: string;
  email: string;
  address: string;
  operatingHours: string;
  googleMapsUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  reservationDeposit?: number;
  payuMerchantKey?: string;
  payuTestMode?: boolean;
  currencySymbol?: string;
  logoUrl?: string;
  faviconUrl?: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: "Ambience" | "Nightlife & Club" | "Drinks & Cocktails" | "Cuisine";
  imageUrl: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface OfferItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  imageUrl: string;
  validUntil: string;
  terms: string;
  isActive: boolean;
  createdAt: string;
}

export interface BlogItem {
  id: string;
  title: string;
  category: string;
  author: string;
  readTime: string;
  publishDate: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  isPublished: boolean;
}

const DEFAULT_CONTENT: WebsiteContent = {
  restaurantName: "Table & Thyme",
  tagline: "Where Grand Ambiance Meets Modern Gastronomy",
  heroSubtitle:
    "An opulent restro-lounge spread across dramatic spaces with towering arches, handcrafted cocktails, exquisite global cuisine, and electrifying weekend DJ sets.",
  aboutTitle: "Atmospheric Grandeur & Culinary Excellence",
  aboutStoryP1:
    "Founded with a vision to revolutionize high-energy dining and nightlife, our restro-lounge offers a multi-sensory escape. The space is inspired by majestic architecture, bespoke wrought-iron accents, and intimate mood lighting.",
  aboutStoryP2:
    "From artisan smoked mixology and curated malt selections to progressive world cuisine prepared by master chefs, every visit is designed to ignite the senses. Whether you are enjoying a relaxed sunset lounge on our terrace or soaking in the pulse of our club floor, we offer unmatched luxury.",
  experienceHighlights: [
    "Expansive Lounge & Sky Terrace",
    "Celebrity Resident & Guest DJs",
    "Award-Winning Artisanal Mixology",
    "Progressive Global & Tandoor Tapas",
  ],
  phone: "+91 99998 76543",
  reservationHotline: "+91 98201 11001",
  email: "reservations@tableandthyme.in",
  address: "Connaught Place, Central Boulevard, New Delhi 110001",
  operatingHours: "Monday – Sunday: 12:00 PM – 01:00 AM",
  googleMapsUrl: "https://maps.google.com/?q=Connaught+Place+New+Delhi",
  instagramUrl: "https://instagram.com",
  facebookUrl: "https://facebook.com",
  updatedAt: new Date().toISOString(),
};

const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: "gal_1",
    title: "Grand Medieval Archway & Main Lounge",
    category: "Ambience",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "gal_2",
    title: "Signature Smoked Bourbon Concoction",
    category: "Drinks & Cocktails",
    imageUrl:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "gal_3",
    title: "High Energy Weekend DJ & Dance Zone",
    category: "Nightlife & Club",
    imageUrl:
      "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "gal_4",
    title: "Truffle Glazed Lamb Chops & Microgreens",
    category: "Cuisine",
    imageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "gal_5",
    title: "Open-Air Sky Terrace & Sunset Cabanas",
    category: "Ambience",
    imageUrl:
      "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "gal_6",
    title: "Flaming Rosemary & Citrus Botanical Gin",
    category: "Drinks & Cocktails",
    imageUrl:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_OFFERS: OfferItem[] = [
  {
    id: "off_1",
    title: "1+1 On Signature Cocktails",
    subtitle: "Sundowner Happy Hours",
    badge: "1+1 FREE",
    description:
      "Enjoy buy-1-get-1 on all handcrafted signature cocktails, botanical gins, and chilled draught beers every afternoon between 3:00 PM and 7:00 PM.",
    imageUrl:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
    validUntil: "Daily · 3 PM – 7 PM",
    terms: "Valid on domestic & select imported spirits. Cannot be clubbed with other promotional packages.",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "off_2",
    title: "Ladies Night Sangria & Bubbles",
    subtitle: "Every Wednesday Evening",
    badge: "FREE SANGRIA",
    description:
      "Complimentary endless fresh berry sangria and sparkling bubbles for all ladies accompanied by commercial club beats and artisan tapas.",
    imageUrl:
      "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=800&q=80",
    validUntil: "Every Wednesday · 8 PM Onwards",
    terms: "Complimentary bar access for all ladies. Prior table reservation recommended for groups.",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "off_3",
    title: "Weekend Electric Club Nights",
    subtitle: "Friday & Saturday Live",
    badge: "FREE ENTRY",
    description:
      "High-energy dual floor nightlife featuring top resident & celebrity DJs with immersive laser visuals, VIP bottle service, and midnight club bites.",
    imageUrl:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    validUntil: "Fri & Sat · 9:30 PM Onwards",
    terms: "Free couple entry on guestlist before 10:30 PM. Smart casual club dress code applies.",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "off_4",
    title: "Royal Sunday Feast Brunch",
    subtitle: "Unlimited Gourmet & Spirits",
    badge: "25% OFF",
    description:
      "Lavish 6-station gourmet brunch with live woodfired grills, artisanal sushi, dimsum counters, slow-cooked mains, and free-flowing mimosas.",
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    validUntil: "Every Sunday · 12:30 PM – 4:30 PM",
    terms: "Children under 6 dine complimentary. Advance reservation recommended at least 24h prior.",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "off_5",
    title: "Corporate Executive Luncheon",
    subtitle: "Express 3-Course Gourmet Menu",
    badge: "CHEF SPECIAL",
    description:
      "Curated 3-course executive spread with choice of gourmet appetizer, signature main, and artisanal dessert served in 45 minutes for business rendezvous.",
    imageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    validUntil: "Mon – Fri · 12:00 PM – 3:30 PM",
    terms: "Minimum 2 guests. Corporate privileges and group invoicing available upon request.",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "off_6",
    title: "VIP Birthday & Celebration Package",
    subtitle: "Private Butler & Champagne",
    badge: "VIP PERKS",
    description:
      "Celebrate milestones in our VIP mezzanine with dedicated butler service, custom celebration cake, and complimentary bottle of sparkling champagne.",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    validUntil: "All Days · Advance Booking",
    terms: "Requires minimum 24-hour advance reservation and party of 6 or more.",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_BLOGS: BlogItem[] = [
  {
    id: "blog_1",
    title: "The Art of Smoking Cocktails: Alchemy Behind Our Signature Concoctions",
    category: "Mixology",
    author: "Head Mixologist",
    readTime: "4 min read",
    publishDate: "Sept 14, 2026",
    excerpt:
      "Discover the meticulous craft of torching seasoned French oak barrels, infusing smoked applewood chips, and balancing rare small-batch spirits.",
    content: `Mixology at our lounge is an immersive sensory journey. Our bar masters combine traditional infusion techniques with modern molecular tools.

From torching fragrant rosemary sprigs and charred cinnamon bark to capturing toasted French oak smoke within chilled crystal decanters, each cocktail is crafted to tell a story before the first sip is even taken.

When you order our signature smoked old fashioned, the drink arrives under an ornate glass bell cloche. As our mixologist lifts the dome at your table, a fragrant mist of hickory wood smoke rolls across the marble bar top, revealing amber spirits poured over a hand-carved ice sphere.

Join us this weekend at the central bar to experience our new autumn flight of barrel-aged elixirs and discover how smoke transforms fine spirits into liquid poetry!`,
    imageUrl:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
    isPublished: true,
  },
  {
    id: "blog_2",
    title: "Atmospheric Grandeur: Designing Medieval Luxury in the Modern City",
    category: "Design & Ambiance",
    author: "Design Curator",
    readTime: "5 min read",
    publishDate: "Sept 10, 2026",
    excerpt:
      "How antique gothic architecture, soaring wrought-iron chandeliers, and velvet upholstery created an iconic restro-lounge.",
    content: `When designing our flagship lounge, the inspiration came from old-world European castle halls mixed with contemporary metropolitan nightlife energy.

Spanning over 15,000 square feet across two expansive floors, high ceilings, exposed brick masonry, and panoramic double-height windows looking out over the city give guests a sense of elevated escape.

By day, warm sunlight filters across plush velvet booths and hand-finished stone surfaces; by night, golden amber illumination transforms the venue into an electrifying party sanctuary.

Custom acoustic baffles concealed beneath distressed wooden trusses ensure that even as the resident DJ turns up the tempo on the club floor, conversation flows effortlessly in our private dining salons and open-air rooftop terrace.`,
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    isPublished: true,
  },
  {
    id: "blog_3",
    title: "Curating Rare Single Malts: A Journey Through Our Cellar Vault",
    category: "Fine Spirits",
    author: "Sommelier & Cellar Master",
    readTime: "4 min read",
    publishDate: "Sept 04, 2026",
    excerpt:
      "Inside our climate-controlled vault housing over 120 exceptional labels—from peated Islay classics to rare Japanese craft whiskies.",
    content: `A truly iconic restro-lounge requires a spirit cellar of uncompromising caliber. Our temperature and humidity-controlled vault houses over 120 hand-selected whisky expressions, vintage cognacs, and boutique craft rums from the world's most revered distilleries.

Our collection journeys across the foggy peat bogs of Islay with intense medicinal smoke notes, meanders through the honeyed floral orchards of Speyside, and embraces the delicate oak precision of Japanese distillers in Yamazaki and Hakushu.

Each spirit on our reserve menu is served with customized crystal glassware and crystal-clear artisanal ice spheres crafted in-house to ensure zero dilution during your tasting experience.

Our sommelier team hosts private tasting flights every Thursday evening, walking guests through comparative age statements, cask finishes, and intricate flavor notes.`,
    imageUrl:
      "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80",
    isPublished: true,
  },
  {
    id: "blog_4",
    title: "Behind the Turntables: Curating Soundscapes for Electric Nights",
    category: "Nightlife & Music",
    author: "Music & Entertainment Director",
    readTime: "3 min read",
    publishDate: "Aug 28, 2026",
    excerpt:
      "An insider look into how our acoustic engineering and resident DJ rotation transition an elegant dinner into the city's most electric dance floor.",
    content: `The soundtrack of our lounge is never an afterthought—it is the beating heart of our guest experience. As the clock moves from sunset twilight into the late evening, our music programming undergoes a seamless sonic metamorphosis.

During afternoon sundowners, breezy deep house and acoustic jazz drift through the open terrace. By 9:30 PM, our custom Void Acoustics sound rig awakens, transitioning the venue into a pulsating dance floor led by top resident and guest international DJ headliners.

From melodic progressive house and high-energy commercial club edits to the signature big-room Bollywood remixes that keep our VIP tables buzzing until closing, our DJs curate sets tailored dynamically to the energy of the crowd.

For table reservations during weekend headliner nights, booking your cabana or mezzanine booth early is essential to guarantee priority entry and prime dance-floor sightlines.`,
    imageUrl:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    isPublished: true,
  },
  {
    id: "blog_5",
    title: "Fire, Spice & Precision: Progressive Global Cuisine Meets Ancient Tandoor",
    category: "Culinary Arts",
    author: "Executive Chef",
    readTime: "5 min read",
    publishDate: "Aug 18, 2026",
    excerpt:
      "How our kitchen masters marry time-honored charcoal tandoori cooking with Mediterranean tapas, Asian reductions, and progressive plating.",
    content: `At our kitchen pass, boundaries between traditional comfort and progressive fine dining dissolve. We believe that bold flavors and culinary sophistication belong together on the same plate.

Our culinary team utilizes twin high-heat charcoal tandoors burning aromatic fruitwoods alongside modern sous-vide baths and woodfired hearths. This dual mastery allows us to create signature dishes like our Truffle-Glazed Lamb Chops, smoked burrata kulchas with wild mushroom reduction, and charred tiger prawns with citrus ponzu foam.

Every sauce, reduction, and artisanal spice rub is crafted from scratch using stone-ground spices and organic produce sourced directly from regional farms.

Whether dining as a couple over tapas and craft cocktails or hosting a celebratory banquet with family, our menu invites you to explore familiar flavors elevated to extraordinary heights.`,
    imageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    isPublished: true,
  },
];

export async function fetchWebsiteContent(): Promise<WebsiteContent> {
  try {
    const res = await fetch("/api/website/content");
    if (!res.ok) throw new Error("Failed to fetch");
    const json = await res.json();
    return json.data || DEFAULT_CONTENT;
  } catch {
    return DEFAULT_CONTENT;
  }
}

export async function updateWebsiteContent(
  payload: Partial<WebsiteContent>,
): Promise<WebsiteContent> {
  try {
    const res = await fetch("/api/website/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update");
    const json = await res.json();
    return json.data;
  } catch {
    return { ...DEFAULT_CONTENT, ...payload, updatedAt: new Date().toISOString() };
  }
}

export async function fetchWebsiteGallery(): Promise<GalleryItem[]> {
  try {
    const res = await fetch("/api/website/gallery");
    if (!res.ok) throw new Error("Failed to fetch");
    const json = await res.json();
    return json.data && json.data.length > 0 ? json.data : DEFAULT_GALLERY;
  } catch {
    return DEFAULT_GALLERY;
  }
}

export async function createGalleryPhoto(
  payload: Omit<GalleryItem, "id" | "createdAt">,
): Promise<GalleryItem> {
  const res = await fetch("/api/website/gallery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create photo");
  const json = await res.json();
  return json.data;
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  const res = await fetch(`/api/website/gallery/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete photo");
}

export async function fetchWebsiteOffers(): Promise<OfferItem[]> {
  try {
    const res = await fetch("/api/website/offers");
    if (!res.ok) throw new Error("Failed to fetch");
    const json = await res.json();
    return json.data && json.data.length > 0 ? json.data : DEFAULT_OFFERS;
  } catch {
    return DEFAULT_OFFERS;
  }
}

export async function createWebsiteOffer(
  payload: Omit<OfferItem, "id" | "createdAt">,
): Promise<OfferItem> {
  const res = await fetch("/api/website/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create offer");
  const json = await res.json();
  return json.data;
}

export async function updateWebsiteOffer(
  id: string,
  payload: Partial<OfferItem>,
): Promise<OfferItem> {
  const res = await fetch(`/api/website/offers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update offer");
  const json = await res.json();
  return json.data;
}

export async function deleteWebsiteOffer(id: string): Promise<void> {
  const res = await fetch(`/api/website/offers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete offer");
}

export async function fetchWebsiteBlogs(): Promise<BlogItem[]> {
  try {
    const res = await fetch("/api/website/blogs");
    if (!res.ok) throw new Error("Failed to fetch");
    const json = await res.json();
    return json.data && json.data.length > 0 ? json.data : DEFAULT_BLOGS;
  } catch {
    return DEFAULT_BLOGS;
  }
}

export async function createWebsiteBlog(
  payload: Omit<BlogItem, "id">,
): Promise<BlogItem> {
  const res = await fetch("/api/website/blogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create blog");
  const json = await res.json();
  return json.data;
}

export async function updateWebsiteBlog(
  id: string,
  payload: Partial<BlogItem>,
): Promise<BlogItem> {
  const res = await fetch(`/api/website/blogs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update blog");
  const json = await res.json();
  return json.data;
}

export async function deleteWebsiteBlog(id: string): Promise<void> {
  const res = await fetch(`/api/website/blogs/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete blog");
}
