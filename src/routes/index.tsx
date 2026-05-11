import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({ component: Index });

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const ROW1 = ["Python","React","Figma","Supabase","Machine Learning","iOS Dev","UI/UX Design","PostgreSQL","Flutter","TypeScript"];
const ROW2 = ["Node.js","Data Science","Blender","Unity","Android Dev","Docker","GraphQL","Cybersecurity","Vue.js","Arduino"];

function SkillPill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex flex-shrink-0 bg-[#1A1A1A] border border-[#2A2A2A] rounded-[999px] px-[22px] py-2.5 text-[14px] text-[#E2E2E2] font-[Proza_Libre]">{children}</span>;
}

function Index() {
  const navigate = useNavigate();

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: "url(/noise.png)", opacity: 0.04 }} />
        <div className="relative z-10 flex flex-col items-center">
          <motion.span {...fadeUp(0)} className="inline-flex border border-[#2A2A2A] bg-[#1A1A1A] rounded-[999px] px-4 py-1.5 text-[12px] text-[#A1A1A1] mb-6">
            Beta — For Students
          </motion.span>
          <motion.h1 {...fadeUp(0.1)} className="font-[Unbounded] text-white text-center leading-[1.1] max-w-[800px] whitespace-pre-line"
            style={{ fontSize: "clamp(36px, 6vw, 72px)" }}>
            {"Find the right team.\nFind the right project."}
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="text-[#A1A1A1] text-center max-w-[560px] mt-5 text-[18px] font-[Proza_Libre]">
            Orbyt matches university students with each other based on their skills and project needs.
          </motion.p>
          <motion.div {...fadeUp(0.3)} className="flex gap-3 mt-10 flex-wrap justify-center">
            <Button onClick={() => navigate({ to: "/signup" })}>Get Started</Button>
            <Button variant="ghost" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>How it works?</Button>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-[120px] bg-black">
        <h2 className="text-center text-white mb-16" style={{ fontSize: 36 }}>How it works</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto px-6">
          {[
            { n: "01", t: "Create your profile", d: "Select your skills and add any project you're working on. Show what you know and what you need." },
            { n: "02", t: "Find the right people", d: "The algorithm finds the most compatible teammates based on your skills and your project's needs." },
            { n: "03", t: "Build together", d: "Connect, grow the project together, and rate your teammates once the work is done." },
          ].map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-8">
              <div className="text-[#2A2A2A] mb-5" style={{ fontFamily: "Unbounded", fontSize: 48 }}>{s.n}</div>
              <h3 className="text-white text-[20px] mb-3">{s.t}</h3>
              <p className="text-[#A1A1A1] text-[15px] leading-[1.6] font-[Proza_Libre]">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SKILL SHOWCASE */}
      <section className="py-20 bg-black overflow-hidden">
        <h2 className="text-center text-white mb-12" style={{ fontSize: 32 }}>There's a place for every skill</h2>
        <div className="overflow-hidden mb-3">
          <div className="flex gap-3 w-max animate-marquee-left">
            {[...ROW1, ...ROW1].map((s, i) => <SkillPill key={i}>{s}</SkillPill>)}
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="flex gap-3 w-max animate-marquee-right">
            {[...ROW2, ...ROW2].map((s, i) => <SkillPill key={i}>{s}</SkillPill>)}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0A0A] border-t border-[#2A2A2A] py-10 px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 text-white"><Logo height={24} /><span className="text-[#A1A1A1] text-[13px] font-[Proza_Libre]">© 2025 Orbyt</span></div>
        <div className="flex gap-6 text-[13px] font-[Proza_Libre]">
          {["About","Terms","Privacy"].map(l => <a key={l} href="#" className="text-[#A1A1A1] hover:text-white transition">{l}</a>)}
        </div>
      </footer>
    </div>
  );
}
