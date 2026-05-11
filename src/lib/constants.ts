export const SKILL_CATEGORIES: Record<string, string[]> = {
  "Frontend Development": ["React","Vue.js","Angular","Next.js","HTML/CSS","Tailwind CSS","TypeScript","JavaScript","Svelte","Astro"],
  "Backend Development": ["Node.js","Python (Django)","Python (FastAPI)","Go","Rust","Java (Spring)","PHP","Ruby on Rails","C# (.NET)"],
  "Mobile Development": ["Flutter","React Native","iOS (Swift)","Android (Kotlin)","Expo"],
  "Database & Cloud": ["PostgreSQL","MySQL","MongoDB","Redis","Supabase","Firebase","AWS","Google Cloud","Docker","Kubernetes"],
  "AI & Data": ["Machine Learning","Deep Learning","NLP","Computer Vision","Data Analysis","Pandas/NumPy","TensorFlow","PyTorch","Scikit-learn"],
  "Design & UX": ["Figma","Adobe XD","Illustrator","Photoshop","Motion Design","3D (Blender)","UI Design","User Research"],
  "DevOps & Tools": ["Git/GitHub","CI/CD","Linux","Nginx","Testing (Jest/Cypress)","REST API","GraphQL","WebSockets"],
  "Other": ["Blockchain","Unity (Game Dev)","Arduino/IoT","Cybersecurity","Video Editing","Content Writing","SEO","Social Media"],
};

export const UNIVERSITIES = [
  "Qarabağ Universiteti",
  "ADA University",
  "UNEC",
  "Bakı Dövlət Universiteti",
  "ADPU",
  "Xəzər Universiteti",
  "Bakı Mühəndislik Universiteti",
  "Digər",
];

export const MAJORS = ["Computer Science","Software Engineering","Business Information Systems","Mathematics","Design","Marketing","Economics","Law","Medicine","Other"];

export function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m===1?"":"s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h===1?"":"s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d} day${d===1?"":"s"} ago`;
  const w = Math.floor(d / 7);
  if (w < 8) return `${w} week${w===1?"":"s"} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo===1?"":"s"} ago`;
}
