import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, Trophy, Settings, LogOut, Code2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { clsx } from "clsx";
import { ChatWidget } from "./chat-widget";
import { useLogout } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/courses", icon: BookOpen, label: "Courses" },
  { href: "/achievements", icon: Trophy, label: "Achievements" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
      }
    });
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-background overflow-hidden">
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:opacity-90 transition-opacity">
            <Code2 className="h-6 w-6" />
            <span className="font-bold text-lg text-foreground tracking-tight">LearnFlow</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase()}`}>
                <div className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-muted"
              data-testid="button-sidebar-logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-background">
        <div className="md:hidden h-16 border-b border-border bg-card flex items-center px-4 justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary">
            <Code2 className="h-6 w-6" />
            <span className="font-bold text-lg text-foreground tracking-tight">LearnFlow</span>
          </Link>
        </div>
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>

      <ChatWidget />
    </div>
  );
}
