export type Lang = "en" | "te";

/** Pick the right bilingual value, falling back to English when Telugu is blank. */
export function pick(lang: Lang, en: string | null | undefined, te: string | null | undefined): string {
  if (lang === "te" && te && te.trim()) return te;
  return en ?? "";
}

// Static UI label dictionary. Content (temple names etc.) comes from the DB.
export const dict = {
  en: {
    appName: "Devalayam",
    tagline: "Temples of Telangana & Andhra Pradesh",
    home: "Home",
    temples: "Temples",
    search: "Search temples, deities, places",
    filterByCategory: "Filter by category",
    filterByDistrict: "Filter by district",
    allCategories: "All categories",
    allDistricts: "All districts",
    primaryDeity: "Primary deity",
    secondaryDeities: "Other deities",
    timings: "Timings",
    timingExceptions: "Special days",
    address: "Address",
    contact: "Contact",
    getDirections: "Get directions",
    donate: "Donate via UPI",
    scanToDonate: "Scan to donate",
    events: "Events",
    videos: "Videos",
    categories: "Categories",
    byDeities: "Temples by Deity",
    byLocation: "Temples by Location",
    bySignificance: "Temples by Significance",
    byFacilities: "Temples by Facilities",
    viewAll: "View all",
    featured: "Featured Temples",
    dharmaLine: "Dharmo Rakshati Rakshithaha",
    comingSoon: "Temples will appear here soon.",
    login: "Login",
    logout: "Logout",
    dashboard: "Dashboard",
    closed: "Closed",
    noResults: "No temples found.",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  te: {
    appName: "దేవాలయం",
    tagline: "తెలంగాణ & ఆంధ్రప్రదేశ్ దేవాలయాలు",
    home: "హోమ్",
    temples: "దేవాలయాలు",
    search: "దేవాలయాలు, దేవతలు, ప్రదేశాలు వెతకండి",
    filterByCategory: "వర్గం ప్రకారం",
    filterByDistrict: "జిల్లా ప్రకారం",
    allCategories: "అన్ని వర్గాలు",
    allDistricts: "అన్ని జిల్లాలు",
    primaryDeity: "ప్రధాన దేవత",
    secondaryDeities: "ఇతర దేవతలు",
    timings: "సమయాలు",
    timingExceptions: "ప్రత్యేక రోజులు",
    address: "చిరునామా",
    contact: "సంప్రదించండి",
    getDirections: "దారి చూపించు",
    donate: "UPI ద్వారా విరాళం",
    scanToDonate: "విరాళం కోసం స్కాన్ చేయండి",
    events: "కార్యక్రమాలు",
    videos: "వీడియోలు",
    categories: "వర్గాలు",
    byDeities: "దేవతల వారీగా దేవాలయాలు",
    byLocation: "ప్రదేశం వారీగా దేవాలయాలు",
    bySignificance: "ప్రాముఖ్యత వారీగా దేవాలయాలు",
    byFacilities: "సౌకర్యాల వారీగా దేవాలయాలు",
    viewAll: "అన్నీ చూడండి",
    featured: "విశేష దేవాలయాలు",
    dharmaLine: "ధర్మో రక్షతి రక్షితః",
    comingSoon: "దేవాలయాలు త్వరలో ఇక్కడ కనిపిస్తాయి.",
    login: "లాగిన్",
    logout: "లాగౌట్",
    dashboard: "డాష్‌బోర్డ్",
    closed: "మూసివేయబడింది",
    noResults: "దేవాలయాలు కనబడలేదు.",
    days: ["ఆది", "సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని"],
  },
} as const;

export function t(lang: Lang) {
  return dict[lang];
}
