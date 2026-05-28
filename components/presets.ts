import { ListingItem } from "./ListingTypes";

export const PRESET_LISTINGS: ListingItem[] = [
  {
    id: "preset-1",
    title: "Vintage Leather Messenger Bag",
    category: "Bags & Accessories",
    condition: "Good",
    description: "### Elegant Messenger Bag\n- Robust full-grain leather.\n- Padded sleeve for 15-inch laptop.\n- Antique brass hardware.",
    priceSweet: 75,
    priceLow: 60,
    priceHigh: 110,
    priceReasoning: "Based on recent eBay listings for genuine vintage cowhide bags in good condition.",
    tags: ["vintage", "leather", "bag"],
    platformTips: {
      ebay: "List with buy-it-now and global shipping enabled.",
      facebookMarketplace: "Good local item. Meet up at public store locations.",
      offerup: "Accept lower boundary or swap offers safely.",
      nextdoor: "Describe as perfect daily commuter bag for local professionals."
    },
    channels: { ebay: false, facebook: false, offerup: false, nextdoor: false },
    imageOriginal: "https://picsum.photos/seed/vintage-bag/600/600",
    imageProcessed: "https://picsum.photos/seed/vintage-bag/600/600",
    status: "Draft",
    views: 12,
    inquiries: 2,
    creationDate: "2026-05-25",
    bgRemoved: false,
    bgColor: "slate",
    brightness: 100,
    contrast: 100,
    saturation: 100,
    cropRatio: "original"
  },
  {
    id: "preset-2",
    title: "Retro Mechanical Keyboard",
    category: "Electronics",
    condition: "Like New",
    description: "### Custom Mechanical Keyboard\n- Yellow hotswap mechanical switches.\n- Sleek PBT keycaps in retro color scheme.\n- Beautiful amber backlight.",
    priceSweet: 120,
    priceLow: 95,
    priceHigh: 150,
    priceReasoning: "Built custom with high grade keycaps. Retains premium peripheral value.",
    tags: ["keyboard", "gaming", "retro"],
    platformTips: {
      ebay: "Highlight 'hotswap keyboard' and 'ergonomic retro style'.",
      facebookMarketplace: "Highlight that it is pristine, fully tested, and clean.",
      offerup: "Set to 130 to allow room for negotiation.",
      nextdoor: "List under study/office equipment column."
    },
    channels: { ebay: false, facebook: false, offerup: false, nextdoor: false },
    imageOriginal: "https://picsum.photos/seed/keyboard/600/600",
    imageProcessed: "https://picsum.photos/seed/keyboard/600/600",
    status: "Active",
    views: 45,
    inquiries: 6,
    creationDate: "2026-05-27",
    bgRemoved: false,
    bgColor: "slate",
    brightness: 100,
    contrast: 100,
    saturation: 100,
    cropRatio: "original"
  }
];
