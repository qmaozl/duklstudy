import { Home, Clock, Brain, Video, Calendar, BookOpen, Crown, Settings as SettingsIcon, FileText, Library, Music } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import logo from "@/assets/logo.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Study Hub", url: "/study-hub", icon: Library },
  { title: "Study Group", url: "/focus-timer", icon: Clock },
  { title: "Playlist Maker", url: "/playlist-maker", icon: Music },
  { title: "Memorise Pro", url: "/memorise-pro", icon: Brain },
  { title: "Video Summarizer", url: "/video-summarizer", icon: Video },
  { title: "Notes Summarizer", url: "/notes-summarizer", icon: FileText },
  { title: "Flashcards", url: "/flashcards", icon: BookOpen },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const isPro = subscription?.subscription_tier === 'pro';

  return (
    <Sidebar 
      className={`transition-all duration-300 ${collapsed ? "w-14" : "w-64"}`} 
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="DUKL Study" className="h-8 w-8" />
          {!collapsed && (
            <span className="text-xl font-extralight tracking-wide" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
              STUDY
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
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
