"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, CalendarClock, BarChart2, Settings } from "lucide-react";

type NavItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active?: boolean;
};

function NavItem({ icon: Icon, label, href, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-1 rounded-full px-2 py-1 text-[0.7rem] ${
        active ? "text-[#3F3A33]" : "text-[#9A9184]"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          active
            ? "bg-[color:var(--sage-soft)]/70 text-[#3F3A33]"
            : "bg-transparent"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="heading-serif tracking-tight">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  // Do not render bottom nav on the authentication page
  if (pathname?.includes("/auth")) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E0D7C7] bg-[#FDFBF7]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-around px-4 py-3 sm:px-6 lg:px-10 nav-safe-bottom">
        <NavItem
          icon={Sparkles}
          label="Today"
          href="/"
          active={pathname === "/"}
        />
        <NavItem
          icon={CalendarClock}
          label="History"
          href="/history"
          active={pathname === "/history"}
        />
        <NavItem
          icon={BarChart2}
          label="Insights"
          href="/insights"
          active={pathname === "/insights"}
        />
        <NavItem
          icon={Settings}
          label="Settings"
          href="/settings"
          active={pathname === "/settings"}
        />
      </div>
    </nav>
  );
}
