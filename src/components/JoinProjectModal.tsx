import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Tag } from "./Tag";
import { sendConnectionRequest } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { useToast } from "./Toast";

export function JoinProjectModal({ open, onClose, projectName, projectId, captainId, skillsNeeded }: {
  open: boolean;
  onClose: () => void;
  projectName: string;
  projectId: string;
  captainId: string;
  skillsNeeded: { skill: string; note?: string }[];
}) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const { show } = useToast();
  const { user } = useAuth();

  const handleSend = async () => {
    if (!user || !selectedSkill) return;
    try {
      await sendConnectionRequest({
        fromUserId: user.id,
        toUserId: captainId,
        projectId: projectId,
        message: `I'd like to join as: ${selectedSkill}`,
      });
      show("Join request sent!");
      onClose();
      setSelectedSkill(null);
    } catch (error: any) {
      console.error("Join request error:", error);
      if (error?.message?.includes("duplicate") || error?.code === "23505") {
        show("Join request already sent");
      } else {
        show("Failed to send join request");
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] mb-3">Join {projectName}</h2>
      <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] mb-6">
        Select which skill you want to contribute with:
      </p>
      {skillsNeeded.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre]">
            This project doesn't have any needed skills listed yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {skillsNeeded.map((item) => (
            <button
              key={item.skill}
              onClick={() => setSelectedSkill(item.skill)}
              className={`text-left p-4 rounded-[12px] border transition ${
                selectedSkill === item.skill
                  ? "border-white bg-[#2A2A2A]"
                  : "border-[#2A2A2A] hover:border-[#E2E2E2]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Tag small static>{item.skill}</Tag>
                {selectedSkill === item.skill && <span className="text-white">✓</span>}
              </div>
              {item.note && (
                <p className="text-[#A1A1A1] text-[12px] font-[Proza_Libre] mt-2">
                  {item.note}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-6">
        <Button variant="ghost" full onClick={onClose}>Cancel</Button>
        <Button full onClick={handleSend} disabled={!selectedSkill || skillsNeeded.length === 0}>Send Request</Button>
      </div>
    </Modal>
  );
}
