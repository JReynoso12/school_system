"use client";

import { Search, Bell, MessageCircle, Settings } from "lucide-react";

interface HeaderProps {
  user?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const displayName = user?.email?.split("@")[0] ?? "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border px-8 py-4">
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search anything here..."
              className="w-full pl-4 pr-12 py-2.5 rounded-2xl border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition">
            <MessageCircle className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition">
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pl-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {initials}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role?.replace(/_/g, " ") ?? "Admin"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
