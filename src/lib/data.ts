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
};

export const featuredBusinesses: Business[] = [
  {
    id: "1",
    name: "Kente Tailor — Bespoke Mens Wedding Attire",
    description: "Expert bespoke tailoring for traditional African wedding attire and formal wear",
    category: "Clothing",
    country: "United Kingdom",
    image: "/images/backgroundImages/business/tailor.jpg",
    rating: 4,
    reviewCount: "2.2k",
    location: "South London, United Kingdom",
    verified: false,
    slug: "kente-tailor-bespoke-mens-wedding-attire",
    type: "business",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    name: "Beaded Heritage Necklace & Bracelets",
    description: "Handcrafted traditional African beaded jewelry and accessories",
    category: "Jewelry",
    country: "United Kingdom",
    image: "/images/backgroundImages/business/beads.jpg",
    rating: 4.5,
    reviewCount: "2.2k",
    location: "South London, United Kingdom",
    verified: true,
    slug: "beaded-heritage-necklace-bracelets",
    type: "business",
    createdAt: "2024-02-01T00:00:00Z",
    discount: "-20%",
  },
  {
    id: "3",
    name: "Kente Tailor — Bespoke Mens Wedding Attire",
    description: "Traditional African sculptures and handcrafted art pieces",
    category: "Art & Craft",
    country: "United Kingdom",
    image: "/images/backgroundImages/business/sculpture.jpg",
    rating: 5,
    reviewCount: "2.2k",
    location: "South London, United Kingdom",
    verified: true,
    slug: "kente-tailor-craft",
    type: "business",
    createdAt: "2024-02-10T00:00:00Z",
  },
  {
    id: "4",
    name: "Kente Tailor — Bespoke Mens Wedding Attire",
    description: "Authentic African pottery and ceramic art workshops",
    category: "Art & Craft",
    country: "United Kingdom",
    image: "/images/backgroundImages/business/pottery.jpg",
    rating: 5,
    reviewCount: "2.2k",
    location: "South London, United Kingdom",
    verified: true,
    slug: "kente-tailor-pottery",
    type: "business",
    createdAt: "2024-02-15T00:00:00Z",
  },
  {
    id: "5",
    name: "African Cuisine Restaurant",
    description: "Authentic African dishes and traditional cuisine experience",
    category: "Food & Hospitality",
    country: "United Kingdom",
    image: "/images/backgroundImages/business/food.jpg",
    rating: 3,
    reviewCount: "3.1k",
    location: "East London, United Kingdom",
    verified: true,
    slug: "african-cuisine-restaurant",
    type: "business",
    createdAt: "2024-03-01T00:00:00Z",
    discount: "-15%",
  },
  {
    id: "6",
    name: "Traditional Fabric Store",
    description: "Premium African fabrics, textiles, and fashion materials",
    category: "Fashion & Lifestyle",
    country: "United Kingdom",
    image: "/images/backgroundImages/business/fabric-store.jpg",
    rating: 4.1,
    reviewCount: "1.8k",
    location: "West London, United Kingdom",
    verified: false,
    slug: "traditional-fabric-store",
    type: "business",
    createdAt: "2024-03-10T00:00:00Z",
  },
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
  country: string;
  createdAt: string;
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
    country: "Ghana",
    createdAt: "2024-10-01T00:00:00Z",
  },
  {
    id: "2",
    name: "African Heritage Festival",
    category: "Festival",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    image: "/images/backgroundImages/business/beads.jpg",
    location: "Virtual",
    slug: "african-heritage-festival",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    country: "Nigeria",
    createdAt: "2024-10-05T00:00:00Z",
  },
  {
    id: "3",
    name: "Art & Culture Exhibition",
    category: "Art & Craft",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    image: "/images/backgroundImages/business/sculpture.jpg",
    location: "Virtual",
    slug: "art-culture-exhibition",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: true,
    type: "event",
    date: "2025-11-20",
    country: "Kenya",
    createdAt: "2024-10-10T00:00:00Z",
  },
  {
    id: "4",
    name: "Traditional Pottery Workshop",
    category: "Art & Craft",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    image: "/images/backgroundImages/business/pottery.jpg",
    location: "Virtual",
    slug: "traditional-pottery-workshop",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: false,
    type: "event",
    date: "2025-11-20",
    country: "South Africa",
    createdAt: "2024-10-15T00:00:00Z",
  },
  {
    id: "5",
    name: "African Cuisine Festival",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    category: "Food & Hospitality",
    image: "/images/backgroundImages/business/food.jpg",
    location: "Virtual",
    slug: "african-cuisine-festival",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: false,
    type: "event",
    date: "2025-11-20",
    country: "Ethiopia",
    createdAt: "2024-10-20T00:00:00Z",
  },
  {
    id: "6",
    name: "Fashion & Lifestyle Expo",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    category: "Fashion & Lifestyle",
    image: "/images/backgroundImages/business/fabric-store.jpg",
    location: "Virtual",
    slug: "fashion-lifestyle-expo",
    startDate: "Nov 20",
    endDate: "Dec 3, 2025",
    verified: false,
    type: "event",
    date: "2025-11-20",
    country: "Senegal",
    createdAt: "2024-10-25T00:00:00Z",
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