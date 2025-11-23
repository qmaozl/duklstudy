import { Home, Brain, Video, Calendar, BookOpen, Crown, Settings as SettingsIcon, FileText, Music, Timer, Users, Sparkles } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo-new.png";

// Category structure for better organization
const studyMenuItems = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: Home,
    description: "Your study overview and quick actions"
  },
  { 
    title: "Focus Timer", 
    url: "/focus-timer", 
    icon: Timer,
    description: "Solo study sessions with ambient sounds"
  },
  { 
    title: "Study Group", 
    url: "/study-group", 
    icon: Users,
    description: "Study with friends for accountability"
  },
];

const createMenuItems = [
  { 
    title: "Flashcards", 
    url: "/flashcards", 
    icon: BookOpen,
    description: "Create and study flashcard sets"
  },
  { 
    title: "Playlist Maker", 
    url: "/playlist-maker", 
    icon: Music,
    description: "Build ad-free study playlists"
  },
  { 
    title: "Memorise Pro", 
    url: "/memorise-pro", 
    icon: Brain,
    description: "Advanced memorization tools"
  },
];

const aiMenuItems = [
  { 
    title: "Video Summarizer", 
    url: "/video-summarizer", 
    icon: Video,
    description: "Generate study materials from videos"
  },
  { 
    title: "Notes Summarizer", 
    url: "/notes-summarizer", 
    icon: FileText,
    description: "Turn notes into flashcards and quizzes"
  },
  { 
    title: "Calendar", 
    url: "/calendar", 
    icon: Calendar,
    description: "AI-powered study scheduling"
  },
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

  const renderMenuItem = (item: typeof studyMenuItems[0]) => {
    const button = (
      <SidebarMenuButton
        onClick={() => handleNavigation(item.url)}
        isActive={isActive(item.url)}
        className="w-full"
      >
        <item.icon className="h-4 w-4" />
        {!collapsed && <span>{item.title}</span>}
      </SidebarMenuButton>
    );

    // Show tooltip when collapsed
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex flex-col gap-1">
            <p className="font-semibold">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <TooltipProvider delayDuration={0}>
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
          {/* Study Section */}
          <SidebarGroup>
            <SidebarGroupLabel>
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <span>📚</span>
                  <span>Study</span>
                </div>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {studyMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Create Section */}
          <SidebarGroup>
            <SidebarGroupLabel>
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <span>🎵</span>
                  <span>Create</span>
                </div>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {createMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* AI Tools Section */}
          <SidebarGroup>
            <SidebarGroupLabel>
              {!collapsed ? (
                <div className="flex items-center gap-2">
                  <span>🤖</span>
                  <span>AI Tools</span>
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
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {aiMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Settings & Upgrade Section */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <span>⚙️</span>
                  <span>Settings & Upgrade</span>
                </div>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => handleNavigation('/settings')}
                          isActive={isActive('/settings')}
                          className="w-full"
                        >
                          <SettingsIcon className="h-4 w-4" />
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex flex-col gap-1">
                        <p className="font-semibold">Settings</p>
                        <p className="text-xs text-muted-foreground">Manage your account and preferences</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton
                      onClick={() => handleNavigation('/settings')}
                      isActive={isActive('/settings')}
                      className="w-full"
                    >
                      <SettingsIcon className="h-4 w-4" />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>

                <SidebarMenuItem>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => navigate('/subscription')}
                          className="w-full"
                        >
                          <Crown className="h-4 w-4" />
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex flex-col gap-1">
                        <p className="font-semibold">{isPro ? 'Pro Member' : 'Upgrade to Pro'}</p>
                        <p className="text-xs text-muted-foreground">
                          {isPro ? 'Manage your subscription' : 'Get unlimited access to all features'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton
                      onClick={() => navigate('/subscription')}
                      className="w-full"
                    >
                      <Crown className="h-4 w-4" />
                      <span>{isPro ? 'Pro Member' : 'Upgrade'}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
