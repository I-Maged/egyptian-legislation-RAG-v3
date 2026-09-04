"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { SessionUser } from "@/lib/auth/types";

type UserContextValue = {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  isLoading: boolean;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
  isLoading: false,
});

export function UserProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: SessionUser | null;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(initialUser === null);
  const pathname = usePathname();

  useEffect(() => {
    if (initialUser) {
      return;
    }

    let cancelled = false;

    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((fetchedUser: SessionUser | null) => {
        if (!cancelled) {
          setUser(fetchedUser);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // Re-sync the session on every soft navigation (e.g. after sign-in/out
    // redirects) since this provider lives in the root layout and never
    // remounts.
  }, [pathname, initialUser]);

  const value = useMemo(
    () => ({ user, setUser, isLoading }),
    [user, isLoading],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
