import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Textarea } from "./Input";
import { submitProjectReview } from "@/lib/data";
import { useToast } from "./Toast";

export function ProjectReviewModal({ open, onClose, projectId, projectName, reviewerId }: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  reviewerId: string;
}) {
  const { show } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [reviewText, setReviewText] = useState("");

  const handleSubmit = async () => {
    if (!reviewText.trim()) {
      show("Please write a review");
      return;
    }

    setSubmitting(true);
    try {
      await submitProjectReview(projectId, reviewerId, reviewText.trim());
      show("Review submitted successfully!");
      setReviewText("");
      onClose();
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        show("You've already reviewed this project");
      } else {
        show("Failed to submit review");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-white text-[24px] mb-2">Review Project</h2>
      <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] mb-6">
        Share your thoughts about <span className="text-white">{projectName}</span>
      </p>

      <div>
        <p className="text-white text-[14px] font-[Proza_Libre] mb-2">Your Review</p>
        <Textarea
          rows={6}
          placeholder="What did you think of this project? How was your experience testing it?"
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          maxLength={1000}
        />
        <p className="text-right text-[11px] text-[#A1A1A1] mt-1 font-[Proza_Libre]">{reviewText.length}/1000</p>
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
