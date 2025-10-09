import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { subscription } = useAuth();
  const isPro = subscription?.subscription_tier === 'pro';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-2"
                  onClick={() => document.querySelector('[data-sidebar-trigger]')?.dispatchEvent(new Event('click', { bubbles: true }))}
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
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto pt-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
