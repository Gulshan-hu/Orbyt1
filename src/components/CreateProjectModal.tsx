import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input, Textarea, FieldLabel } from "./Input";
import { SkillPicker } from "./SkillPicker";
import { createProjectWithSkills } from "@/lib/data";
import { useToast } from "./Toast";

export function CreateProjectModal({ open, onClose, captainId, onCreated }: {
  open: boolean; onClose: () => void; captainId: string; onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [have, setHave] = useState<string[]>([]);
  const [need, setNeed] = useState<{ skill: string; note?: string }[]>([]);
  const [link, setLink] = useState("");
  const { show } = useToast();

  const toggleHave = (s: string) => setHave(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleNeed = (s: string) => setNeed(p => p.find(n => n.skill === s) ? p.filter(n => n.skill !== s) : [...p, { skill: s }]);
  const setNote = (s: string, note: string) => setNeed(p => p.map(n => n.skill === s ? { ...n, note } : n));

  const create = async () => {
    if (!name.trim() || !description.trim()) {
      show("Please fill in project name and description");
      return;
    }

    await createProjectWithSkills({
      captainId,
      name: name.trim(),
      description: description.trim(),
      projectLink: link.trim() || undefined,
      have,
      need,
    });

    show("Project created successfully");
    onCreated();
    onClose();

    // Reset form
    setName("");
    setDescription("");
    setHave([]);
    setNeed([]);
    setLink("");
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] mb-5">Create New Project</h2>
      <div className="flex flex-col gap-3.5 max-h-[65vh] overflow-y-auto pr-1">
        <div><FieldLabel>Project name</FieldLabel><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. EduTrack, MealMate, CampusMap" /></div>
        <div>
          <FieldLabel>Description</FieldLabel>
          <Textarea rows={4} maxLength={300} value={description} onChange={e => setDescription(e.target.value)} placeholder="What does it do? Who is it for? What problem does it solve?" />
          <div className="text-[11px] text-[#A1A1A1] font-[Proza_Libre] mt-1 text-right">{description.length}/300</div>
        </div>
        <div><FieldLabel>Have skills</FieldLabel><SkillPicker selected={have} onToggle={toggleHave} /></div>
        <div>
          <FieldLabel>Need skills</FieldLabel>
          <SkillPicker selected={need.map(n => n.skill)} onToggle={toggleNeed} />
          {need.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {need.map(n => (
                <div key={n.skill}>
                  <div className="text-[12px] text-[#E2E2E2] font-[Proza_Libre] mb-1">Note for {n.skill}</div>
                  <Textarea rows={2} value={n.note || ""} onChange={e => setNote(n.skill, e.target.value)} placeholder="Optional note..." />
                </div>
              ))}
            </div>
          )}
        </div>
        <div><FieldLabel>Project link (optional)</FieldLabel><Input value={link} onChange={e => setLink(e.target.value)} placeholder="GitHub, Figma, or any other link" /></div>
      </div>
      <div className="flex gap-2 mt-6">
        <Button variant="ghost" full onClick={onClose}>Cancel</Button>
        <Button full onClick={create} disabled={!name.trim() || !description.trim()}>Create Project</Button>
      </div>
    </Modal>
  );
}
