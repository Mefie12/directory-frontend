export interface HeroSlide {
  id: number;
  image: string;
  title: string;
  description: string;
  cta: string;
  cta2: string;
  link: string;
}

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Discover African-Owned Businesses & Events",
    description:
      "Connect with African owned businesses, cultural events, and services across the diaspora and back home",
    image: "/images/backgroundImages/hero1.jpg",
    cta: "Join as a vendor",
    cta2: "Explore listing",
    link: "",
  },
  {
    id: 2,
    title: "Discover African-Owned Businesses & Events",
    description:
      "Connect with African owned businesses, cultural events, and services across the diaspora and back home",
    image: "/images/backgroundImages/hero2.jpg",
    cta: "Join as a vendor",
    cta2: "Explore listing",
    link: "",
  },
  {
    id: 3,
    title: "Discover African-Owned Businesses & Events",
    description:
      "Connect with African owned businesses, cultural events, and services across the diaspora and back home",
    image: "/images/backgroundImages/hero3.jpg",
    cta: "Join as a vendor",
    cta2: "Explore listing",
    link: "",
  },
];

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string;
  createdAt: Date;
  popularity: number;
};

export const categories: Category[] = [
  {
    id: "1",
    name: "Events",
    slug: "events",
    image: "/images/backgroundImages/categories/event.jpg",
    createdAt: new Date("2024-01-15"),
    popularity: 850,
  },
  {
    id: "2",
    name: "Cultural Services",
    slug: "cultural-services",
    image: "/images/backgroundImages/categories/culture.jpg",
    createdAt: new Date("2024-02-20"),
    popularity: 720,
  },
  {
    id: "3",
    name: "Fashion & Lifestyle",
    slug: "fashion-lifestyle",
    image: "/images/backgroundImages/categories/fashion.jpg",
    createdAt: new Date("2024-03-10"),
    popularity: 950,
  },
  {
    id: "4",
    name: "Food & Hospitality",
    slug: "food-hospitality",
    image: "/images/backgroundImages/categories/food.jpg",
    createdAt: new Date("2024-01-25"),
    popularity: 1100,
  },
  {
    id: "5",
    name: "Education & Learning",
    slug: "education-learning",
    image: "/images/backgroundImages/categories/education.jpg",
    createdAt: new Date("2024-02-05"),
    popularity: 680,
  },
  {
    id: "6",
    name: "Financial Services",
    slug: "financial-services",
    image: "/images/backgroundImages/categories/finance.jpg",
    createdAt: new Date("2024-03-15"),
    popularity: 890,
  },
  {
    id: "7",
    name: "Shipping & Logistics",
    slug: "shipping-logistics",
    image: "/images/backgroundImages/categories/logistics.jpg",
    createdAt: new Date("2024-01-30"),
    popularity: 620,
  },
  {
    id: "8",
    name: "Property Relocation",
    slug: "property-relocation",
    image: "/images/backgroundImages/categories/property.jpg",
    createdAt: new Date("2024-02-28"),
    popularity: 750,
  },
];

// Business Categories for filtering
export type BusinessCategory = {
  label: string;
  value: string;
};

export const businessCategories: BusinessCategory[] = [
  { label: "All businesses", value: "all" },
  { label: "Dancers", value: "dancers" },
  { label: "Cultural Attire Stylist", value: "cultural-attire-stylist" },
  { label: "Drummers & Cultural Performers", value: "drummers-cultural-performers" },
  { label: "Clothing", value: "clothing" },
  { label: "Jewellery", value: "jewellery" },
  { label: "Art & Crafts", value: "art-crafts" },
  { label: "Caterer", value: "caterer" },
  { label: "Toys & Games", value: "toys-games" },
  { label: "Books & Magazines", value: "books-magazines" },
];

export type Business = {
  id: string;
  name: string;
  description: string;
  category: string;
  country: string;
  image: string;
  rating: number;
  reviewCount: string;
  location: string;
  verified?: boolean;
  slug: string;
  type: "business";
  createdAt: string;
  discount?: string;
  availableFrom?: string;
  availableTo?: string;
};

export const featuredBusinesses: Business[] = [
  // Clothing Category
  {
    id: "1",
    name: "Kente Tailor",
    description: "Expert bespoke tailoring for traditional African wedding attire and formal wear",
    category: "Clothing",
    country: "United Kingdom",
    image: "/images/clothing/clothing1.jpg",
    rating: 4.8,
    reviewCount: "2.2k",
    location: "South London, United Kingdom",
    verified: true,
    slug: "kente-tailor-bespoke-mens-wedding-attire",
    type: "business",
    createdAt: "2024-01-15T00:00:00Z",
    availableFrom: "2025-01-01",
    availableTo: "2025-12-31",
  },
  {
    id: "2",
    name: "Ankara Fashion House",
    description: "Contemporary African fashion with modern designs and traditional prints",
    category: "Clothing",
    country: "United States",
    image: "/images/clothing/clothing2.jpg",
    rating: 4.6,
    reviewCount: "1.8k",
    location: "West London, United Kingdom",
    verified: true,
    slug: "ankara-fashion-house",
    type: "business",
    createdAt: "2024-01-20T00:00:00Z",
    discount: "-15%",
    availableFrom: "2025-04-01",
    availableTo: "2025-06-30",
  },
  {
    id: "3",
    name: "Heritage Clothing Boutique",
    description: "Authentic African clothing and accessories for all occasions",
    category: "Clothing",
    country: "Canada",
    image: "/images/clothing/clothing3.jpg",
    rating: 4.7,
    reviewCount: "1.5k",
    location: "Central London, United Kingdom",
    verified: false,
    slug: "heritage-clothing-boutique",
    type: "business",
    createdAt: "2024-01-25T00:00:00Z",
    availableFrom: "2025-07-01",
    availableTo: "2025-09-30",
  },
  {
    id: "4",
    name: "Afrocentric Styles",
    description: "Bold and vibrant African-inspired fashion for the modern wardrobe",
    category: "Clothing",
    country: "Ghana",
    image: "/images/clothing/clothing4.jpg",
    rating: 4.5,
    reviewCount: "1.3k",
    location: "North London, United Kingdom",
    verified: true,
    slug: "afrocentric-styles",
    type: "business",
    createdAt: "2024-02-01T00:00:00Z",
    availableFrom: "2025-10-01",
    availableTo: "2025-12-31",
  },

  // Jewellery Category
  {
    id: "5",
    name: "Beaded Heritage Necklaces",
    description: "Handcrafted traditional African beaded jewelry and accessories",
    category: "Jewellery",
    country: "Nigeria",
    image: "/images/jewellery/jewellery1.jpg",
    rating: 4.9,
    reviewCount: "2.5k",
    location: "South London, United Kingdom",
    verified: true,
    slug: "beaded-heritage-necklaces-bracelets",
    type: "business",
    createdAt: "2024-02-05T00:00:00Z",
    discount: "-20%",
    availableFrom: "2025-02-01",
    availableTo: "2025-05-31",
  },
  {
    id: "6",
    name: "Golden Adornments",
    description: "Exquisite African-inspired gold and silver jewelry pieces",
    category: "Jewellery",
    country: "South Africa",
    image: "/images/jewellery/jewellery2.jpg",
    rating: 4.8,
    reviewCount: "2.1k",
    location: "East London, United Kingdom",
    verified: true,
    slug: "golden-adornments",
    type: "business",
    createdAt: "2024-02-10T00:00:00Z",
    availableFrom: "2025-06-01",
    availableTo: "2025-08-31",
  },
  {
    id: "7",
    name: "Tribal Treasures Jewelry",
    description: "Unique handmade jewelry celebrating African tribal heritage",
    category: "Jewellery",
    country: "Kenya",
    image: "/images/jewellery/jewellery3.jpg",
    rating: 4.7,
    reviewCount: "1.9k",
    location: "West London, United Kingdom",
    verified: false,
    slug: "tribal-treasures-jewelry",
    type: "business",
    createdAt: "2024-02-15T00:00:00Z",
    availableFrom: "2025-03-01",
    availableTo: "2025-06-30",
  },
  {
    id: "8",
    name: "Cowrie Shell Creations",
    description: "Traditional cowrie shell jewelry and modern African accessories",
    category: "Jewellery",
    country: "Senegal",
    image: "/images/jewellery/jewellery4.jpg",
    rating: 4.6,
    reviewCount: "1.7k",
    location: "Central London, United Kingdom",
    verified: true,
    slug: "cowrie-shell-creations",
    type: "business",
    createdAt: "2024-02-20T00:00:00Z",
    discount: "-10%",
    availableFrom: "2025-08-01",
    availableTo: "2025-11-30",
  },

  // Art & Crafts Category
  {
    id: "9",
    name: "African Sculpture Gallery",
    description: "Traditional African sculptures and handcrafted art pieces",
    category: "Art & Crafts",
    country: "Ethiopia",
    image: "/images/art/art1.jpg",
    rating: 5.0,
    reviewCount: "2.8k",
    location: "South London, United Kingdom",
    verified: true,
    slug: "african-sculpture-gallery",
    type: "business",
    createdAt: "2024-02-25T00:00:00Z",
    availableFrom: "2025-01-01",
    availableTo: "2025-03-31",
  },
  {
    id: "10",
    name: "Heritage Pottery Studio",
    description: "Authentic African pottery and ceramic art workshops",
    category: "Art & Crafts",
    country: "Tanzania",
    image: "/images/art/art2.jpg",
    rating: 4.9,
    reviewCount: "2.3k",
    location: "North London, United Kingdom",
    verified: true,
    slug: "heritage-pottery-studio",
    type: "business",
    createdAt: "2024-03-01T00:00:00Z",
    availableFrom: "2025-04-01",
    availableTo: "2025-06-30",
  },
  {
    id: "11",
    name: "Afro Arts & Crafts",
    description: "Handmade African crafts, paintings, and decorative items",
    category: "Art & Crafts",
    country: "United States",
    image: "/images/art/art3.jpg",
    rating: 4.8,
    reviewCount: "2.0k",
    location: "East London, United Kingdom",
    verified: false,
    slug: "afro-arts-crafts",
    type: "business",
    createdAt: "2024-03-05T00:00:00Z",
    availableFrom: "2025-07-01",
    availableTo: "2025-09-30",
  },
  {
    id: "12",
    name: "Tribal Masks & Carvings",
    description: "Authentic African masks, wood carvings, and tribal art",
    category: "Art & Crafts",
    country: "Canada",
    image: "/images/art/art4.jpg",
    rating: 4.7,
    reviewCount: "1.8k",
    location: "West London, United Kingdom",
    verified: true,
    slug: "tribal-masks-carvings",
    type: "business",
    createdAt: "2024-03-10T00:00:00Z",
    discount: "-15%",
    availableFrom: "2025-10-01",
    availableTo: "2025-12-31",
  },

  // Caterer Category
  {
    id: "13",
    name: "Mama's African Catering",
    description: "Authentic African catering services for weddings and events",
    category: "Caterer",
    country: "Ghana",
    image: "/images/backgroundImages/categories/food.jpg",
    rating: 4.8,
    reviewCount: "3.2k",
    location: "South London, United Kingdom",
    verified: true,
    slug: "mamas-african-catering",
    type: "business",
    createdAt: "2024-03-15T00:00:00Z",
    discount: "-10%",
    availableFrom: "2025-02-01",
    availableTo: "2025-05-31",
  },
  {
    id: "14",
    name: "Jollof Kitchen Catering",
    description: "Specializing in West African cuisine for all your special occasions",
    category: "Caterer",
    country: "Nigeria",
    image: "/images/backgroundImages/business/food.jpg",
    rating: 4.7,
    reviewCount: "2.9k",
    location: "East London, United Kingdom",
    verified: true,
    slug: "jollof-kitchen-catering",
    type: "business",
    createdAt: "2024-03-20T00:00:00Z",
    availableFrom: "2025-06-01",
    availableTo: "2025-08-31",
  },

  // Dancers Category
  {
    id: "15",
    name: "African Dance Troupe",
    description: "Professional African dancers for events and cultural celebrations",
    category: "Dancers",
    country: "South Africa",
    image: "/images/backgroundImages/categories/culture.jpg",
    rating: 4.9,
    reviewCount: "1.8k",
    location: "Central London, United Kingdom",
    verified: true,
    slug: "african-dance-troupe",
    type: "business",
    createdAt: "2024-03-25T00:00:00Z",
    availableFrom: "2025-03-01",
    availableTo: "2025-06-30",
  },
  {
    id: "16",
    name: "Afrobeat Dance Academy",
    description: "Learn traditional and contemporary African dance styles",
    category: "Dancers",
    country: "Kenya",
    image: "/images/backgroundImages/business/event.jpg",
    rating: 4.6,
    reviewCount: "1.4k",
    location: "North London, United Kingdom",
    verified: false,
    slug: "afrobeat-dance-academy",
    type: "business",
    createdAt: "2024-03-30T00:00:00Z",
    availableFrom: "2025-08-01",
    availableTo: "2025-11-30",
  },

  // Cultural Attire Stylist Category
  {
    id: "17",
    name: "Heritage Attire Styling",
    description: "Expert styling for traditional African cultural attire and ceremonies",
    category: "Cultural Attire Stylist",
    country: "Senegal",
    image: "/images/backgroundImages/categories/fashion.jpg",
    rating: 4.8,
    reviewCount: "1.6k",
    location: "West London, United Kingdom",
    verified: true,
    slug: "heritage-attire-styling",
    type: "business",
    createdAt: "2024-04-01T00:00:00Z",
    availableFrom: "2025-01-01",
    availableTo: "2025-03-31",
  },

  // Drummers & Cultural Performers Category
  {
    id: "18",
    name: "Djembe Masters",
    description: "Traditional African drummers and cultural performers for all occasions",
    category: "Drummers & Cultural Performers",
    country: "Ethiopia",
    image: "/images/backgroundImages/business/event.jpg",
    rating: 4.9,
    reviewCount: "1.5k",
    location: "East London, United Kingdom",
    verified: true,
    slug: "djembe-masters",
    type: "business",
    createdAt: "2024-04-05T00:00:00Z",
    availableFrom: "2025-04-01",
    availableTo: "2025-06-30",
  },

  // Toys & Games Category
  {
    id: "19",
    name: "African Toy Emporium",
    description: "Educational toys and games celebrating African culture and heritage",
    category: "Toys & Games",
    country: "Tanzania",
    image: "/images/backgroundImages/business/vendor.jpg",
    rating: 4.5,
    reviewCount: "1.2k",
    location: "South London, United Kingdom",
    verified: false,
    slug: "african-toy-emporium",
    type: "business",
    createdAt: "2024-04-10T00:00:00Z",
    availableFrom: "2025-07-01",
    availableTo: "2025-09-30",
  },

  // Books & Magazines Category
  {
    id: "20",
    name: "African Literature Hub",
    description: "Books and magazines about African history, culture, and contemporary life",
    category: "Books & Magazines",
    country: "United States",
    image: "/images/backgroundImages/categories/education.jpg",
    rating: 4.7,
    reviewCount: "1.9k",
    location: "Central London, United Kingdom",
    verified: true,
    slug: "african-literature-hub",
    type: "business",
    createdAt: "2024-04-15T00:00:00Z",
    availableFrom: "2025-10-01",
    availableTo: "2025-12-31",
  },
];



// Events Categories for filtering
export type EventsCategory = {
  label: string;
  value: string;
};

export const events: EventsCategory[] = [
  { label: "All events", value: "all" },
  { label: "Concert", value: "concert" },
  { label: "Comedy", value: "comedy" },
  { label: "Theatre", value: "theatre" },
  { label: "Popular Events", value: "popular-events" },
  // { label: "Jewellery", value: "jewellery" },
  // { label: "Art & Crafts", value: "art-crafts" },
  // { label: "Caterer", value: "caterer" },
  // { label: "Toys & Games", value: "toys-games" },
  // { label: "Books & Magazines", value: "books-magazines" },
];
export type Event = {
  id: string;
  name: string;
  category: string;
  image: string;
  location: string;
  description: string;
  slug: string;
  startDate: string;
  endDate: string;
  verified: boolean;
  type: "event";
  date: string;
  time?: string;
  country: string;
  createdAt: string;
  availableFrom?: string;
  availableTo?: string;
};

export const Events: Event[] = [
  {
    id: "1",
    name: "TGMA 2026...",
    category: "Concert",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    image: "/images/backgroundImages/business/event.jpg",
    location: "Virtual",
    slug: "tgma-2026",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Ghana",
    createdAt: "2024-10-01T00:00:00Z",
    availableFrom: "2025-11-01",
    availableTo: "2025-12-15",
  },
  {
    id: "2",
    name: "African Heritage Festival",
    category: "Festival",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    image: "/images/backgroundImages/business/events2.jpg",
    location: "Virtual",
    slug: "african-heritage-festival",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Nigeria",
    createdAt: "2024-10-05T00:00:00Z",
    availableFrom: "2025-10-15",
    availableTo: "2025-12-10",
  },
  {
    id: "3",
    name: "Art & Culture Exhibition",
    category: "Art & Craft",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    image: "/images/backgroundImages/business/events3.jpg",
    location: "Virtual",
    slug: "art-culture-exhibition",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Kenya",
    createdAt: "2024-10-10T00:00:00Z",
    availableFrom: "2025-09-01",
    availableTo: "2025-11-30",
  },
  {
    id: "4",
    name: "Traditional Pottery Workshop",
    category: "Art & Craft",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    image: "/images/backgroundImages/business/events4.jpg",
    location: "Virtual",
    slug: "traditional-pottery-workshop",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: false,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "South Africa",
    createdAt: "2024-10-15T00:00:00Z",
    availableFrom: "2025-08-01",
    availableTo: "2025-10-31",
  },
  {
    id: "5",
    name: "African Cuisine Festival",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    category: "Food & Hospitality",
    image: "/images/backgroundImages/business/event.jpg",
    location: "Virtual",
    slug: "african-cuisine-festival",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: false,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Ethiopia",
    createdAt: "2024-10-20T00:00:00Z",
    availableFrom: "2025-07-01",
    availableTo: "2025-09-30",
  },
  {
    id: "6",
    name: "Fashion & Lifestyle Expo",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    category: "Fashion & Lifestyle",
    image: "/images/backgroundImages/business/events4.jpg",
    location: "Virtual",
    slug: "fashion-lifestyle-expo",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: false,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Senegal",
    createdAt: "2024-10-25T00:00:00Z",
    availableFrom: "2025-06-01",
    availableTo: "2025-08-31",
  },
  {
    id: "7",
    name: "Afrobeats Live Concert",
    category: "Concert",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    image: "/images/backgroundImages/business/events2.jpg",
    location: "Virtual",
    slug: "afrobeats-live-concert",
    startDate: "Sat, Nov 25",
    endDate: "Dec 5, 2025",
    verified: true,
    type: "event",
    date: "2025-11-25",
    time: "11:00",
    country: "Ghana",
    createdAt: "2024-10-26T00:00:00Z",
    availableFrom: "2025-05-01",
    availableTo: "2025-07-31",
  },
  {
    id: "8",
    name: "Ghana Party In The Park",
    category: "Concert",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    image: "/images/backgroundImages/business/events3.jpg",
    location: "Virtual",
    slug: "ghana-party-in-the-park",
    startDate: "Sat, Nov 25",
    endDate: "Dec 6, 2025",
    verified: true,
    type: "event",
    date: "2025-11-25",
    time: "11:00",
    country: "Ghana",
    createdAt: "2024-10-27T00:00:00Z",
    availableFrom: "2025-04-01",
    availableTo: "2025-06-30",
  },
  {
    id: "9",
    name: "Cultural Dance Festival",
    category: "Festival",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    image: "/images/backgroundImages/business/event.jpg",
    location: "Virtual",
    slug: "cultural-dance-festival",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Nigeria",
    createdAt: "2024-10-28T00:00:00Z",
    availableFrom: "2025-03-01",
    availableTo: "2025-05-31",
  },
  {
    id: "10",
    name: "African Music Awards",
    category: "Festival",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    image: "/images/backgroundImages/business/events4.jpg",
    location: "Virtual",
    slug: "african-music-awards",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: false,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Kenya",
    createdAt: "2024-10-29T00:00:00Z",
    availableFrom: "2025-02-01",
    availableTo: "2025-04-30",
  },
  {
    id: "11",
    name: "TGMA 2026",
    category: "Online Events",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do e...",
    image: "/images/backgroundImages/business/event.jpg",
    location: "Memphis",
    slug: "tgma-2026-online",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Ghana",
    createdAt: "2024-10-30T00:00:00Z",
    availableFrom: "2025-01-01",
    availableTo: "2025-03-31",
  },
  {
    id: "12",
    name: "TGMA 2026",
    category: "Online Events",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do e...",
    image: "/images/backgroundImages/business/events2.jpg",
    location: "Memphis",
    slug: "tgma-2026-online-2",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Ghana",
    createdAt: "2024-10-31T00:00:00Z",
    availableFrom: "2025-04-01",
    availableTo: "2025-06-30",
  },
  {
    id: "13",
    name: "TGMA 2026",
    category: "Online Events",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do e...",
    image: "/images/backgroundImages/business/events3.jpg",
    location: "Memphis",
    slug: "tgma-2026-online-3",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Ghana",
    createdAt: "2024-11-01T00:00:00Z",
    availableFrom: "2025-07-01",
    availableTo: "2025-09-30",
  },
  {
    id: "14",
    name: "TGMA 2026",
    category: "Comedy",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do e...",
    image: "/images/backgroundImages/business/events4.jpg",
    location: "Memphis",
    slug: "tgma-2026-comedy",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Ghana",
    createdAt: "2024-11-02T00:00:00Z",
    availableFrom: "2025-10-01",
    availableTo: "2025-12-31",
  },
  {
    id: "15",
    name: "TGMA 2026",
    category: "Comedy",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do e...",
    image: "/images/backgroundImages/business/event.jpg",
    location: "Memphis",
    slug: "tgma-2026-comedy-2",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Ghana",
    createdAt: "2024-11-03T00:00:00Z",
    availableFrom: "2025-02-01",
    availableTo: "2025-05-31",
  },
  {
    id: "16",
    name: "TGMA 2026",
    category: "Comedy",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do e...",
    image: "/images/backgroundImages/business/events2.jpg",
    location: "Memphis",
    slug: "tgma-2026-comedy-3",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Ghana",
    createdAt: "2024-11-04T00:00:00Z",
    availableFrom: "2025-06-01",
    availableTo: "2025-08-31",
  },
  {
    id: "17",
    name: "TGMA 2026",
    category: "Theatre",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do e...",
    image: "/images/backgroundImages/business/events3.jpg",
    location: "Memphis",
    slug: "tgma-2026-theatre",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Ghana",
    createdAt: "2024-11-05T00:00:00Z",
    availableFrom: "2025-03-01",
    availableTo: "2025-06-30",
  },
  {
    id: "18",
    name: "TGMA 2026",
    category: "Theatre",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do e...",
    image: "/images/backgroundImages/business/events4.jpg",
    location: "Memphis",
    slug: "tgma-2026-theatre-2",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Ghana",
    createdAt: "2024-11-06T00:00:00Z",
    availableFrom: "2025-08-01",
    availableTo: "2025-11-30",
  },
  {
    id: "19",
    name: "TGMA 2026",
    category: "Theatre",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do e...",
    image: "/images/backgroundImages/business/event.jpg",
    location: "Memphis",
    slug: "tgma-2026-theatre-3",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    time: "10:00 AM",
    country: "Ghana",
    createdAt: "2024-11-07T00:00:00Z",
    availableFrom: "2025-01-01",
    availableTo: "2025-04-30",
  },
];

// communities
export type Community = {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
};
export const communities: Community[] = [
  {
    id: "1",
    title: "Faith & Values",
    description:
      "Connect with local business owners, artists, freelancers, and professionals making an impact. Exchange ideas, promote your services, and find collaborators who share your drive.",
    image: "/images/faith.jpg",
    link: "faith-values",
  },
  {
    id: "2",
    title: "Creators & Entrepreneurs",
    description:
      "Connect with local business owners, artists, freelancers, and professionals making an impact. Exchange ideas, promote your services, and find collaborators who share your drive.",
    image: "/images/creators.jpg",
    link: "creators-entrepreneurs",
  },
];

// Community Categories for filtering
export type CommunityCategory = {
  label: string;
  value: string;
};

export const communityCategories: CommunityCategory[] = [
  { label: "All communities", value: "all" },
  { label: "Mental Health", value: "mental-health" },
  { label: "Charities", value: "charities" },
  { label: "Community Interest", value: "community-interest" },
  { label: "Support Group", value: "support-group" },
  { label: "Community Support", value: "community-support" },
  { label: "Local Groups", value: "local-groups" },
  { label: "Professional Groups", value: "professional-groups" },
  { label: "School Groups", value: "school-groups" },
  { label: "Sports Groups", value: "sports-groups" },
  { label: "Hometown Groups", value: "hometown-groups" },
];

// community card data
export type CommunityCard = {
  id: string; // Always good to have an id
  name: string; // From your boilerplate
  description: string;
  imageUrl: string; // Inferred from image
  tag: string; // Inferred from image ("Community Support")
  verified: boolean;
  type: "community";
  location: string;
};
export const communityCards: CommunityCard[] = [
  // Mental Health Communities
  {
    id: "1",
    name: "MindCare Ghana",
    description: "Providing accessible mental health care and safe spaces for individuals and families in Ghana",
    imageUrl: "/images/backgroundImages/community/mental-health.jpg",
    tag: "Mental Health",
    verified: true,
    type: "community",
    location: "Accra, Ghana",
  },
  {
    id: "2",
    name: "Mental Health Society of Ghana",
    description: "Promoting awareness, reducing stigma, and supporting people living with mental health conditions",
    imageUrl: "/images/backgroundImages/community/community-help.jpg",
    tag: "Mental Health",
    verified: true,
    type: "community",
    location: "Accra, Ghana",
  },
  {
    id: "3",
    name: "BasicNeeds Ghana",
    description: "Empowering people with mental illness and epilepsy to live healthier, productive lives through community-based support",
    imageUrl: "/images/backgroundImages/community/community-people.png",
    tag: "Mental Health",
    verified: true,
    type: "community",
    location: "Accra, Ghana"
  },
  {
    id: "4",
    name: "Healthy Minds Africa (HMA)",
    description: "Connecting Africans abroad with culturally sensitive mental health resources and peer support networks",
    imageUrl: "/images/backgroundImages/community/friendship.jpg",
    tag: "Mental Health",
    verified: true,
    type: "community",
    location: "Memphis, USA"
  },
  
  // Social Impact Communities
  {
    id: "5",
    name: "University of Ghana Alumni Network",
    description: "Connecting graduates worldwide to foster mentorship, career growth, and lifelong friendships across generations",
    imageUrl: "/images/backgroundImages/community/students.jpg",
    tag: "School Groups",
    verified: false,
    type: "community",
    location: "Accra, Ghana"
  },
  {
    id: "6",
    name: "Ghana Tech Professionals Association",
    description: "A network for IT specialists, innovators, and entrepreneurs driving digital growth across Ghana and beyond",
    imageUrl: "/images/backgroundImages/community/tech-community.jpg",
    tag: "Professional Groups",
    verified: true,
    type: "community",
    location: "Accra, Ghana"
  },
  {
    id: "7",
    name: "Youth for Good Governance",
    description: "Empowering young voices to engage in civic leadership, advocacy, and transparent governance initiatives",
    imageUrl: "/images/backgroundImages/community/community1.jpg",
    tag: "Community Interest",
    verified: true,
    type: "community",
    location: "Accra, Ghana"
  },
  {
    id: "8",
    name: "Ghana Cultural Exchange Circle",
    description: "Bringing together people passionate about Ghanaian culture through food, music, storytelling, and traditions",
    imageUrl: "/images/backgroundImages/community/togetherness.jpg",
    tag: "Community Interest",
    verified: true,
    type: "community",
    location: "Accra, Ghana"
  },
  
  // Additional Communities
  {
    id: "9",
    name: "Accra Runners Club",
    description: "A community of fitness enthusiasts promoting healthy lifestyles through regular running events and marathons",
    imageUrl: "/images/backgroundImages/community/community2.jpg",
    tag: "Sports Groups",
    verified: false,
    type: "community",
    location: "Accra, Ghana"
  },
  {
    id: "10",
    name: "Kumasi Hometown Heroes",
    description: "Connecting Kumasi natives and residents to celebrate local heritage and drive community development projects",
    imageUrl: "/images/backgroundImages/community/community-3.jpg",
    tag: "Hometown Groups",
    verified: true,
    type: "community",
    location: "Kumasi, Ghana"
  },
  {
    id: "11",
    name: "Ghana Education Support Network",
    description: "Supporting underprivileged students with scholarships, mentorship, and educational resources across Ghana",
    imageUrl: "/images/backgroundImages/community/community-4.jpg",
    tag: "Charities",
    verified: true,
    type: "community",
    location: "Accra, Ghana"
  },
  {
    id: "12",
    name: "Community Builders Ghana",
    description: "Volunteers working together on local infrastructure, sanitation, and neighborhood improvement initiatives",
    imageUrl: "/images/backgroundImages/community/community-love.jpg",
    tag: "Community Support",
    verified: false,
    type: "community",
    location: "Accra, Ghana"
  },
];


// faqs
export type Faq = {
  id: string;
  question: string;
  answer: string;
};
export const faqs: Faq[] = [
  {
    id: "1",
    question: "What is Mefie Directory?",
    answer: "Mefie Directory is a platform that connects local businesses, artists, freelancers, and professionals making an impact. Exchange ideas, promote your services, and find collaborators who share your drive.",
  },
  {
    id: "2",
    question: "How do I join Mefie Directory?",
    answer: "To join Mefie, simply create an account and start exploring the platform. You can connect with local businesses, artists, freelancers, and professionals making an impact. Exchange ideas, promote your services, and find collaborators who share your drive.",
  },
  {
    id: "3",
    question: "How do I list my business?",
    answer: "To list your business on Mefie Directory, simply create an account and start exploring the platform. You can connect with local businesses, artists, freelancers, and professionals making an impact. Exchange ideas, promote your services, and find collaborators who share your drive.",
  },
  {
    id: "4",
    question: "Is there a fee to join?",
    answer: "No, there is no fee to join Mefie Directory.",
  },
  {
    id: "5",
    question: "What additional features do i get with the premium plan?",
    answer: "With the premium plan, you get access to additional features such as a dedicated account manager, priority support, and exclusive discounts.",
  },
  {
    id: "6",
    question: "How do customers find my business?",
    answer: "Customers find your business through search, social media, and referrals.",
  }
];


// About page news
export type NewsItem = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  categoryColor?: string;
  author: {
    name: string;
    avatar: string;
  };
  readTime: string;
  content: string;
};

export const newsList: NewsItem[] = [
  {
    id: "luxury-grocer-toothpaste",
    title: "Luxury Grocer Launches $11 Toothpaste",
    date: "April 5, 2025",
    excerpt:
      "High-end wellness-oriented grocer Enewhan has released a toothpaste-inspired smoothie in collaboration with oral-care.",
    image: "/images/about/news-1.jpg",
    category: "Food",
    categoryColor: "bg-green-100 text-green-700",
    author: {
      name: "Sarah Johnson",
      avatar: "/images/about/testimonial.png",
    },
    readTime: "4 min read",
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce velit ex facilisis metus pellentesque oreet suscipit. Nibh mattis vitae odio, turpis eu neque. Vitae massa tempus, ornare sit amet nisi eget nisi, sed dui. Donec purus velit at oreet imperdiet. Hendrerit mollis ullamcorper quis commodo vitae.

1. AI-Driven Financial Tools
Discover how these unique algorithms help optimize your investment portfolio based on real-time market data and trends. These tools are designed to minimize risk and maximize returns through intelligent decision-making.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce velit ex facilisis metus pellentesque oreet suscipit. Nibh mattis vitae odio, turpis eu neque. Vitae massa tempus, ornare sit amet nisi eget nisi, sed dui. Donec purus velit at oreet imperdiet. Hendrerit mollis ullamcorper quis commodo vitae.

2. Automated Investment Strategies
Explore strategies where algorithms help optimize your investment portfolio based on real-time market data and trends. These strategies are designed to minimize risk and maximize returns through intelligent decision-making.

3. Personalized Budgeting Solutions
Learn how fintech apps provide personalized budgeting recommendations. These solutions aim to enhance financial literacy and empower users to achieve their financial goals through actionable insights and coaching.

![/images/about/grid-2.jpg]

4. Automated Savings Plans
Investment systems that automatically transfer funds into savings accounts based on user-defined goals. This feature promotes consistent saving habits and helps users quickly build an emergency fund or save for specific purchases without needing to think about it.

5. Investment Tracking Tools
- Track and monitor development
- Manage your investment account with comments
- Analyze portfolio performance

Offer platforms that allow users to monitor their investment portfolios in real time. These tools provide predictive performance, diversification, and risk assessment, helping users make informed decisions about their investment strategies.`,
  },
  {
    id: "fancy-gadam-projects",
    title: "Fancy Gadam Announces Two Major Projects",
    date: "September 17, 2025",
    excerpt:
      "Ghanaian artiste Fancy Gadam has revealed plans for two new music projects in 2026.",
    image: "/images/about/news-2.jpg",
    category: "Entertainment",
    categoryColor: "bg-blue-100 text-blue-700",
    author: {
      name: "Michael Owusu",
      avatar: "/images/about/testimonial.png",
    },
    readTime: "3 min read",
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce velit ex facilisis metus pellentesque oreet suscipit. Nibh mattis vitae odio, turpis eu neque. Vitae massa tempus, ornare sit amet nisi eget nisi, sed dui.

The announcement comes as Fancy Gadam continues to dominate the Ghanaian music scene with his unique blend of traditional and modern sounds. His upcoming projects promise to showcase his versatility and commitment to pushing creative boundaries.

1. Album Release Plans
The first project is a full-length album featuring collaborations with both local and international artists. This album aims to celebrate Ghanaian culture while incorporating global musical influences.

2. Documentary Series
The second project is a documentary series that will give fans an intimate look into his creative process, life journey, and the stories behind his most popular songs.

Both projects are expected to launch in the first quarter of 2026, with pre-release singles dropping throughout late 2025.`,
  },
  {
    id: "community-spaces",
    title: "Elevating Our Progress With New Community Spaces",
    date: "October 25, 2024",
    excerpt:
      "The development team has unveiled the next phase of our community expansion, focusing on accessibility and comfort.",
    image: "/images/about/grid-1.jpg",
    category: "Community",
    categoryColor: "bg-purple-100 text-purple-700",
    author: {
      name: "Kwame Mensah",
      avatar: "/images/about/testimonial.png",
    },
    readTime: "5 min read",
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce velit ex facilisis metus pellentesque oreet suscipit. Nibh mattis vitae odio, turpis eu neque.

Our commitment to building inclusive community spaces continues with this exciting new development. These spaces are designed to bring people together and foster meaningful connections.

1. Accessible Design
All new spaces feature wheelchair accessibility, sensory-friendly environments, and multilingual signage to ensure everyone feels welcome.

2. Modern Amenities
From high-speed internet to comfortable seating areas, these spaces are equipped with everything needed for both work and relaxation.

3. Community Programming
Regular events, workshops, and cultural celebrations will be hosted in these new spaces to strengthen community bonds.`,
  },
];

// Testimonials
export type Testimonial = {
  id: string;
  name: string;
  image: string;
  message: string;
  review: string;
  stars: number;
  role?: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Alexander Brown",
    image: "/images/about/testimonial.png",
    message: "Thank you for giving me the best offers for...",
    review:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor minim aliqua. Excepturi sit occaecat culpa adipisci deserunt.",
    stars: 5,
    role: "Business Owner",
  },
  {
    id: "2",
    name: "Sophia Martinez",
    image: "/images/about/testimonial.png",
    message: "Amazing platform for discovering local businesses",
    review:
      "Mefie Directory has completely transformed how I find and connect with African businesses. The platform is intuitive and the listings are comprehensive.",
    stars: 5,
    role: "Community Member",
  },
  {
    id: "3",
    name: "Kwame Asante",
    image: "/images/about/testimonial.png",
    message: "Best directory for Ghanaian culture and events",
    review:
      "As someone in the diaspora, Mefie helps me stay connected to my roots. I've discovered amazing events and businesses through this platform.",
    stars: 5,
    role: "Diaspora Member",
  },
  {
    id: "4",
    name: "Amina Hassan",
    image: "/images/about/testimonial.png",
    message: "Excellent resource for event planning",
    review:
      "Planning cultural events has never been easier. Mefie Directory provides all the resources and connections I need in one place.",
    stars: 5,
    role: "Event Planner",
  },
  {
    id: "5",
    name: "David Osei",
    image: "/images/about/testimonial.png",
    message: "Great for promoting my business",
    review:
      "Since listing my business on Mefie, I've seen a significant increase in customer engagement. The platform truly supports African entrepreneurs.",
    stars: 5,
    role: "Restaurant Owner",
  },
  {
    id: "6",
    name: "Grace Mensah",
    image: "/images/about/testimonial.png",
    message: "Love the community focus",
    review:
      "Mefie isn't just a directory, it's a community. I've made meaningful connections and discovered opportunities I wouldn't have found elsewhere.",
    stars: 5,
    role: "Fashion Designer",
  },
];

// ============================================================================
// Mock data for Categories single-page layout preview
// ============================================================================

// export type PopularStylist = {
//   id: string;
//   name: string;
//   role: string;
//   location: string;
//   rating: number;
//   reviews: string;
//   avatar: string;
//   slug: string;
// };

// export const popularStylists: PopularStylist[] = [
//   {
//     id: "ps-1",
//     name: "Kente Tailor",
//     role: "Bespoke Mens Wedding Attire",
//     location: "South London, UK",
//     rating: 4.8,
//     reviews: "2.2k",
//     avatar: "/images/clothing/clothing1.jpg",
//     slug: "kente-tailor-bespoke-mens-wedding-attire",
//   },
//   {
//     id: "ps-2",
//     name: "Ankara Fashion",
//     role: "Bespoke Attire",
//     location: "West London, UK",
//     rating: 4.6,
//     reviews: "1.8k",
//     avatar: "/images/clothing/clothing2.jpg",
//     slug: "ankara-fashion-house",
//   },
//   {
//     id: "ps-3",
//     name: "Heritage Boutique",
//     role: "Wedding Attire",
//     location: "Central London, UK",
//     rating: 4.7,
//     reviews: "1.5k",
//     avatar: "/images/clothing/clothing3.jpg",
//     slug: "heritage-clothing-boutique",
//   },
//   {
//     id: "ps-4",
//     name: "Afrocentric Styles",
//     role: "Mens Wedding Attire",
//     location: "North London, UK",
//     rating: 4.5,
//     reviews: "1.3k",
//     avatar: "/images/clothing/clothing4.jpg",
//     slug: "afrocentric-styles",
//   },
//   {
//     id: "ps-5",
//     name: "Beaded Heritage",
//     role: "Accessories",
//     location: "South London, UK",
//     rating: 4.9,
//     reviews: "2.5k",
//     avatar: "/images/jewellery/jewellery1.jpg",
//     slug: "beaded-heritage-necklaces-bracelets",
//   },
// ];

// export type CultureServiceCard = {
//   id: string;
//   title: string;
//   tag: string;
//   image: string;
//   location: string;
//   rating: number;
//   reviews: string;
//   slug: string;
// };

// export const cultureServices: CultureServiceCard[] = [
//   {
//     id: "cs-1",
//     title: "Adowa Heritage Troupe",
//     tag: "Concert",
//     image: "/images/backgroundImages/business/events3.jpg",
//     location: "Memphis",
//     rating: 4.7,
//     reviews: "2.2k",
//     slug: "adowa-heritage-troupe",
//   },
//   {
//     id: "cs-2",
//     title: "Kente Elegance Stylists",
//     tag: "Concert",
//     image: "/images/backgroundImages/categories/fashion.jpg",
//     location: "Memphis",
//     rating: 4.6,
//     reviews: "2.3k",
//     slug: "kente-elegance-stylists",
//   },
//   {
//     id: "cs-3",
//     title: "Rhythms of Africa Ensemble",
//     tag: "Concert",
//     image: "/images/backgroundImages/business/events2.jpg",
//     location: "Memphis",
//     rating: 4.8,
//     reviews: "2.1k",
//     slug: "rhythms-of-africa-ensemble",
//   },
//   {
//     id: "cs-4",
//     title: "Forever Yours Events",
//     tag: "Concert",
//     image: "/images/backgroundImages/business/event.jpg",
//     location: "Memphis",
//     rating: 4.6,
//     reviews: "2.2k",
//     slug: "forever-yours-events",
//   },
//   {
//     id: "cs-5",
//     title: "Kente Elegance Stylists",
//     tag: "Concert",
//     image: "/images/backgroundImages/business/events4.jpg",
//     location: "Memphis",
//     rating: 4.5,
//     reviews: "2.0k",
//     slug: "kente-elegance-stylists-2",
//   },
//   {
//     id: "cs-6",
//     title: "Adowa Heritage Troupe",
//     tag: "Concert",
//     image: "/images/backgroundImages/business/events3.jpg",
//     location: "Memphis",
//     rating: 4.7,
//     reviews: "2.1k",
//     slug: "adowa-heritage-troupe-2",
//   },
//   {
//     id: "cs-7",
//     title: "Forever Yours Events",
//     tag: "Concert",
//     image: "/images/backgroundImages/business/event.jpg",
//     location: "Memphis",
//     rating: 4.6,
//     reviews: "2.2k",
//     slug: "forever-yours-events-2",
//   },
//   {
//     id: "cs-8",
//     title: "Rhythms of Africa Ensemble",
//     tag: "Concert",
//     image: "/images/backgroundImages/business/events2.jpg",
//     location: "Memphis",
//     rating: 4.8,
//     reviews: "2.1k",
//     slug: "rhythms-of-africa-ensemble-2",
//   },
// ];

export type DealCard = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  location: string;
  rating: number;
  reviews: string;
  slug: string;
  category: string;
  subcategory?: string;
  badge?: string;
  verified?: boolean;
  country?: string;
  availableFrom?: string;
  availableTo?: string;
};

export const bestDeals: DealCard[] = [
  {
    id: "dl-1",
    title: "Kente Tailor — Bespoke Mens Wedding Attire",
    subtitle: "Wedding Attire",
    image: "/images/clothing/clothing1.jpg",
    location: "South London, United Kingdom",
    rating: 4.8,
    reviews: "2.2k",
    slug: "kente-tailor-bespoke-mens-wedding-attire",
    category: "cultural-services",
    subcategory: "cultural-attire-stylist",
    badge: "-25%",
    country: "United Kingdom",
    availableFrom: "2025-01-01",
    availableTo: "2025-03-31",
  },
  {
    id: "dl-2",
    title: "Beaded Heritage Necklace & Bracelets",
    subtitle: "Accessories",
    image: "/images/jewellery/jewellery2.jpg",
    location: "South London, United Kingdom",
    rating: 4.7,
    reviews: "2.3k",
    slug: "beaded-heritage-necklaces-bracelets",
    category: "fashion-lifestyle",
    subcategory: "jewellery",
    badge: "-30%",
    country: "Nigeria",
    availableFrom: "2025-04-01",
    availableTo: "2025-06-30",
  },
  {
    id: "dl-3",
    title: "Afrocentric Styles",
    subtitle: "Clothing",
    image: "/images/clothing/clothing4.jpg",
    location: "West London, United Kingdom",
    rating: 4.6,
    reviews: "1.8k",
    slug: "afrocentric-styles",
    category: "fashion-lifestyle",
    subcategory: "clothing",
    badge: "Free Delivery within USA",
    country: "United States",
    availableFrom: "2025-07-01",
    availableTo: "2025-09-30",
  },
  {
    id: "dl-4",
    title: "Heritage Clothing Boutique",
    subtitle: "Clothing",
    image: "/images/clothing/clothing3.jpg",
    location: "South London, United Kingdom",
    rating: 4.7,
    reviews: "1.5k",
    slug: "heritage-clothing-boutique",
    category: "fashion-lifestyle",
    subcategory: "clothing",
    country: "Canada",
    availableFrom: "2025-10-01",
    availableTo: "2025-12-31",
  },
  {
    id: "dl-5",
    title: "Golden Adornments",
    subtitle: "Jewellery",
    image: "/images/jewellery/jewellery2.jpg",
    location: "Central London, United Kingdom",
    rating: 4.8,
    reviews: "2.1k",
    slug: "golden-adornments",
    category: "fashion-lifestyle",
    subcategory: "jewellery",
    country: "South Africa",
    availableFrom: "2025-02-01",
    availableTo: "2025-05-31",
  },
];

// Category Service Providers
export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
};

export interface ServiceProvider {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  subcategory?: string;
  image: string;
  rating: number;
  reviews: string;
  verified: boolean;
  location?: string;
  slug: string;
  country?: string;
  availableFrom?: string;
  availableTo?: string;
  // Newly added optional fields for listing detail page
  description: string;
  phone: string;
  email: string;
  website: string;
  socials?: SocialLinks;
}

export const categorySubcategories: Record<
  string,
  { label: string; value: string }[]
> = {
  "cultural-services": [
    { label: "All Cultural Services", value: "all" },
    { label: "Dancers", value: "dancers" },
    { label: "Cultural Attire Stylists", value: "cultural-attire-stylist" },
    {
      label: "Drummers & Performers",
      value: "drummers-cultural-performers",
    },
  ],
  "fashion-lifestyle": [
    { label: "All Fashion & Lifestyle", value: "all" },
    { label: "Clothing", value: "clothing" },
    { label: "Jewellery", value: "jewellery" },
    { label: "Art & Crafts", value: "art-crafts" },
  ],
  "food-hospitality": [
    { label: "All Food & Hospitality", value: "all" },
    { label: "Caterers", value: "caterer" },
    { label: "Restaurants", value: "restaurant" },
    { label: "Street Food", value: "street-food" },
  ],
};

export const categoryPageContentByMain: Record<
  string,
  {
    default: CategoryPageContent;
    subcategories?: Record<string, Partial<CategoryPageContent>>;
  }
> = {
  events: {
    default: {
      heroTitle: "Discover culture-rich events near and far",
      heroDescription:
        "Track festivals, pop-ups, and curated gatherings celebrating African culture worldwide.",
      cultureTitle: "Events with a heartbeat",
      cultureDescription:
        "From intimate workshops to city-wide celebrations, find experiences crafted for community.",
      dealsTitle: "Featured events and ticket offers",
      dealsDescription:
        "Grab early-bird specials and curated event bundles before they sell out.",
    },
    subcategories: {
      all: {
        heroTitle: "All upcoming cultural events",
        heroDescription:
          "Browse every celebration, performance, and meetup in one feed.",
      },
    },
  },
  "cultural-services": {
    default: {
      heroTitle: "Cultural services crafted for every celebration",
      heroDescription:
        "Discover performers, stylists, and heritage experts ready to bring authentic culture to your event.",
      cultureTitle: "Culture in every detail",
      cultureDescription:
        "Explore curated cultural talents—dancers, stylists, and storytellers preserving tradition.",
      dealsTitle: "Today's best cultural offers",
      dealsDescription: "Limited-time cultural experiences tailor-made for you.",
    },
    subcategories: {
      all: {
        heroTitle: "All cultural services near you",
        heroDescription:
          "Browse the full spectrum of cultural experts—from ceremonial styling to live performances.",
      },
      dancers: {
        heroTitle: "Book energetic cultural dancers",
        heroDescription:
          "Find professional dance troupes to elevate festivals, weddings, and community moments.",
        cultureTitle: "Dance-led celebrations",
        cultureDescription:
          "Celebrate heritage through choreographed performances and storytelling in motion.",
        dealsTitle: "Dance acts with special offers",
        dealsDescription:
          "Reserve vibrant troupes with packages crafted for every occasion.",
      },
      "cultural-attire-stylist": {
        heroTitle: "Connect with cultural attire stylists",
        heroDescription:
          "Partner with stylists who tailor authentic garments for weddings, festivals, and ceremonies.",
        cultureTitle: "Style that honours tradition",
        cultureDescription:
          "Curated attire, accessories, and fittings inspired by Africa's vibrant cultures.",
      },
      "drummers-cultural-performers": {
        heroTitle: "Hire drummers & cultural performers",
        heroDescription:
          "Create an unforgettable atmosphere with master drummers, poets, and storytellers.",
        dealsTitle: "Performance bundles available",
        dealsDescription:
          "Secure drumming ensembles with flexible packages and early-booking perks.",
      },
    },
  },
  "education-learning": {
    default: {
      heroTitle: "Learning rooted in African perspectives",
      heroDescription:
        "Connect with tutors, schools, and programs championing culturally aware education.",
      cultureTitle: "Knowledge with heritage",
      cultureDescription:
        "Discover language schools, history programs, and skill workshops led by experts.",
      dealsTitle: "Featured learning opportunities",
      dealsDescription:
        "Explore scholarships, discounted classes, and limited-time enrolment perks.",
    },
    subcategories: {
      all: {
        heroTitle: "All education & learning partners",
        heroDescription:
          "Browse institutions, mentors, and programs tailored for every learner.",
      },
    },
  },
  "fashion-lifestyle": {
    default: {
      heroTitle: "Fashion & lifestyle brands redefining heritage",
      heroDescription:
        "Shop designers and artisans blending contemporary style with African inspiration.",
      cultureTitle: "Style in every stitch",
      cultureDescription:
        "Discover clothing, jewellery, and lifestyle pieces that tell cultural stories.",
      dealsTitle: "Fresh looks, exclusive deals",
      dealsDescription: "Grab limited-time discounts from standout designers.",
    },
    subcategories: {
      all: {
        heroTitle: "All fashion & lifestyle picks",
        heroDescription:
          "From ready-to-wear to artisan crafts, explore every lifestyle listing in one view.",
      },
      clothing: {
        heroTitle: "Signature clothing collections",
        heroDescription:
          "Browse bold prints, bespoke tailoring, and relaxed fits from diaspora designers.",
        cultureTitle: "Wear heritage proudly",
        cultureDescription:
          "Tailored pieces crafted with symbolism, craftsmanship, and pride.",
      },
      jewellery: {
        heroTitle: "Handcrafted jewellery & adornments",
        heroDescription:
          "Layers of beads, metals, and gems inspired by ancestral craftsmanship.",
        dealsTitle: "Jewellery offers you’ll love",
        dealsDescription:
          "Shop curated jewellery drops with seasonal price cuts.",
      },
      "art-crafts": {
        heroTitle: "Art & crafts for inspired living",
        heroDescription:
          "Decor, sculpture, and collectibles bringing African artistry into your space.",
        cultureTitle: "Decor with a story",
        cultureDescription:
          "Celebrate artisans preserving tradition through contemporary pieces.",
      },
    },
  },
  "financial-services": {
    default: {
      heroTitle: "Financial partners empowering the diaspora",
      heroDescription:
        "Work with advisors, lenders, and fintech brands designed for cross-border living.",
      cultureTitle: "Money matters, culturally tuned",
      cultureDescription:
        "From remittances to business funding, discover services built on trust and transparency.",
      dealsTitle: "Current financial offers",
      dealsDescription:
        "See promotions on remittance rates, business packages, and advisory sessions.",
    },
    subcategories: {
      all: {
        heroTitle: "Every financial service listed",
        heroDescription:
          "Compare providers helping diaspora communities plan, invest, and grow.",
      },
    },
  },
  "food-hospitality": {
    default: {
      heroTitle: "Food & hospitality with authentic flavours",
      heroDescription:
        "Discover chefs, caterers, and culinary hosts ready to bring Africa to your table.",
      cultureTitle: "Taste the diaspora",
      cultureDescription:
        "Celebrate regional dishes, pop-up kitchens, and gourmet experiences around the world.",
      dealsTitle: "Today's best food deals",
      dealsDescription: "Seasonal offers on catering, tastings, and pop-up bookings.",
    },
    subcategories: {
      all: {
        heroTitle: "Every food & hospitality listing",
        heroDescription:
          "Explore caterers, restaurants, and culinary creatives in one feed.",
      },
      caterer: {
        heroTitle: "Caterers for unforgettable gatherings",
        heroDescription:
          "Book full-service catering with menus rooted in African cuisine.",
        dealsDescription:
          "Tap seasonal tasting menus and group booking discounts.",
      },
      restaurant: {
        heroTitle: "Restaurants serving soulful experiences",
        heroDescription:
          "Find dine-in and delivery spots offering authentic plates from across Africa.",
        cultureTitle: "A seat at the table",
        cultureDescription:
          "Family-owned restaurants and modern eateries preserving culinary heritage.",
      },
      "street-food": {
        heroTitle: "Street food & pop-up sensations",
        heroDescription:
          "Discover grills, food trucks, and festival vendors packed with flavour.",
        dealsTitle: "Street bites, special prices",
        dealsDescription:
          "Limited-time combos and pop-up promotions near you.",
      },
    },
  },
  "property-relocation": {
    default: {
      heroTitle: "Property & relocation made simple",
      heroDescription:
        "Find realtors, relocation experts, and housing services bridging continents.",
      cultureTitle: "Move anywhere with confidence",
      cultureDescription:
        "Support for home searches, relocations, and settlement tailored for diaspora journeys.",
      dealsTitle: "Relocation deals & services",
      dealsDescription:
        "Access moving packages, discounted consultations, and new-home promotions.",
    },
    subcategories: {
      all: {
        heroTitle: "All property & relocation services",
        heroDescription:
          "Browse specialists assisting with relocation, rentals, and property management.",
      },
    },
  },
  "shipping-logistics": {
    default: {
      heroTitle: "Shipping & logistics you can trust",
      heroDescription:
        "Partner with freight forwarders and delivery services connecting Africa and the diaspora.",
      cultureTitle: "Moving goods, sustaining ties",
      cultureDescription:
        "From personal cargo to commercial shipments, explore reliable logistics partners.",
      dealsTitle: "Logistics offers and bundles",
      dealsDescription:
        "Secure discounted shipping lanes, group rates, and seasonal promotions.",
    },
    subcategories: {
      all: {
        heroTitle: "All shipping & logistics providers",
        heroDescription:
          "Compare delivery specialists and freight partners ready to move what matters.",
      },
    },
  },
};

export type CategoryDetailMedia =
  | string
  | {
      type: "image" | "video";
      src: string;
      poster?: string;
      label?: string;
    };

export type CategoryDetailContent = {
  gallery: CategoryDetailMedia[];
  services: string[];
  pricing: { label: string; price: string }[];
  experience: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  reviews: {
    author: string;
    rating: number;
    date: string;
    comment: string;
  }[];
  mapImage?: string;
  bookingNote?: string;
};

const defaultDetailContent: CategoryDetailContent = {
  gallery: [
    "/images/backgroundImages/categories/event.jpg",
    "/images/backgroundImages/categories/food.jpg",
    "/images/backgroundImages/categories/fashion.jpg",
  ],
  services: [
    "Tailored consultation for your event or booking",
    "Flexible scheduling to suit your availability",
    "Trusted professionals with verified experience",
  ],
  pricing: [
    { label: "Standard engagement", price: "Contact for pricing" },
    { label: "Custom package", price: "Built around your needs" },
  ],
  experience: [
    {
      title: "Built on community trust",
      description:
        "Every listing is reviewed by our community to keep quality high and experiences authentic.",
    },
    {
      title: "Flexible partnership options",
      description:
        "Book by the hour, per project, or retain on a longer schedule depending on your goals.",
    },
  ],
  faqs: [
    {
      question: "How do I confirm availability?",
      answer:
        "Send a booking request with your preferred dates and the team will confirm within 24 hours.",
    },
    {
      question: "Can I customise the offering?",
      answer:
        "Yes. Most providers tailor their services to your brief—share as many details as possible when enquiring.",
    },
  ],
  reviews: [
    {
      author: "Community Member",
      rating: 5,
      date: "February 2025",
      comment:
        "Responsive, professional, and a delight to collaborate with. We’re already planning our next booking.",
    },
  ],
  mapImage: "/assets/map-thumb.png",
  bookingNote: "Share event dates, audience size, and any special requests when booking.",
};

export const defaultCategoryDetailContent = defaultDetailContent;

export const categoryDetailContent: Record<string, CategoryDetailContent> = {
  "cultural-services": {
    gallery: [
      {
        type: "video",
        src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        poster: "/images/clothing/clothing1.jpg",
        label: "Showreel",
      },
      "/images/clothing/clothing2.jpg",
      "/images/art/art1.jpg",
      "/images/art/art2.jpg",
      "/images/backgroundImages/categories/culture.jpg",
    ],
    services: [
      "Traditional performances tailored for weddings and festivals",
      "Interactive cultural workshops and storytelling",
      "Custom choreography and ceremonial planning",
      "Costume sourcing, styling, and fittings",
    ],
    pricing: [
      { label: "Per hour", price: "£175" },
      { label: "Wedding package", price: "From £1,200" },
      { label: "Workshop or masterclass", price: "From £450" },
    ],
    experience: [
      {
        title: "Performing across the diaspora",
        description:
          "Teams regularly tour Europe and North America, showcasing Ghanaian, Nigerian, and pan-African traditions.",
      },
      {
        title: "Collaborations with major festivals",
        description:
          "Featured at Notting Hill Carnival, AfroNation pop-ups, and cultural weeks hosted by embassies.",
      },
    ],
    faqs: [
      {
        question: "How many performers are included?",
        answer:
          "A standard booking includes 4–6 performers. Larger ensembles can be arranged with at least three weeks’ notice.",
      },
      {
        question: "Do you travel outside the UK?",
        answer:
          "Yes. Travel and accommodation are quoted separately and added to the final invoice.",
      },
      {
        question: "Can performances be adapted for schools?",
        answer:
          "Absolutely. We offer age-appropriate cultural education sessions alongside the performance.",
      },
    ],
    reviews: [
      {
        author: "Adjoa Mensah",
        rating: 5,
        date: "April 2025",
        comment:
          "The ensemble electrified our wedding reception—professional, punctual, and full of joy.",
      },
      {
        author: "Richmond D.",
        rating: 4.8,
        date: "March 2025",
        comment:
          "They customised choreography for our corporate heritage day and it was a huge success.",
      },
    ],
    mapImage: "/assets/map-thumb.png",
    bookingNote:
      "Provide venue details, stage dimensions, and audience size to tailor the performance.",
  },
  "fashion-lifestyle": {
    gallery: [
      "/images/lf/lf1.jpg",
      "/images/lf/lf2.jpg",
      "/images/lf/lf3.jpg",
      "/images/lf/lf4.jpg",
      "/images/lf/lf5.jpg",
    ],
    services: [
      "Bespoke tailoring with fittings in-person or virtual",
      "Ready-to-wear collections with global shipping",
      "Styling for weddings, red carpet, and media shoots",
      "Custom textile sourcing and design consultation",
    ],
    pricing: [
      { label: "Made-to-measure outfits", price: "From £220" },
      { label: "Bridal or ceremonial package", price: "From £1,350" },
      { label: "Wardrobe styling session", price: "£95 / hour" },
    ],
    experience: [
      {
        title: "Featured in diaspora fashion weeks",
        description:
          "Collections have walked the runways in London, Accra, and New York African Fashion Weeks.",
      },
      {
        title: "Ethical production partners",
        description:
          "Working with artisan cooperatives across West Africa to ensure fair trade and high craftsmanship.",
      },
    ],
    faqs: [
      {
        question: "Do you offer international shipping?",
        answer:
          "Yes, with tracked delivery options. Duties and taxes depend on your destination.",
      },
      {
        question: "How long do custom orders take?",
        answer:
          "Turnaround ranges from 3–6 weeks depending on complexity and fabric sourcing.",
      },
      {
        question: "Can you design matching outfits for groups?",
        answer:
          "Absolutely. Share your concept mood board and the team will sketch options for approval.",
      },
    ],
    reviews: [
      {
        author: "Nana P.",
        rating: 5,
        date: "February 2025",
        comment:
          "My kente-inspired suit was flawless. Measurements taken virtually and delivered ahead of schedule.",
      },
      {
        author: "Lisa O.",
        rating: 4.9,
        date: "January 2025",
        comment:
          "Loved the jewellery curation—they helped me style pieces for my engagement shoot.",
      },
    ],
    mapImage: "/assets/map-thumb.png",
    bookingNote:
      "Include your event date and preferred colour palette to receive fabric suggestions.",
  },
  "food-hospitality": {
    gallery: [
      "/images/food/food1.jpg",
      "/images/food/food2.jpg",
      "/images/food/food3.jpg",
      "/images/backgroundImages/categories/food.jpg",
      "/images/food/food4.jpg",
    ],
    services: [
      "Full-service catering for weddings, galas, and private dining",
      "Pop-up dining experiences and chef’s table menus",
      "Meal prep and delivery within Greater London",
      "Corporate lunch drops with vegan and halal options",
    ],
    pricing: [
      { label: "Private chef experience", price: "From £85 / guest" },
      { label: "Buffet catering (50 guests)", price: "From £1,850" },
      { label: "Street food stall hire", price: "From £650" },
    ],
    experience: [
      {
        title: "Award-winning kitchen teams",
        description:
          "Chefs have been featured on diaspora food networks and host regular sold-out supper clubs.",
      },
      {
        title: "Sustainable sourcing",
        description:
          "Produce is sourced from Black-owned farms and fair-trade suppliers whenever possible.",
      },
    ],
    faqs: [
      {
        question: "Do you cater to dietary restrictions?",
        answer:
          "Yes. Vegan, vegetarian, gluten-free, and halal menus can be prepared with advance notice.",
      },
      {
        question: "Can you provide serving staff?",
        answer:
          "Professional serving teams, mixologists, and event managers can be added to any booking.",
      },
      {
        question: "Is tasting available?",
        answer:
          "Menu tastings are available for large events and are redeemable against the final invoice.",
      },
    ],
    reviews: [
      {
        author: "Kwame D.",
        rating: 5,
        date: "May 2025",
        comment:
          "The jollof trio and suya skewers were the talk of our anniversary celebration.",
      },
      {
        author: "Frances M.",
        rating: 4.7,
        date: "March 2025",
        comment:
          "Exceptional service and they handled our dietary requirements flawlessly.",
      },
    ],
    mapImage: "/assets/map-thumb.png",
    bookingNote:
      "Share your guest count, venue facilities, and menu preferences to receive a tailored quote.",
  },
};

export const categoryServiceProviders: Record<string, ServiceProvider[]> = {
  "cultural-services": [
    {
      id: "cs-1",
      name: "Kente Tailor — Bespoke Mens Wedding Attire",
      subtitle: "Traditional Wedding Attire",
      category: "cultural-services",
      subcategory: "cultural-attire-stylist",
      image: "/images/clothing/clothing1.jpg",
      rating: 4.8,
      reviews: "2.2k",
      verified: true,
      location: "South London, United Kingdom",
      slug: "kente-tailor-bespoke-mens-wedding-attire",
      country: "United Kingdom",
      availableFrom: "2025-05-01",
      availableTo: "2025-05-31",
      description: "Expert bespoke tailoring for traditional African wedding attire and formal wear.",
      phone: "+44 20 7123 4567",
      email: "hello@kentetailor.co.uk",
      website: "https://kentetailor.co.uk",
      socials: {
        instagram: "https://instagram.com/kentetailor",
        facebook: "https://facebook.com/kentetailor",
        twitter: "https://x.com/kentetailor",
      },
    },
    {
      id: "cs-2",
      name: "Kente Tailor — Bespoke Mens Wedding Attire",
      subtitle: "Traditional Wedding Attire",
      category: "cultural-services",
      subcategory: "cultural-attire-stylist",
      image: "/images/clothing/clothing2.jpg",
      rating: 4.7,
      reviews: "1.8k",
      verified: true,
      location: "West London, United Kingdom",
      slug: "kente-tailor-bespoke-mens-wedding-attire-2",
      country: "United Kingdom",
      description: "Expert bespoke tailoring for traditional African wedding attire and formal wear.",
      availableFrom: "2025-06-05",
      availableTo: "2025-06-28",
      phone: "+44 20 7123 4567",
      email: "hello@kentetailor.co.uk",
      website: "https://kentetailor.co.uk",
      socials: {
        instagram: "https://instagram.com/kentetailor",
        facebook: "https://facebook.com/kentetailor",
        twitter: "https://x.com/kentetailor",
      },
    },
    {
      id: "cs-3",
      name: "Kente Tailor — Bespoke Mens Wedding Attire",
      subtitle: "Traditional Wedding Attire",
      category: "cultural-services",
      subcategory: "dancers",
      image: "/images/clothing/clothing3.jpg",
      rating: 4.6,
      reviews: "1.5k",
      verified: false,
      location: "Central London, United Kingdom",
      slug: "kente-tailor-bespoke-mens-wedding-attire-3",
      country: "United Kingdom",
      description: "Expert bespoke tailoring for traditional African wedding attire and formal wear.",
      availableFrom: "2025-07-01",
      availableTo: "2025-07-31",
      phone: "+44 20 7123 4567",
      email: "hello@kentetailor.co.uk",
      website: "https://kentetailor.co.uk",
      socials: {
        instagram: "https://instagram.com/kentetailor",
        facebook: "https://facebook.com/kentetailor",
        twitter: "https://x.com/kentetailor",
      },
    },
    {
      id: "cs-4",
      name: "Kente Tailor — Bespoke Mens Wedding Attire",
      subtitle: "Traditional Wedding Attire",
      category: "cultural-services",
      subcategory: "dancers",
      image: "/images/clothing/clothing4.jpg",
      rating: 4.9,
      reviews: "2.5k",
      verified: true,
      location: "North London, United Kingdom",
      slug: "kente-tailor-bespoke-mens-wedding-attire-4",
      country: "United Kingdom",
      description: "Expert bespoke tailoring for traditional African wedding attire and formal wear.",
      availableFrom: "2025-08-10",
      availableTo: "2025-09-05",
      phone: "+44 20 7123 4567",
      email: "hello@kentetailor.co.uk",
      website: "https://kentetailor.co.uk",
      socials: {
        instagram: "https://instagram.com/kentetailor",
        facebook: "https://facebook.com/kentetailor",
        twitter: "https://x.com/kentetailor",
      },
    },
    {
      id: "cs-5",
      name: "Kente Tailor — Bespoke Mens Wedding Attire",
      subtitle: "Traditional Wedding Attire",
      category: "cultural-services",
      subcategory: "drummers-cultural-performers",
      image: "/images/art/art1.jpg",
      rating: 4.5,
      reviews: "1.3k",
      verified: true,
      location: "East London, United Kingdom",
      slug: "kente-tailor-bespoke-mens-wedding-attire-5",
      country: "United Kingdom",
      description: "Expert bespoke tailoring for traditional African wedding attire and formal wear.",
      availableFrom: "2025-09-15",
      availableTo: "2025-10-12",
      phone: "+44 20 7123 4567",
      email: "hello@kentetailor.co.uk",
      website: "https://kentetailor.co.uk",
      socials: {
        instagram: "https://instagram.com/kentetailor",
        facebook: "https://facebook.com/kentetailor",
        twitter: "https://x.com/kentetailor",
      },
    },
    {
      id: "cs-6",
      name: "Kente Tailor — Bespoke Mens Wedding Attire",
      subtitle: "Traditional Wedding Attire",
      category: "cultural-services",
      subcategory: "drummers-cultural-performers",
      image: "/images/art/art2.jpg",
      rating: 4.8,
      reviews: "2.0k",
      verified: false,
      location: "South London, United Kingdom",
      slug: "kente-tailor-bespoke-mens-wedding-attire-6",
      country: "United Kingdom",
      description: "Expert bespoke tailoring for traditional African wedding attire and formal wear.",
      availableFrom: "2025-10-20",
      availableTo: "2025-11-15",
      phone: "+44 20 7123 4567",
      email: "hello@kentetailor.co.uk",
      website: "https://kentetailor.co.uk",
      socials: {
        instagram: "https://instagram.com/kentetailor",
        facebook: "https://facebook.com/kentetailor",
        twitter: "https://x.com/kentetailor",
      },
    },
  ],
  "fashion-lifestyle": [
    {
      id: "fl-1",
      name: "Free the Youth",
      subtitle: "Contemporary African Fashion",
      category: "fashion-lifestyle",
      subcategory: "clothing",
      image: "/images/lf/lf1.jpg",
      rating: 4.7,
      reviews: "1.9k",
      verified: true,
      location: "West London, United Kingdom",
      slug: "free-the-youth",
      country: "United Kingdom",
      availableFrom: "2025-05-12",
      availableTo: "2025-06-15",
      description: "Streetwear label blending African heritage and modern silhouettes.",
      phone: "+44 20 7890 1234",
      email: "contact@fty.com",
      website: "https://fty.com",
      socials: {
        instagram: "https://instagram.com/freetheyouth",
        youtube: "https://youtube.com/@fty",
      },
    },
    {
      id: "fl-2",
      name: "Heritage Clothing Boutique",
      subtitle: "Authentic African Clothing",
      category: "fashion-lifestyle",
      subcategory: "clothing",
      image: "/images/lf/lf2.jpg",
      rating: 4.6,
      reviews: "1.6k",
      verified: true,
      location: "Central London, United Kingdom",
      slug: "heritage-clothing-boutique",
      country: "United Kingdom",
      description: "Streetwear label blending African heritage and modern silhouettes.",
      availableFrom: "2025-06-20",
      availableTo: "2025-07-18",
      phone: "+44 20 7890 1234",
      email: "contact@fty.com",
      website: "https://fty.com",
      socials: {
        instagram: "https://instagram.com/freetheyouth",
        youtube: "https://youtube.com/@fty",
      },
    },
    {
      id: "fl-3",
      name: "Afrocentric Styles",
      subtitle: "Bold African Fashion",
      category: "fashion-lifestyle",
      subcategory: "clothing",
      image: "/images/lf/lf3.jpg",
      rating: 4.8,
      reviews: "2.1k",
      verified: false,
      location: "North London, United Kingdom",
      slug: "afrocentric-styles",
      country: "United Kingdom",
       description: "Streetwear label blending African heritage and modern silhouettes.",
      availableFrom: "2025-07-25",
      availableTo: "2025-08-30",
      phone: "+44 20 7890 1234",
      email: "contact@fty.com",
      website: "https://fty.com",
      socials: {
        instagram: "https://instagram.com/freetheyouth",
        youtube: "https://youtube.com/@fty",
      },
    },
    {
      id: "fl-4",
      name: "Beaded Heritage Necklaces",
      subtitle: "Handcrafted Jewelry",
      category: "fashion-lifestyle",
      subcategory: "jewellery",
      image: "/images/lf/lf4.jpg",
      rating: 4.9,
      reviews: "2.4k",
      verified: true,
      location: "South London, United Kingdom",
      slug: "beaded-heritage-necklaces",
      country: "United Kingdom",
       description: "Streetwear label blending African heritage and modern silhouettes.",
      availableFrom: "2025-09-05",
      availableTo: "2025-10-02",
      phone: "+44 20 7890 1234",
      email: "contact@fty.com",
      website: "https://fty.com",
      socials: {
        instagram: "https://instagram.com/freetheyouth",
        youtube: "https://youtube.com/@fty",
      },
    },
    {
      id: "fl-5",
      name: "Golden Adornments",
      subtitle: "African-Inspired Jewelry",
      category: "fashion-lifestyle",
      subcategory: "jewellery",
      image: "/images/lf/lf5.jpg",
      rating: 4.7,
      reviews: "1.8k",
      verified: true,
      location: "East London, United Kingdom",
      slug: "golden-adornments",
      country: "United Kingdom",
       description: "Streetwear label blending African heritage and modern silhouettes.",
      availableFrom: "2025-10-08",
      availableTo: "2025-11-20",
      phone: "+44 20 7890 1234",
      email: "contact@fty.com",
      website: "https://fty.com",
      socials: {
        instagram: "https://instagram.com/freetheyouth",
        youtube: "https://youtube.com/@fty",
      },
    },
    {
      id: "fl-6",
      name: "Tribal Treasures Jewelry",
      subtitle: "Handmade Tribal Jewelry",
      category: "fashion-lifestyle",
      subcategory: "art-crafts",
      image: "/images/lf/lf6.jpg",
      rating: 4.5,
      reviews: "1.4k",
      verified: false,
      location: "West London, United Kingdom",
      slug: "tribal-treasures-jewelry",
      country: "United Kingdom",
       description: "Streetwear label blending African heritage and modern silhouettes.",
      availableFrom: "2025-11-01",
      availableTo: "2025-12-15",
      phone: "+44 20 7890 1234",
      email: "contact@fty.com",
      website: "https://fty.com",
      socials: {
        instagram: "https://instagram.com/freetheyouth",
        youtube: "https://youtube.com/@fty",
      },
    },
  ],
  "food-hospitality": [
    {
      id: "fh-1",
      name: "Mama's African Catering",
      subtitle: "Traditional African Cuisine",
      category: "food-hospitality",
      subcategory: "caterer",
      image: "/images/backgroundImages/business/food.jpg",
      rating: 4.9,
      reviews: "3.2k",
      verified: true,
      location: "South London, United Kingdom",
      slug: "mamas-african-catering",
      country: "United Kingdom",
      availableFrom: "2025-05-04",
      availableTo: "2025-05-28",
      description: "Authentic West African catering for weddings, parties and corporate events.",
      phone: "+44 20 3344 5566",
      email: "orders@mamasafrican.co.uk",
      website: "https://mamasafrican.co.uk",
      socials: {
        instagram: "https://instagram.com/mamasafricancatering",
        facebook: "https://facebook.com/mamasafricancatering",
        tiktok: "https://tiktok.com/@mamasafricancatering",
      },
    },
    {
      id: "fh-2",
      name: "Jollof Palace Restaurant",
      subtitle: "West African Delicacies",
      category: "food-hospitality",
      subcategory: "restaurant",
      image: "/images/food/food2.jpg",
      rating: 4.8,
      reviews: "2.8k",
      verified: true,
      location: "Central London, United Kingdom",
      slug: "jollof-palace-restaurant",
      country: "United Kingdom",
      description: "Authentic West African catering for weddings, parties and corporate events.",
      availableFrom: "2025-06-10",
      availableTo: "2025-07-05",
       phone: "+44 20 3344 5566",
      email: "orders@mamasafrican.co.uk",
      website: "https://mamasafrican.co.uk",
      socials: {
        instagram: "https://instagram.com/mamasafricancatering",
        facebook: "https://facebook.com/mamasafricancatering",
        tiktok: "https://tiktok.com/@mamasafricancatering",
      },
    },
    {
      id: "fh-3",
      name: "Suya Spot",
      subtitle: "Nigerian Street Food",
      category: "food-hospitality",
      subcategory: "street-food",
      image: "/images/food/food3.jpg",
      rating: 4.7,
      reviews: "2.3k",
      verified: false,
      location: "North London, United Kingdom",
      slug: "suya-spot",
      country: "United Kingdom",
      description: "Authentic West African catering for weddings, parties and corporate events.",
      availableFrom: "2025-07-12",
      availableTo: "2025-08-20",
       phone: "+44 20 3344 5566",
      email: "orders@mamasafrican.co.uk",
      website: "https://mamasafrican.co.uk",
      socials: {
        instagram: "https://instagram.com/mamasafricancatering",
        facebook: "https://facebook.com/mamasafricancatering",
        tiktok: "https://tiktok.com/@mamasafricancatering",
      },
    },
    {
      id: "fh-4",
      name: "Ethiopian Flavors",
      subtitle: "Authentic Ethiopian Cuisine",
      category: "food-hospitality",
      subcategory: "restaurant",
      image: "/images/food/food4.jpg",
      rating: 4.6,
      reviews: "1.9k",
      verified: true,
      location: "East London, United Kingdom",
      slug: "ethiopian-flavors",
      country: "United Kingdom",
      description: "Authentic West African catering for weddings, parties and corporate events.",
      availableFrom: "2025-08-25",
      availableTo: "2025-09-30",
       phone: "+44 20 3344 5566",
      email: "orders@mamasafrican.co.uk",
      website: "https://mamasafrican.co.uk",
      socials: {
        instagram: "https://instagram.com/mamasafricancatering",
        facebook: "https://facebook.com/mamasafricancatering",
        tiktok: "https://tiktok.com/@mamasafricancatering",
      },
    },
    {
      id: "fh-5",
      name: "Afro Fusion Bistro",
      subtitle: "Modern African Cuisine",
      category: "food-hospitality",
      subcategory: "restaurant",
      image: "/images/food/food1.jpg",
      rating: 4.8,
      reviews: "2.5k",
      verified: true,
      location: "West London, United Kingdom",
      slug: "afro-fusion-bistro",
      country: "United Kingdom",
      description: "Authentic West African catering for weddings, parties and corporate events.",
      availableFrom: "2025-10-05",
      availableTo: "2025-11-10",
       phone: "+44 20 3344 5566",
      email: "orders@mamasafrican.co.uk",
      website: "https://mamasafrican.co.uk",
      socials: {
        instagram: "https://instagram.com/mamasafricancatering",
        facebook: "https://facebook.com/mamasafricancatering",
        tiktok: "https://tiktok.com/@mamasafricancatering",
      },
    },
    {
      id: "fh-6",
      name: "Plantain Paradise",
      subtitle: "Caribbean-African Fusion",
      category: "food-hospitality",
      subcategory: "street-food",
      image: "/images/food/food2.jpg",
      rating: 4.5,
      reviews: "1.7k",
      verified: false,
      location: "South London, United Kingdom",
      slug: "plantain-paradise",
      country: "United Kingdom",
      description: "Authentic West African catering for weddings, parties and corporate events.",
      availableFrom: "2025-11-15",
      availableTo: "2025-12-20",
       phone: "+44 20 3344 5566",
      email: "orders@mamasafrican.co.uk",
      website: "https://mamasafrican.co.uk",
      socials: {
        instagram: "https://instagram.com/mamasafricancatering",
        facebook: "https://facebook.com/mamasafricancatering",
        tiktok: "https://tiktok.com/@mamasafricancatering",
      },
    },
  ],
};

// Category Page Content Configuration
export interface CategoryPageContent {
  heroTitle: string;
  heroDescription: string;
  cultureTitle: string;
  cultureDescription: string;
  dealsTitle: string;
  dealsDescription: string;
}

export const categoryPageContent: CategoryPageContent = {
  heroTitle: "Most popular attire stylists around you",
  heroDescription: "Discover top-rated stylists ready to help you integrate your cultural expressions, fashion, and more",
  cultureTitle: "Culture in every detail",
  cultureDescription: "Explore the richness of African culture through our curated listings, showcasing cultural expressions, fashion, and more",
  dealsTitle: "Today's best deals for you",
  dealsDescription: "Handpicked offers you won't want to miss",
};

// Popular service providers (for "Most popular attire stylists around you" section)
export const popularStylists: ServiceProvider[] = [
  {
    id: "ps-1",
    name: "Kente Tailor — Bespoke Mens Wedding Attire",
    subtitle: "Traditional Wedding Attire",
    category: "cultural-services",
    subcategory: "cultural-attire-stylist",
    image: "/images/clothing/clothing1.jpg",
    rating: 4.8,
    reviews: "2.2k",
    verified: true,
    location: "South London, United Kingdom",
    slug: "kente-tailor-bespoke-mens-wedding-attire",
    country: "United Kingdom",
    description: "Explore the richness of African culture through our curated listings, showcasing cultural expressions, fashion, and more",
    availableFrom: "2025-05-01",
    availableTo: "2025-05-31",
        phone: "+44 20 3344 5566",
        email: "orders@mamasafrican.co.uk",
        website: "https://mamasafrican.co.uk",
        socials: {
          instagram: "https://instagram.com/mamasafricancatering",
          facebook: "https://facebook.com/mamasafricancatering",
          tiktok: "https://tiktok.com/@mamasafricancatering",
        },
  },
  {
    id: "ps-2",
    name: "Kente Tailor — Bespoke Mens Wedding Attire",
    subtitle: "Traditional Wedding Attire",
    category: "cultural-services",
    subcategory: "cultural-attire-stylist",
    image: "/images/clothing/clothing2.jpg",
    rating: 4.7,
    reviews: "1.8k",
    verified: true,
    location: "West London, United Kingdom",
    slug: "kente-tailor-bespoke-mens-wedding-attire-2",
    country: "United Kingdom",
     description: "Explore the richness of African culture through our curated listings, showcasing cultural expressions, fashion, and more",
    availableFrom: "2025-06-05",
    availableTo: "2025-06-28",
     phone: "+44 20 3344 5566",
    email: "orders@mamasafrican.co.uk",
    website: "https://mamasafrican.co.uk",
    socials: {
      instagram: "https://instagram.com/mamasafricancatering",
      facebook: "https://facebook.com/mamasafricancatering",
      tiktok: "https://tiktok.com/@mamasafricancatering",
    },
  },
  {
    id: "ps-3",
    name: "Kente Tailor — Bespoke Mens Wedding Attire",
    subtitle: "Traditional Wedding Attire",
    category: "cultural-services",
    subcategory: "dancers",
    image: "/images/clothing/clothing3.jpg",
    rating: 4.6,
    reviews: "1.5k",
    verified: false,
    location: "Central London, United Kingdom",
    slug: "kente-tailor-bespoke-mens-wedding-attire-3",
    country: "United Kingdom",
     description: "Explore the richness of African culture through our curated listings, showcasing cultural expressions, fashion, and more",
    availableFrom: "2025-07-01",
    availableTo: "2025-07-31",
    phone: "+44 20 3344 5566",
    email: "orders@mamasafrican.co.uk",
    website: "https://mamasafrican.co.uk",
    socials: {
      instagram: "https://instagram.com/mamasafricancatering",
      facebook: "https://facebook.com/mamasafricancatering",
      tiktok: "https://tiktok.com/@mamasafricancatering",
    },
  },
  {
    id: "ps-4",
    name: "Kente Tailor — Bespoke Mens Wedding Attire",
    subtitle: "Traditional Wedding Attire",
    category: "cultural-services",
    subcategory: "dancers",
    image: "/images/clothing/clothing4.jpg",
    rating: 4.9,
    reviews: "2.5k",
    verified: true,
    location: "North London, United Kingdom",
    slug: "kente-tailor-bespoke-mens-wedding-attire-4",
    country: "United Kingdom",
     description: "Explore the richness of African culture through our curated listings, showcasing cultural expressions, fashion, and more",
    availableFrom: "2025-08-10",
    availableTo: "2025-09-05",
    phone: "+44 20 3344 5566",
    email: "orders@mamasafrican.co.uk",
    website: "https://mamasafrican.co.uk",
    socials: {
      instagram: "https://instagram.com/mamasafricancatering",
      facebook: "https://facebook.com/mamasafricancatering",
      tiktok: "https://tiktok.com/@mamasafricancatering",
    },
  },
  {
    id: "ps-5",
    name: "Kente Tailor — Bespoke Mens Wedding Attire",
    subtitle: "Traditional Wedding Attire",
    category: "cultural-services",
    subcategory: "drummers-cultural-performers",
    image: "/images/art/art1.jpg",
    rating: 4.5,
    reviews: "1.3k",
    verified: true,
    location: "East London, United Kingdom",
    slug: "kente-tailor-bespoke-mens-wedding-attire-5",
    country: "United Kingdom",
     description: "Explore the richness of African culture through our curated listings, showcasing cultural expressions, fashion, and more",
    availableFrom: "2025-09-15",
    availableTo: "2025-10-12",
    phone: "+44 20 3344 5566",
    email: "orders@mamasafrican.co.uk",
    website: "https://mamasafrican.co.uk",
    socials: {
      instagram: "https://instagram.com/mamasafricancatering",
      facebook: "https://facebook.com/mamasafricancatering",
      tiktok: "https://tiktok.com/@mamasafricancatering",
    },
  },
  {
    id: "ps-6",
    name: "Kente Tailor — Bespoke Mens Wedding Attire",
    subtitle: "Traditional Wedding Attire",
    category: "cultural-services",
    image: "/images/art/art2.jpg",
    rating: 4.8,
    reviews: "2.0k",
    verified: false,
    location: "South London, United Kingdom",
    slug: "kente-tailor-bespoke-mens-wedding-attire-6",
    country: "United Kingdom",
     description: "Explore the richness of African culture through our curated listings, showcasing cultural expressions, fashion, and more",
    availableFrom: "2025-10-20",
    availableTo: "2025-11-15",
    phone: "+44 20 3344 5566",
    email: "orders@mamasafrican.co.uk",
    website: "https://mamasafrican.co.uk",
    socials: {
      instagram: "https://instagram.com/mamasafricancatering",
      facebook: "https://facebook.com/mamasafricancatering",
      tiktok: "https://tiktok.com/@mamasafricancatering",
    },
  },
];
