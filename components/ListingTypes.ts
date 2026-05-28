export interface ListingItem {
  id: string;
  title: string;
  category: string;
  condition: string;
  description: string;
  priceSweet: number;
  priceLow: number;
  priceHigh: number;
  priceReasoning: string;
  tags: string[];
  platformTips: {
    ebay: string;
    facebookMarketplace: string;
    offerup: string;
    nextdoor: string;
  };
  channels: {
    ebay: boolean;
    facebook: boolean;
    offerup: boolean;
    nextdoor: boolean;
  };
  imageOriginal: string;
  imageProcessed: string;
  status: "Active" | "Draft" | "Sold";
  views: number;
  inquiries: number;
  creationDate: string;
  bgRemoved: boolean;
  bgColor: string;
  brightness: number;
  contrast: number;
  saturation: number;
  cropRatio: string;
  blur?: number;
  userId?: string;
}

export interface SubscriptionStatus {
  tier: string;
  isActive: boolean;
  listingsUsed: number;
  listingsMax: number;
}
