import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Textarea } from "./Input";
import { submitRating } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { useToast } from "./Toast";

const CATS = ["Communication","Timeliness","Technical Skill","Teamwork"] as const;

export function RatingModal({ open, onClose, name, projectName, toUserId, projectId, onSubmit }: {
  open: boolean;
  onClose: () => void;
  name: string;
  projectName: string;
  toUserId?: string;
  projectId?: string;
  onSubmit?: () => void;
}) {
  const [overall, setOverall] = useState(0);
  const [hover, setHover] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ Communication: 3, Timeliness: 3, "Technical Skill": 3, Teamwork: 3 });
  const [comment, setComment] = useState("");
  const { show } = useToast();
  const { user } = useAuth();
  const valid = overall > 0 && comment.length >= 20;

  const handleSubmit = async () => {
    if (!user || !toUserId || !projectId) return;
    await submitRating({
      fromUserId: user.id,
      toUserId,
      projectId,
      overall,
      communication: scores.Communication,
      timeliness: scores.Timeliness,
      technicalSkill: scores["Technical Skill"],
      teamwork: scores.Teamwork,
      comment,
    });
    show("Your rating has been saved!");
    onSubmit?.();
    onClose();
    setOverall(0);
    setComment("");
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="-m-2">
        <h2 className="text-white text-[20px]">Rate {name}</h2>
        <span className="inline-block mt-2 border border-[#2A2A2A] rounded-[999px] px-2.5 py-0.5 text-[12px] text-[#A1A1A1] font-[Proza_Libre]">{projectName} project</span>
        <div className="text-center my-7 flex justify-center gap-2" onMouseLeave={() => setHover(0)}>
          {[1,2,3,4,5].map(i => (
            <button key={i} onMouseEnter={() => setHover(i)} onClick={() => setOverall(i)} className="text-[44px] leading-none transition" style={{ color: (hover || overall) >= i ? "#FFFFFF" : "#2A2A2A" }}>★</button>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {CATS.map(cat => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-white text-[14px] font-[Proza_Libre] w-[120px]">{cat}</span>
              <input type="range" min={1} max={5} value={scores[cat]} onChange={e => setScores({ ...scores, [cat]: +e.target.value })} className="orbyt-slider flex-1" />
              <span className="text-white text-[14px] font-[Unbounded] w-5 text-right">{scores[cat]}</span>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Textarea rows={5} maxLength={500} placeholder="How was it working with this person?" value={comment} onChange={e => setComment(e.target.value)} />
          <p className="text-right text-[12px] mt-1 font-[Proza_Libre]" style={{ color: comment.length >= 450 ? "#FF6B6B" : "#A1A1A1" }}>{comment.length}/500</p>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="ghost" full onClick={onClose}>Cancel</Button>
          <Button full disabled={!valid} onClick={handleSubmit}>Submit</Button>
        </div>
      </div>
    </Modal>
  );
}
