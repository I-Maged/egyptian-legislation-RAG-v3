"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { signOut } from "@/app/actions/auth";

import { useUser } from "./user-provider";

export type NavbarAction = {
  onClick: () => void;
  disabled?: boolean;
} | null;

export type NavbarToggle = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
} | null;

const NavbarSetterContext = createContext<(action: NavbarAction) => void>(
  () => {},
);

const NavbarActionContext = createContext<NavbarAction>(null);

const NavbarToggleSetterContext = createContext<(toggle: NavbarToggle) => void>(
  () => {},
);

const NavbarToggleContext = createContext<NavbarToggle>(null);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<NavbarAction>(null);
  const [toggle, setToggle] = useState<NavbarToggle>(null);

  return (
    <NavbarActionContext.Provider value={action}>
      <NavbarSetterContext.Provider value={setAction}>
        <NavbarToggleContext.Provider value={toggle}>
          <NavbarToggleSetterContext.Provider value={setToggle}>
            {children}
          </NavbarToggleSetterContext.Provider>
        </NavbarToggleContext.Provider>
      </NavbarSetterContext.Provider>
    </NavbarActionContext.Provider>
  );
}

/**
 * Lets a page control the navbar's action button (e.g. "new chat").
 * Pass null to fall back to the default link behavior.
 */
export function useNavbarAction(action: NavbarAction) {
  const setAction = useContext(NavbarSetterContext);
  const onClick = action?.onClick;
  const disabled = action?.disabled;

  useEffect(() => {
    if (!onClick) return;

    setAction({ onClick, disabled });

    return () => setAction(null);
  }, [setAction, onClick, disabled]);
}

/**
 * Lets a page register a secondary toggle button (e.g. conversations sidebar).
 * Pass null to hide the button.
 */
export function useNavbarSecondaryToggle(toggle: NavbarToggle) {
  const setToggle = useContext(NavbarToggleSetterContext);
  const onClick = toggle?.onClick;
  const active = toggle?.active;
  const disabled = toggle?.disabled;

  useEffect(() => {
    if (!onClick) return;

    setToggle({ onClick, active, disabled });

    return () => setToggle(null);
  }, [setToggle, onClick, active, disabled]);
}

export default function Navbar() {
  const action = useContext(NavbarActionContext);
  const secondaryToggle = useContext(NavbarToggleContext);
  const { user } = useUser();

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">ق</div>
        <div>
          <div className="brand-title">المساعد القانوني المصري</div>
          <div className="brand-subtitle">
            محادثة تجريبية للتشريعات المصرية
          </div>
        </div>
      </div>
      <div className="nav-actions">
        {secondaryToggle && (
          <button
            type="button"
            className={`sidebar-nav-toggle${
              secondaryToggle.active ? " sidebar-nav-toggle--active" : ""
            }`}
            aria-expanded={secondaryToggle.active ?? false}
            onClick={secondaryToggle.onClick}
            disabled={secondaryToggle.disabled}
          >
            المحادثات
          </button>
        )}
        {action ? (
          <button
            className="new-chat"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            محادثة جديدة
          </button>
        ) : (
          <Link href="/" className="new-chat">
            محادثة جديدة
          </Link>
        )}
        {user ? (
          <>
            <span className="nav-user" title={user.email}>
              {user.name ?? user.email}
              <span className="nav-user-role">
                {user.role === "ADMIN" ? "مسؤول" : "مستخدم"}
              </span>
            </span>
            <form action={signOut}>
              <button type="submit" className="auth-btn auth-btn--secondary">
                تسجيل الخروج
              </button>
            </form>
          </>
        ) : (
          <Link href="/sign-in" className="auth-btn">
            تسجيل الدخول
          </Link>
        )}
      </div>
    </header>
  );
}
