import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Menu, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "@/components/Footer";
import logo from "@/assets/logo-new.png";

function DashboardContent({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription } = useAuth();
  const { toggleSidebar } = useSidebar();
  const isPro = subscription?.subscription_tier === 'pro';
  const isDashboardPage = location.pathname === '/dashboard';

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logo} alt="DUKL Study" className="h-7 w-7" />
              <span className="text-lg font-extralight tracking-wide hidden sm:inline" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
                DUKL STUDY
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isDashboardPage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/subscription')}
              className="flex items-center gap-2"
            >
              <Crown className="h-4 w-4" />
              {isPro ? 'Pro' : 'Upgrade'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-4">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <DashboardContent>{children}</DashboardContent>
      </div>
    </SidebarProvider>
  );
}
