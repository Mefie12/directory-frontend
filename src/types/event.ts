// types/events.ts
export interface ProcessedEvent {
  id: string;
  name: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  images: string[];
  location: string;
  verified: boolean;
  category: string;
  categorySlug: string;
  type: "event";
  country: string;
  createdAt: Date;
  startDate: string;
  endDate: string;
  date: string;
  price: string;
  rating: number;
  reviewCount: number;
  time?: string; // Optional time property
}