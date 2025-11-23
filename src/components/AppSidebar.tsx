import { Home, Clock, Brain, Video, Calendar, BookOpen, Crown, Settings as SettingsIcon, FileText, Library, Music, Timer, Users } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo-new.png";

const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Focus Timer", url: "/focus-timer", icon: Timer },
  { title: "Study Group", url: "/study-group", icon: Users },
  { title: "Playlist Maker", url: "/playlist-maker", icon: Music },
  { title: "Memorise Pro", url: "/memorise-pro", icon: Brain },
  { title: "Flashcards", url: "/flashcards", icon: BookOpen },
];

const aiMenuItems = [
  { title: "Video Summarizer", url: "/video-summarizer", icon: Video },
  { title: "Notes Summarizer", url: "/notes-summarizer", icon: FileText },
  { title: "Calendar", url: "/calendar", icon: Calendar },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, subscription } = useAuth();
  const { showAuthPrompt } = useAuthPrompt();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    // Dashboard is accessible to everyone
    if (path === "/dashboard") {
      navigate(path);
      return;
    }
    
    // Other features require login
    if (!user) {
      showAuthPrompt();
      return;
    }
    
    navigate(path);
  };

  const isPro = subscription?.subscription_tier === 'pro';

  return (
    <Sidebar 
      className={`transition-all duration-300 ${collapsed ? "w-14" : "w-64"}`} 
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="DUKL Study" className="h-8 w-8 rounded-lg" />
          {!collapsed && (
            <span className="text-xl font-extralight tracking-wide" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
              STUDY
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    isActive={isActive(item.url)}
                    className="w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              AI Features
              <Badge 
                className="text-[10px] px-1.5 py-0 h-4 bg-pink-500/20 text-pink-500 border-pink-500/50"
                style={{ 
                  boxShadow: '0 0 10px rgba(236, 72, 153, 0.5)',
                  borderRadius: '6px'
                }}
              >
                AI
              </Badge>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    isActive={isActive(item.url)}
                    className="w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleNavigation('/settings')}
                  isActive={isActive('/settings')}
                  className="w-full"
                >
                  <SettingsIcon className="h-4 w-4" />
                  {!collapsed && <span>Settings</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/subscription')}
                  className="w-full"
                >
                  <Crown className="h-4 w-4" />
                  {!collapsed && <span>{isPro ? 'Pro Member' : 'Upgrade'}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
