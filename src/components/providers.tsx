"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import QueryProvider from "./QueryProvider";
import { ToastContainer } from "./ui/Toast";

function SessionHydrator({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { login, logout, setLoading } = useAuthStore();

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      login("", {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        role: session.user.role as "VIEWER" | "SCORER" | "TOURNAMENT_ADMIN" | "SUPER_ADMIN",
        password: null,
        phone: null,
        bio: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      logout();
    }
  }, [session, status, login, logout, setLoading]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        <SessionHydrator>{children}</SessionHydrator>
        <ToastContainer />
      </SessionProvider>
    </QueryProvider>
  );
}
