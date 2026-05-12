import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Tag } from "./Tag";
import { Avatar } from "./Avatar";
import { type OrbytProject } from "@/lib/data";
import { updateProjectStatus } from "@/lib/data";
import { useToast } from "./Toast";

export function ProjectDetailModal({ open, onClose, project, isCaptain, onConnect, onEdit, members, onStatusChange }: {
  open: boolean;
  onClose: () => void;
  project: OrbytProject;
  isCaptain: boolean;
  onConnect: () => void;
  onEdit: () => void;
  members?: Array<{ id: string; firstName: string; lastName: string; averageRating: number }>;
  onStatusChange?: () => void;
}) {
  const displayMembers = members || [];
  const { show } = useToast();
  const [changingStatus, setChangingStatus] = useState(false);

  const handleStatusChange = async (newStatus: 'looking_for_team' | 'in_progress' | 'done') => {
    setChangingStatus(true);
    try {
      await updateProjectStatus(project.id, newStatus);
      show(`Project status updated to ${newStatus.replace(/_/g, ' ')}`);
      onStatusChange?.();
      onClose();
    } catch (error) {
      show("Failed to update project status");
    } finally {
      setChangingStatus(false);
    }
  };

  const statusOptions: Array<{ value: 'looking_for_team' | 'in_progress' | 'done'; label: string; description: string }> = [
    { value: 'looking_for_team', label: 'Looking for Team', description: 'Actively seeking team members' },
    { value: 'in_progress', label: 'In Progress', description: 'Team is complete, working on the project' },
    { value: 'done', label: 'Done', description: 'Project completed, ready for showcase' },
  ];

  return (
    <Modal open={open} onClose={onClose}>
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div>
            <h2 className="text-white text-[24px] mb-1">{project.name}</h2>
            <p className="text-[#A1A1A1] text-[12px] font-[Proza_Libre]">{project.createdAt}</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#A1A1A1] text-[11px] font-[Proza_Libre]">Status:</span>
            <span className={`text-[13px] font-[Proza_Libre] ${
              project.status === 'done' ? 'text-green-400' :
              project.status === 'in_progress' ? 'text-yellow-400' :
              'text-blue-400'
            }`}>
              {project.status === 'looking_for_team' ? 'Looking for Team' :
               project.status === 'in_progress' ? 'In Progress' :
               'Done'}
            </span>
          </div>
        </div>

        {isCaptain && (
          <>
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-[12px] p-4 mb-4">
              <p className="text-white text-[14px] font-[Proza_Libre] mb-3">Change Project Status</p>
              <div className="flex flex-col gap-2">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={changingStatus || project.status === option.value}
                    className={`text-left p-3 rounded-[8px] border transition ${
                      project.status === option.value
                        ? 'bg-[#1A1A1A] border-white text-white'
                        : 'bg-[#0A0A0A] border-[#2A2A2A] text-[#A1A1A1] hover:border-[#E2E2E2]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-[13px] font-[Proza_Libre]">{option.label}</div>
                    <div className="text-[11px] text-[#A1A1A1] mt-0.5">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <p className="text-[#E2E2E2] text-[14px] font-[Proza_Libre] leading-[1.6] mt-4">{project.description}</p>

        <div className="border-t border-[#2A2A2A] my-5" />
        <div className="text-[12px] text-[#A1A1A1] font-[Proza_Libre] mb-1.5">✓ Have</div>
        <div className="flex flex-wrap gap-1.5">{project.skillsHave.map(s => <Tag key={s} small static>{s}</Tag>)}</div>

        <div className="text-[12px] text-[#A1A1A1] font-[Proza_Libre] mt-4 mb-1.5">✗ Need</div>
        <div className="flex flex-col gap-2">
          {project.skillsNeed.map(n => (
            <div key={n.skill}>
              <Tag small static>{n.skill}</Tag>
              {n.note && <p className="text-[#A1A1A1] text-[12px] font-[Proza_Libre] mt-1 ml-1">{n.note}</p>}
            </div>
          ))}
        </div>

        {displayMembers.length > 0 && (
          <>
            <div className="border-t border-[#2A2A2A] my-5" />
            <div className="text-[12px] text-[#A1A1A1] font-[Proza_Libre] mb-2">Team</div>
            <div className="flex flex-col gap-2">
              {displayMembers.map(m => {
                const n = `${m.firstName} ${m.lastName}`;
                return (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar name={n} size={28} />
                    <span className="text-white text-[13px] font-[Proza_Libre]">{n}</span>
                    {m.id === project.captainId && <span className="bg-[#2A2A2A] text-[#E2E2E2] rounded-[999px] px-2 py-0.5 text-[11px] font-[Proza_Libre]">Captain</span>}
                    <span className="text-[#A1A1A1] text-[12px] ml-auto">★ {m.averageRating}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {project.projectLink && (
          <>
            <div className="border-t border-[#2A2A2A] my-5" />
            <a href={project.projectLink} target="_blank" rel="noreferrer"
              className="text-white text-[13px] font-[Proza_Libre] underline break-all">{project.projectLink}</a>
          </>
        )}
      </div>
      <div className="flex gap-2 mt-6">
        <Button variant="ghost" full onClick={onClose}>Close</Button>
        {isCaptain
          ? <Button full onClick={onEdit}>Edit project</Button>
          : <Button full onClick={onConnect}>Connect →</Button>}
      </div>
    </Modal>
  );
}
