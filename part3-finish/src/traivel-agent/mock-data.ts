export interface Destination {
  name: string;
  country: string;
  region: "domestic" | "international";
  category: string[];
  description: string;
  budget: "budget" | "mid-range" | "luxury";
  highlights: string[];
}

/**
 * Mock travel destination data.
 * In production, these would come from a real API or database.
 */
export const DESTINATIONS: Destination[] = [
  {
    name: "Bali",
    country: "Indonesia",
    region: "domestic",
    category: ["beach", "culture", "nature"],
    description:
      "Island of Gods with stunning beaches, ancient temples, and vibrant rice terraces.",
    budget: "mid-range",
    highlights: ["Ubud Rice Terraces", "Tanah Lot Temple", "Seminyak Beach"],
  },
  {
    name: "Yogyakarta",
    country: "Indonesia",
    region: "domestic",
    category: ["culture", "history"],
    description:
      "Cultural heart of Java, home to Borobudur and Prambanan temples.",
    budget: "budget",
    highlights: ["Borobudur Temple", "Prambanan Temple", "Malioboro Street"],
  },
  {
    name: "Raja Ampat",
    country: "Indonesia",
    region: "domestic",
    category: ["beach", "nature", "diving"],
    description:
      "Paradise for divers with the world's highest marine biodiversity.",
    budget: "luxury",
    highlights: ["Piaynemo Viewpoint", "Misool Island", "Diving at Manta Point"],
  },
  {
    name: "Labuan Bajo",
    country: "Indonesia",
    region: "domestic",
    category: ["nature", "adventure"],
    description:
      "Gateway to Komodo National Park, home of the legendary Komodo dragons.",
    budget: "mid-range",
    highlights: ["Komodo Island", "Padar Island", "Pink Beach"],
  },
  {
    name: "Bandung",
    country: "Indonesia",
    region: "domestic",
    category: ["nature", "culinary"],
    description:
      "Cool climate city surrounded by volcanic mountains and tea plantations.",
    budget: "budget",
    highlights: ["Kawah Putih", "Tangkuban Perahu", "Factory Outlets"],
  },
  {
    name: "Tokyo",
    country: "Japan",
    region: "international",
    category: ["culture", "culinary", "shopping"],
    description:
      "A mesmerizing blend of ultra-modern and traditional Japanese culture.",
    budget: "luxury",
    highlights: ["Shibuya Crossing", "Senso-ji Temple", "Akihabara"],
  },
  {
    name: "Seoul",
    country: "South Korea",
    region: "international",
    category: ["culture", "culinary", "shopping"],
    description:
      "Dynamic city where K-pop meets ancient palaces and street food culture.",
    budget: "mid-range",
    highlights: ["Gyeongbokgung Palace", "Myeongdong", "N Seoul Tower"],
  },
  {
    name: "Singapore",
    country: "Singapore",
    region: "international",
    category: ["culinary", "shopping", "family"],
    description:
      "Garden city with world-class food, futuristic gardens, and cultural diversity.",
    budget: "luxury",
    highlights: ["Gardens by the Bay", "Marina Bay Sands", "Hawker Centres"],
  },
  {
    name: "Bangkok",
    country: "Thailand",
    region: "international",
    category: ["culture", "culinary", "shopping"],
    description:
      "City of ornate shrines, vibrant street life, and legendary food scene.",
    budget: "budget",
    highlights: ["Grand Palace", "Chatuchak Market", "Khao San Road"],
  },
  {
    name: "Kuala Lumpur",
    country: "Malaysia",
    region: "international",
    category: ["culture", "culinary", "shopping"],
    description:
      "Multi-cultural capital with iconic skyscrapers and incredible food.",
    budget: "budget",
    highlights: ["Petronas Twin Towers", "Batu Caves", "Jalan Alar Food Street"],
  },
];

/**
 * Mock visa requirement data for Indonesian nationals.
 * In production, these would come from a real API or database.
 */
export const VISA_DATA: Record<string, { required: boolean; notes: string }> = {
  Japan: {
    required: true,
    notes: "Indonesian citizens need a tourist visa. e-Visa available.",
  },
  "South Korea": {
    required: true,
    notes: "Indonesian citizens need a tourist visa. K-ETA required.",
  },
  Singapore: {
    required: false,
    notes: "Visa-free for Indonesian citizens (up to 30 days).",
  },
  Thailand: {
    required: false,
    notes: "Visa-free for Indonesian citizens (up to 30 days).",
  },
  Malaysia: {
    required: false,
    notes: "Visa-free for Indonesian citizens (up to 30 days).",
  },
};
