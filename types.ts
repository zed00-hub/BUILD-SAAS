
export enum Language {
  Arabic = 'Arabic',
  French = 'French',
  English = 'English',
  Spanish = 'Spanish',
  German = 'German',
  Italian = 'Italian',
  Dutch = 'Dutch'
}

export enum Country {
  Algeria = 'Algeria',
  Morocco = 'Morocco',
  Gulf = 'Gulf Countries (GCC)',
  Spain = 'Spain',
  Italy = 'Italy',
  France = 'France',
  USA = 'USA',
  UK = 'UK',
  Germany = 'Germany'
}

export type ToolType = 'home' | 'social-media' | 'ad-creative' | 'landing-page' | 'quick-edit' | 'product-description' | 'virtual-tryon' | 'admin';

export interface SocialMediaParams {
  description: string;
  styleImage?: string; // base64
  logoImage?: string; // base64
  elementImage?: string; // base64 (New additional element image)
  additionalElements?: string;
  slideCount: number; // 1 to 5
}

export interface AdCreativeParams {
  headline?: string;
  subheadline?: string;
  cta?: string;
  price?: string;
  language: Language;
  country: Country;
  productImage: string; // base64
  logoImage?: string; // base64
  additionalElements?: string;
}

export interface LandingPageParams {
  productImage: string; // base64
  logoImage?: string; // base64
  customDescription?: string;
  language: Language;
  country: Country;
}

export interface SlidePlan {
  slideNumber: number;
  role: string; // e.g., Hook, Value, Call to Action
  visualDescription: string;
  title: string;
  subtitle: string;
  designNotes: string;
}

// --- History Types ---

export type HistoryToolType = 'social' | 'ad' | 'landing' | 'quick-edit';

export interface HistoryItem {
  id: string;
  timestamp: number;
  tool: HistoryToolType;
  inputs: any; // Flexible input data based on tool
  results: string[] | string; // Array of images or single image
  meta?: any; // Extra metadata (like SlidePlan)
}

// --- Tool Lock Types ---

export interface ToolLock {
  toolId: string;
  isGlobal: boolean;
  affectedUserIds?: string[]; // If not global
  reason: string;
  createdAt: number;
  createdBy: string;
}
