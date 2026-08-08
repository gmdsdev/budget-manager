import { useSubscriptionStatusQuery } from "@budget-manager/client/react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export function useSubscriptionGuard() {
  const navigate = useNavigate();
  const { data: status } = useSubscriptionStatusQuery();
  const locked = status ? !status.hasAccess : false;

  useEffect(() => {
    if (locked) {
      void navigate({ to: "/billing" });
    }
  }, [locked, navigate]);
}
