"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  School,
  Users,
  BookOpen,
  ClipboardList,
  GraduationCap,
  FileText,
  Settings,
  Rocket,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarProps {
  variant: "admin" | "teacher" | "student" | "parent";
}

const navItems: Record<string, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/schools", label: "Schools", icon: School },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
    { href: "/admin/academic-years", label: "Academic Years", icon: GraduationCap },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
  teacher: [
    { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teacher/exams", label: "Exams", icon: ClipboardList },
    { href: "/teacher/question-bank", label: "Question Bank", icon: BookOpen },
    { href: "/teacher/grades", label: "Grades", icon: GraduationCap },
    { href: "/teacher/sections", label: "Sections", icon: Users },
  ],
  student: [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/exams", label: "My Exams", icon: ClipboardList },
    { href: "/student/grades", label: "Grades", icon: GraduationCap },
    { href: "/student/transcript", label: "Transcript", icon: FileText },
  ],
  parent: [
    { href: "/parent", label: "Dashboard", icon: LayoutDashboard },
    { href: "/parent/children", label: "Children", icon: Users },
    { href: "/parent/grades", label: "Grades", icon: GraduationCap },
  ],
};

export function Sidebar({ variant }: SidebarProps) {
  const pathname = usePathname();
  const items = navItems[variant] ?? [];

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col shadow-soft">
      <div className="bg-primary px-6 py-6 rounded-br-2xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <School className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white">Schoooli</span>
        </Link>
        <p className="text-xs text-white/80 mt-2 capitalize">{variant}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 space-y-3">
        <div className="rounded-2xl bg-primary/10 p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Unlock advanced features
          </p>
          <button className="w-full py-2 px-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition">
            Upgrade
          </button>
        </div>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition text-left font-medium"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
