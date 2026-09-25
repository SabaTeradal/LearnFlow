import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, LogOut, Save, Loader2, User } from "lucide-react";
import { useUpdateProfile, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [theme, setTheme] = useState<"dark" | "light">(
    (user?.theme as "dark" | "light") ?? "dark"
  );

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setTheme((user.theme as "dark" | "light") ?? "dark");
    }
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const updateProfileMutation = useUpdateProfile();
  const logoutMutation = useLogout();

  const handleSave = () => {
    updateProfileMutation.mutate(
      { data: { name, email, theme } },
      {
        onSuccess: (updatedUser) => {
          updateUser(updatedUser);
          queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
          toast({ title: "Profile updated" });
        },
        onError: () => {
          toast({ title: "Failed to update profile", variant: "destructive" });
        },
      }
    );
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
      },
    });
  };

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AppLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 max-w-xl">
        <motion.div variants={itemVariants} className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your account and preferences.</p>
        </motion.div>

        {/* Profile Section */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground">{name}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Full name</Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                data-testid="input-settings-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                data-testid="input-settings-email"
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            size="sm"
            data-testid="button-save-profile"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save changes
          </Button>
        </motion.div>

        {/* Appearance */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-muted-foreground" />
            )}
            <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-muted-foreground">
                Currently using {theme} mode
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative h-7 w-13 rounded-full transition-all duration-300 focus:outline-none ${
                theme === "dark" ? "bg-primary" : "bg-muted"
              }`}
              style={{ width: "52px" }}
              data-testid="toggle-theme"
            >
              <motion.div
                animate={{ x: theme === "dark" ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm flex items-center justify-center"
              >
                {theme === "dark" ? (
                  <Moon className="h-3 w-3 text-primary" />
                ) : (
                  <Sun className="h-3 w-3 text-orange-400" />
                )}
              </motion.div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  theme === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
                data-testid={`button-theme-${t}`}
              >
                {t === "dark" ? <Moon className="h-4 w-4 mx-auto mb-1" /> : <Sun className="h-4 w-4 mx-auto mb-1" />}
                {t.charAt(0).toUpperCase() + t.slice(1)} mode
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div variants={itemVariants} className="bg-card border border-destructive/20 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Account</h2>
          <p className="text-xs text-muted-foreground">
            Signing out will end your session. You can sign back in at any time.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
            )}
            Sign out
          </Button>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
