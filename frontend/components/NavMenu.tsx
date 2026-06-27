"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NavAuth } from "@/components/NavAuth";

type Item = { href: string; label: string };
type Group = { label: string; items: Item[] };

/** Eleven flat links regrouped into the four intents a reader actually moves between. */
const GROUPS: Group[] = [
  {
    label: "Read",
    items: [
      { href: "/reader", label: "Reader" },
      { href: "/explore", label: "Explore" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    label: "Isnad",
    items: [
      { href: "/narrator", label: "Rijal (Narrators)" },
      { href: "/analyze/network", label: "Global network" },
      { href: "/isnad/path", label: "Path between narrators" },
      { href: "/isnad/compare", label: "Compare chains" },
    ],
  },
  {
    label: "Analyze",
    items: [
      { href: "/analyze/word", label: "Word frequency" },
      { href: "/analyze/grades", label: "Grade distribution" },
    ],
  },
];

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function NavMenu() {
  const pathname = usePathname() ?? "";
  const [openMobile, setOpenMobile] = useState(false);

  return (
    <div className="flex items-center gap-1 text-sm text-ivory/80">
      {/* Desktop: grouped flyout menus */}
      <div className="hidden items-center gap-1 sm:flex">
        {GROUPS.map((group) => {
          const groupActive = group.items.some((i) => isActive(pathname, i.href));
          return (
            <div key={group.label} className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={`rounded-lg px-3 py-1.5 transition hover:text-amber-node focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-node ${
                  groupActive ? "text-amber-node" : ""
                }`}
              >
                {group.label}
                <span aria-hidden className="ml-1 text-[10px] opacity-60">
                  ▾
                </span>
              </button>
              <div className="invisible absolute left-0 top-full z-30 min-w-[14rem] -translate-y-1 pt-1 opacity-0 transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-indigo-navy shadow-xl">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-2 hover:bg-white/5 hover:text-amber-node ${
                        isActive(pathname, item.href) ? "text-amber-node" : "text-ivory/80"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        <Link
          href="/dashboard"
          className={`rounded-lg px-3 py-1.5 hover:text-amber-node ${
            isActive(pathname, "/dashboard") ? "text-amber-node" : ""
          }`}
        >
          Dashboard
        </Link>
        <span className="px-2">
          <NavAuth />
        </span>
      </div>

      {/* Mobile: single collapsible menu */}
      <button
        type="button"
        onClick={() => setOpenMobile((v) => !v)}
        aria-expanded={openMobile}
        aria-label="Toggle navigation menu"
        className="rounded-lg px-3 py-1.5 hover:text-amber-node sm:hidden"
      >
        {openMobile ? "✕ Close" : "☰ Menu"}
      </button>
      {openMobile && (
        <div className="absolute inset-x-0 top-full z-30 border-b border-white/10 bg-indigo-navy px-6 py-4 sm:hidden">
          <div className="space-y-4">
            {GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1 text-xs uppercase tracking-wide text-ivory/40">
                  {group.label}
                </p>
                <div className="flex flex-col">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenMobile(false)}
                      className={`py-1.5 ${
                        isActive(pathname, item.href) ? "text-amber-node" : "text-ivory/80"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <Link
                href="/dashboard"
                onClick={() => setOpenMobile(false)}
                className={isActive(pathname, "/dashboard") ? "text-amber-node" : "text-ivory/80"}
              >
                Dashboard
              </Link>
              <NavAuth />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
