import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { Input, Textarea, Select, FieldLabel } from "@/components/Input";
import { Tag } from "@/components/Tag";
import { Logo } from "@/components/Logo";
import { SKILL_CATEGORIES, UNIVERSITIES, MAJORS } from "@/lib/constants";
import { setUserSkills, createProjectWithSkills } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

interface FormData {
  firstName: string;
  lastName: string;
  university: string;
  major: string;
  skills: string[];
  hasProject: boolean | null;
  projectName: string;
  projectDesc: string;
  projectHave: string[];
  projectNeed: string[];
  projectNeedNotes: Record<string, string>;
  projectLink: string;
}

const STEP_NAMES = ["Your Info", "University & Major", "Skills", "Project?", "Project Details", "You're ready!"];

function Progress({ step }: { step: number }) {
  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-black border-b border-[#2A2A2A] py-6">
      <div className="flex items-center justify-center gap-2 max-w-md mx-auto px-6">
        {STEP_NAMES.map((_, i) => {
          const idx = i + 1;
          const active = idx === step, done = idx < step;
          return (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`rounded-full ${active ? "w-2.5 h-2.5 bg-white" : done ? "w-2 h-2 bg-white" : "w-2 h-2 bg-[#2A2A2A]"}`} />
              {i < STEP_NAMES.length - 1 && <div className={`flex-1 h-px ${done ? "bg-white" : "bg-[#2A2A2A]"}`} />}
            </div>
          );
        })}
      </div>
      <p className="text-center text-[#A1A1A1] text-[13px] mt-3 font-[Proza_Libre]">{STEP_NAMES[step - 1]}</p>
    </div>
  );
}

function SkillSelector({ selected, onToggle, search }: { selected: string[]; onToggle: (s: string) => void; search: string }) {
  const q = search.toLowerCase();
  return (
    <div className="flex flex-col gap-6">
      {Object.entries(SKILL_CATEGORIES).map(([cat, skills]) => {
        const filtered = q ? skills.filter(s => s.toLowerCase().includes(q)) : skills;
        if (!filtered.length) return null;
        return (
          <div key={cat}>
            <h4 className="uppercase text-[12px] tracking-[0.1em] text-[#A1A1A1] mb-2.5 font-[Proza_Libre]">{cat}</h4>
            <div className="flex flex-wrap gap-2">
              {filtered.map(s => <Tag key={s} small selected={selected.includes(s)} onClick={() => onToggle(s)}>{s}</Tag>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepFooter({ onBack, right }: { onBack?: () => void; right: React.ReactNode }) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      {onBack ? <Button variant="ghost" onClick={onBack}>Back</Button> : <span />}
      <div className="flex items-center gap-3">{right}</div>
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [data, setData] = useState<FormData>({
    firstName: "",
    lastName: "",
    university: "",
    major: "",
    skills: [],
    hasProject: null,
    projectName: "",
    projectDesc: "",
    projectHave: [],
    projectNeed: [],
    projectNeedNotes: {},
    projectLink: "",
  });
  const [skillSearch, setSkillSearch] = useState("");
  const [haveSearch, setHaveSearch] = useState("");
  const [needSearch, setNeedSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;

      setCheckingProfile(true);

      // Fetch user profile and skills
      const [{ data: profile }, { data: userSkills }] = await Promise.all([
        supabase.from('users').select('first_name, last_name, university, major').eq('id', user.id).single(),
        supabase.from('user_skills').select('skill').eq('user_id', user.id),
      ]);

      // If user has skills, they've completed onboarding
      if (userSkills && userSkills.length > 0) {
        navigate({ to: "/dashboard" });
        return;
      }

      // Pre-fill data from Google OAuth if available
      if (profile) {
        setData(d => ({
          ...d,
          firstName: profile.first_name || user.user_metadata?.first_name || "",
          lastName: profile.last_name || user.user_metadata?.last_name || "",
          university: profile.university || "",
          major: profile.major || "",
        }));
      }

      setCheckingProfile(false);
    };

    if (user && !authLoading) {
      checkProfile();
    }
  }, [user, authLoading, navigate]);

  const update = <K extends keyof FormData>(k: K, v: FormData[K]) => setData(d => ({ ...d, [k]: v }));
  const toggleSkill = (s: string) => update("skills", data.skills.includes(s) ? data.skills.filter(x => x !== s) : [...data.skills, s]);
  const toggleHave = (s: string) => update("projectHave", data.projectHave.includes(s) ? data.projectHave.filter(x => x !== s) : [...data.projectHave, s]);
  const toggleNeed = (s: string) => update("projectNeed", data.projectNeed.includes(s) ? data.projectNeed.filter(x => x !== s) : [...data.projectNeed, s]);

  const step1Valid = data.firstName.trim() && data.lastName.trim();
  const step2Valid = data.university && data.major;
  const step5Valid = data.projectName.trim() && data.projectDesc.trim();

  const handleFinish = async () => {
    if (!user) return;

    // Update user metadata with all fields
    await supabase.auth.updateUser({
      data: {
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        university: data.university,
        major: data.major,
      },
    });

    // Update users table directly
    await supabase
      .from('users')
      .update({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        university: data.university,
        major: data.major,
      })
      .eq('id', user.id);

    // Set user skills
    await setUserSkills(user.id, data.skills);

    // Create project if user has one
    if (data.hasProject && data.projectName.trim() && data.projectDesc.trim()) {
      const needWithNotes = data.projectNeed.map(skill => ({
        skill,
        note: data.projectNeedNotes[skill] || undefined,
      }));
      await createProjectWithSkills({
        captainId: user.id,
        name: data.projectName.trim(),
        description: data.projectDesc.trim(),
        projectLink: data.projectLink.trim() || undefined,
        have: data.projectHave,
        need: needWithNotes,
      });
    }

    navigate({ to: "/dashboard" });
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      {checkingProfile ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-[#A1A1A1] font-[Proza_Libre]">Loading...</p>
          </div>
        </div>
      ) : (
        <>
          <Progress step={step} />
          <div className="min-h-screen flex items-center justify-center px-6 pt-[200px] pb-20">
            <div className="w-full max-w-[500px]">
              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-10">

              {step === 1 && (
                <>
                  <h2 className="text-white text-[24px] mb-2">Welcome! Let's get started</h2>
                  <p className="text-[#A1A1A1] text-[15px] font-[Proza_Libre] mb-8">Tell us your name to complete your profile.</p>
                  <div className="flex flex-col gap-5">
                    <div>
                      <FieldLabel>First name</FieldLabel>
                      <Input placeholder="Alex" value={data.firstName} onChange={e => update("firstName", e.target.value)} />
                    </div>
                    <div>
                      <FieldLabel>Last name</FieldLabel>
                      <Input placeholder="Johnson" value={data.lastName} onChange={e => update("lastName", e.target.value)} />
                    </div>
                    <StepFooter right={<Button disabled={!step1Valid} onClick={() => setStep(2)}>Continue</Button>} />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="text-white text-[24px] mb-2">Tell us about yourself</h2>
                  <p className="text-[#A1A1A1] text-[15px] font-[Proza_Libre] mb-8">We need a few more details to complete your profile.</p>
                  <div className="flex flex-col gap-5">
                    <div>
                      <FieldLabel>University</FieldLabel>
                      <Select value={data.university} onChange={e => update("university", e.target.value)}>
                        <option value="">Select your university</option>
                        {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                      </Select>
                    </div>
                    <div>
                      <FieldLabel>Major</FieldLabel>
                      <Select value={data.major} onChange={e => update("major", e.target.value)}>
                        <option value="">Select your major</option>
                        {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
                      </Select>
                    </div>
                    <StepFooter onBack={() => setStep(1)} right={<Button disabled={!step2Valid} onClick={() => setStep(3)}>Continue</Button>} />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="text-white text-[24px] mb-2">Select your skills</h2>
                  <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] mb-6">Check everything you know — the more the better.</p>
                  <Input placeholder="Search for a skill..." value={skillSearch} onChange={e => setSkillSearch(e.target.value)} />
                  <div className="mt-6 max-h-[420px] overflow-y-auto thin-scroll pr-2">
                    <SkillSelector selected={data.skills} onToggle={toggleSkill} search={skillSearch} />
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                    <div className="flex items-center gap-3">
                      <span className="text-[#A1A1A1] text-[13px] font-[Proza_Libre]">{data.skills.length} selected</span>
                      <Button disabled={data.skills.length === 0} onClick={() => setStep(4)}>Continue</Button>
                    </div>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h2 className="text-white text-[24px] mb-8">Do you have a project you're working on?</h2>
                  <div className="flex flex-col gap-4">
                    {[
                      { key: true, t: "Yes, I have a project", s: "Find teammates, share ideas" },
                      { key: false, t: "Not yet", s: "Join existing projects and apply your skills" },
                    ].map(opt => (
                      <button key={String(opt.key)}
                        onClick={() => { update("hasProject", opt.key); setStep(opt.key ? 5 : 6); }}
                        className={`text-left bg-[#111111] border rounded-[16px] p-7 transition hover:border-[#E2E2E2] ${data.hasProject === opt.key ? "border-white bg-[#1A1A1A]" : "border-[#2A2A2A]"}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-white text-[16px] font-[Unbounded]">{opt.t}</div>
                            <div className="text-[#A1A1A1] text-[13px] font-[Proza_Libre] mt-1">{opt.s}</div>
                          </div>
                          <span className="text-white text-2xl">→</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <StepFooter onBack={() => setStep(3)} right={null} />
                </>
              )}

              {step === 5 && (
                <>
                  <h2 className="text-white text-[24px] mb-6">Tell us about your project</h2>
                  <div className="flex flex-col gap-5">
                    <div><FieldLabel>Project name</FieldLabel><Input placeholder="e.g. EduTrack, MealMate, CampusMap" value={data.projectName} onChange={e => update("projectName", e.target.value)} /></div>
                    <div>
                      <FieldLabel>Describe your project in a few sentences</FieldLabel>
                      <Textarea rows={4} maxLength={300} placeholder="What does it do? Who is it for? What problem does it solve?" value={data.projectDesc} onChange={e => update("projectDesc", e.target.value)} />
                      <p className="text-right text-[12px] text-[#A1A1A1] mt-1 font-[Proza_Libre]">{data.projectDesc.length}/300</p>
                    </div>
                    <div>
                      <FieldLabel>What's already in the team?</FieldLabel>
                      <Input placeholder="Search skills..." value={haveSearch} onChange={e => setHaveSearch(e.target.value)} />
                      <div className="mt-3 max-h-[200px] overflow-y-auto thin-scroll pr-2">
                        <SkillSelector selected={data.projectHave} onToggle={toggleHave} search={haveSearch} />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>What do you need?</FieldLabel>
                      <Input placeholder="Search skills..." value={needSearch} onChange={e => setNeedSearch(e.target.value)} />
                      <div className="mt-3 max-h-[200px] overflow-y-auto thin-scroll pr-2">
                        <SkillSelector selected={data.projectNeed} onToggle={toggleNeed} search={needSearch} />
                      </div>
                      <AnimatePresence>
                        {data.projectNeed.map(s => (
                          <motion.div key={s} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-3">
                            <FieldLabel>{s} — any specific requirements? (optional)</FieldLabel>
                            <Textarea rows={2} placeholder="e.g. Need a backend dev who knows Supabase and can write RLS policies"
                              value={data.projectNeedNotes[s] || ""}
                              onChange={e => update("projectNeedNotes", { ...data.projectNeedNotes, [s]: e.target.value })} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div><FieldLabel>Project link (optional)</FieldLabel><Input placeholder="GitHub, Figma, or any other link" value={data.projectLink} onChange={e => update("projectLink", e.target.value)} /></div>
                    <StepFooter
                      onBack={() => setStep(4)}
                      right={<Button disabled={!step5Valid} onClick={() => setStep(6)}>Continue</Button>}
                    />
                  </div>
                </>
              )}

              {step === 6 && (
                <div className="text-center py-5">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [0.8, 1.1, 1], opacity: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex justify-center text-white"><Logo height={64} /></motion.div>
                  <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
                    width="40" height="40" viewBox="0 0 40 40" className="mx-auto mt-5">
                    <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="2" fill="none"/>
                    <motion.path d="M12 20l6 6 12-12" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.7 }}/>
                  </motion.svg>
                  <h2 className="text-white text-[32px] mt-7">You're all set!</h2>
                  <p className="text-[#A1A1A1] text-[16px] font-[Proza_Libre] max-w-[360px] mx-auto mt-3">The algorithm is now finding the most compatible projects and teammates for you.</p>
                  <div className="mt-9"><Button onClick={handleFinish} className="min-w-[200px]">Go to Dashboard</Button></div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
