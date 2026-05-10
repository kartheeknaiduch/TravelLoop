import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Map, 
  LayoutDashboard, 
  Globe, 
  MapPin, 
  Users, 
  User as UserIcon, 
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Shield
} from "lucide-react";

function useDarkMode() {
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ||
        localStorage.getItem("traveloop_theme") === "dark";
    }
    return false;
  });

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("traveloop_theme", next ? "dark" : "light");
  };

  React.useEffect(() => {
    const stored = localStorage.getItem("traveloop_theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  return { isDark, toggle };
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isDark, toggle: toggleDark } = useDarkMode();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/trips", label: "My Trips", icon: Map },
    { href: "/cities", label: "Explore Cities", icon: MapPin },
    { href: "/activities", label: "Activities", icon: Globe },
    { href: "/community", label: "Community", icon: Users },
  ];

  if (user?.isAdmin) {
    navItems.push({ href: "/admin", label: "Admin", icon: Shield });
  }

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href || location.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              isActive 
                ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                : "text-muted-foreground hover:bg-secondary/5 hover:text-foreground"
            }`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b z-20 sticky top-0">
        <Link href="/dashboard">
          <div className="font-serif text-2xl font-bold tracking-tight text-primary cursor-pointer">
            Traveloop
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleDark} className="w-9 h-9">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] bg-background z-10 flex flex-col p-4 overflow-y-auto">
          <nav className="flex-1 space-y-2">
            <NavLinks />
          </nav>
          <div className="mt-8 pt-4 border-t space-y-2">
            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary/5 hover:text-foreground cursor-pointer">
                <UserIcon className="w-5 h-5" />
                <span>Profile</span>
              </div>
            </Link>
            <button 
              onClick={() => { logout(); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/5 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r fixed h-screen top-0 left-0">
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard">
            <div className="font-serif text-3xl font-bold tracking-tight text-primary cursor-pointer">
              Traveloop
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleDark} className="w-8 h-8 text-muted-foreground hover:text-foreground">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            {user?.photo ? (
              <img src={user.photo} alt={user.firstName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          
          <Link href="/profile">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-secondary/5 hover:text-foreground cursor-pointer">
              <UserIcon className="w-4 h-4" />
              <span>Profile Settings</span>
            </div>
          </Link>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 mt-1 rounded-xl text-sm text-destructive hover:bg-destructive/5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative min-h-screen">
        {children}
      </main>
    </div>
  );
}
