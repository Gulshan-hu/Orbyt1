import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input, Textarea, FieldLabel } from "./Input";
import { SkillPicker } from "./SkillPicker";
import { updateProject, deleteProject, type OrbytProject } from "@/lib/data";
import { useToast } from "./Toast";

export function EditProjectModal({ open, onClose, project, onSaved, onDeleted }: {
  open: boolean; onClose: () => void; project: OrbytProject; onSaved: () => void; onDeleted: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [have, setHave] = useState<string[]>(project.skillsHave);
  const [need, setNeed] = useState<{ skill: string; note?: string }[]>(project.skillsNeed);
  const [link, setLink] = useState(project.projectLink || "");
  const [confirming, setConfirming] = useState(false);
  const { show } = useToast();

  const toggleHave = (s: string) => setHave(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleNeed = (s: string) => setNeed(p => p.find(n => n.skill === s) ? p.filter(n => n.skill !== s) : [...p, { skill: s }]);
  const setNote = (s: string, note: string) => setNeed(p => p.map(n => n.skill === s ? { ...n, note } : n));

  const save = async () => {
    await updateProject(project.id, {
      name: name.trim() || project.name,
      description: description.slice(0, 300),
      projectLink: link.trim() || undefined,
      have,
      need,
    });
    show("Project saved");
    onSaved();
    onClose();
  };

  const del = async () => {
    await deleteProject(project.id);
    show("Project deleted");
    onDeleted();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] mb-5">Edit Project</h2>
      <div className="flex flex-col gap-3.5 max-h-[65vh] overflow-y-auto pr-1">
        <div><FieldLabel>Project name</FieldLabel><Input value={name} onChange={e => setName(e.target.value)} /></div>
        <div>
          <FieldLabel>Description</FieldLabel>
          <Textarea rows={4} maxLength={300} value={description} onChange={e => setDescription(e.target.value)} />
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
        <div><FieldLabel>Project link</FieldLabel><Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://github.com/..." /></div>
      </div>
      <div className="flex gap-2 mt-6">
        <Button variant="ghost" full onClick={onClose}>Cancel</Button>
        <Button full onClick={save}>Save Changes</Button>
      </div>
      <div className="border-t border-[#2A2A2A] mt-5 pt-4">
        {!confirming ? (
          <Button variant="danger" full onClick={() => setConfirming(true)}>Delete Project</Button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[#A1A1A1] text-[13px] font-[Proza_Libre] text-center">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="ghost" full onClick={() => setConfirming(false)}>Cancel</Button>
              <Button variant="danger" full onClick={del}>Yes, delete</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
