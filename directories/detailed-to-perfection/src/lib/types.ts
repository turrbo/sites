export interface Product {
  name: string;
  image?: string;
  price?: string;
  rating: number;
  amazonUrl: string;
  pros: string[];
  cons: string[];
  verdict?: string;
}

export interface Review {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  products: Product[];
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  published: boolean;
}

export interface Guide {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  published: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  publishedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
}
