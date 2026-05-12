import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Avatar } from "./Avatar";
import { Textarea } from "./Input";
import { submitTeammateReview } from "@/lib/data";
import { useToast } from "./Toast";

export function TeammateReviewModal({ open, onClose, projectId, projectName, teammate, fromUserId }: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  teammate: { id: string; firstName: string; lastName: string };
  fromUserId: string;
}) {
  const { show } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState({
    communication: 0,
    timeliness: 0,
    technical_skill: 0,
    teamwork: 0,
  });
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (Object.values(ratings).some(r => r === 0)) {
      show("Please rate all categories");
      return;
    }

    setSubmitting(true);
    try {
      await submitTeammateReview({
        projectId,
        fromUserId,
        toUserId: teammate.id,
        communication: ratings.communication,
        timeliness: ratings.timeliness,
        technicalSkill: ratings.technical_skill,
        teamwork: ratings.teamwork,
        comment: comment.trim(),
      });
      show("Review submitted successfully!");
      onClose();
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        show("You've already reviewed this teammate for this project");
      } else {
        show("Failed to submit review");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { key: 'communication' as const, label: 'Communication', description: 'How well did they communicate?' },
    { key: 'timeliness' as const, label: 'Timeliness', description: 'Did they meet deadlines?' },
    { key: 'technical_skill' as const, label: 'Technical Skill', description: 'Quality of their work' },
    { key: 'teamwork' as const, label: 'Teamwork', description: 'How well did they collaborate?' },
  ];

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-white text-[24px] mb-2">Review Teammate</h2>
      <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] mb-6">
        Share your experience working with <span className="text-white">{teammate.firstName} {teammate.lastName}</span> on <span className="text-white">{projectName}</span>
      </p>

      <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1">
        {categories.map(cat => (
          <div key={cat.key}>
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-white text-[14px] font-[Proza_Libre]">{cat.label}</p>
                <p className="text-[#A1A1A1] text-[12px] font-[Proza_Libre]">{cat.description}</p>
              </div>
              <span className="text-white text-[16px]">{ratings[cat.key] || '-'}/5</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRatings({ ...ratings, [cat.key]: star })}
                  className={`w-10 h-10 rounded-[8px] border transition ${
                    ratings[cat.key] >= star
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                      : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#A1A1A1] hover:border-[#E2E2E2]'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="text-white text-[14px] font-[Proza_Libre] mb-2">Additional Comments (Optional)</p>
          <Textarea
            rows={4}
            placeholder="Share more details about your experience..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
          />
          <p className="text-right text-[11px] text-[#A1A1A1] mt-1 font-[Proza_Libre]">{comment.length}/500</p>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" full onClick={onClose}>Cancel</Button>
        <Button full onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </Modal>
  );
}
