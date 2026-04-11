"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, UserButton } from "@clerk/nextjs";

type NavItem = {
  href: string;
  label: string;
  iconPath: string;
};

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    iconPath: "M4.5 5.25h6v6h-6zM13.5 5.25h6v3h-6zM13.5 9.75h6v7.5h-6zM4.5 12.75h6v4.5h-6z",
  },
  {
    href: "/dashboard/new",
    label: "New Meeting",
    iconPath: "M12 6v12M6 12h12M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    iconPath:
      "M4.5 6h15M4.5 12h15M4.5 18h15M9 4.5v3M15 10.5v3M12 16.5v3",
  },
] satisfies NavItem[];

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 shrink-0"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-800/80 bg-black/85 backdrop-blur lg:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/70 text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            <span className="sr-only">
              {isMobileOpen ? "Close navigation" : "Open navigation"}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              {isMobileOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4.5 7.5h15M4.5 12h15M4.5 16.5h15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>

          <Link href="/dashboard" className="inline-flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-sm font-bold text-indigo-200 ring-1 ring-indigo-400/30">
              AI
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-100">Meeting Notes</p>
              <p className="text-[11px] text-zinc-500">Dashboard</p>
            </div>
          </Link>

          <div className="rounded-full border border-zinc-700 p-0.5">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-30 bg-black/75 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-800/80 bg-zinc-950/95 backdrop-blur transition-transform duration-200 lg:z-40 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-800/80 px-5">
          <Link href="/dashboard" className="inline-flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-sm font-bold text-indigo-200 ring-1 ring-indigo-400/30">
              AI
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-100">Meeting Notes</p>
              <p className="text-[11px] text-zinc-500">Intelligence workspace</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/70 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100 lg:hidden"
          >
            <span className="sr-only">Close navigation</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-indigo-400/35 bg-indigo-500/15 text-indigo-100 shadow-[0_0_0_1px_rgba(99,102,241,0.15)_inset]"
                    : "border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-100"
                }`}
              >
                <NavIcon path={item.iconPath} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800/80 p-4">
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/55 p-3">
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />
              <div>
                <p className="text-xs text-zinc-500">Signed in</p>
                <p className="text-sm font-medium text-zinc-200">Account settings</p>
              </div>
            </div>
            <SignOutButton>
              <button className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200">
                Log out
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>
    </>
  );
}
