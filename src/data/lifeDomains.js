// Canonical Life Centre domains. Keep this list data-driven so new areas can be
// added without rewriting the Command Centre.
export const LIFE_DOMAINS = Object.freeze([
  { id: "phd", label: "PhD / SNU Research", icon: "🎓" },
  { id: "career", label: "Career", icon: "💼" },
  { id: "office", label: "Office / TCS", icon: "🖥️" },
  { id: "learning", label: "Learning", icon: "📚" },
  { id: "ugc", label: "UGC NET", icon: "📝" },
  { id: "certifications", label: "Certifications", icon: "🏆" },
  { id: "government", label: "Government Jobs", icon: "🏛️" },
  { id: "health", label: "Health", icon: "❤️" },
  { id: "journal", label: "Journal", icon: "📔" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "general", label: "General", icon: "📌" },
]);

export const DOMAIN_IDS = Object.freeze(LIFE_DOMAINS.map((domain) => domain.id));

export function getDomain(id) {
  return LIFE_DOMAINS.find((domain) => domain.id === id) || LIFE_DOMAINS[LIFE_DOMAINS.length - 1];
}
