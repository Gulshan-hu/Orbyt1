import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/ratings")({
  component: () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    useEffect(() => {
      if (!loading) {
        if (!user) navigate({ to: "/login" });
        else navigate({ to: "/profile/$userId", params: { userId: user.id }, replace: true });
      }
    }, [user, loading, navigate]);
    return null;
  },
});
