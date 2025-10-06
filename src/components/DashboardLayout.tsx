import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-foreground" />
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/home')}
                    className="text-sm"
                  >
                    Home
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="text-sm"
                  >
                    Dashboard
                  </Button>
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
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
