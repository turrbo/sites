export interface Listing {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  shortDescription?: string;
  address: string;
  city: string;
  state: string;
  stateFull: string;
  zip?: string;
  phone?: string;
  website?: string;
  email?: string;
  imageUrl?: string;
  gallery?: { url: string; filename: string }[];
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  amenities?: string[];
  hours?: string;
  latitude?: number;
  longitude?: number;
  featured?: boolean;
  published?: boolean;
  tags?: string[];
  services?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface SEOPage {
  id: string;
  title: string;
  slug: string;
  type: "pillar" | "guide" | "comparison";
  content: string;
  category?: string;
  city?: string;
  state?: string;
  metaTitle?: string;
  metaDescription?: string;
  published?: boolean;
}

export interface CityGroup {
  city: string;
  state: string;
  stateFull: string;
  count: number;
  slug: string;
}

export interface StateGroup {
  state: string;
  stateFull: string;
  cities: CityGroup[];
  count: number;
}
