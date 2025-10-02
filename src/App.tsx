import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import Auth from "./pages/Auth";
import AITutor from "./pages/AITutor";
import StudyMaterials from "./pages/StudyMaterials";
import VideoSummarizer from "./pages/VideoSummarizer";
import StudyHub from "./pages/StudyHub";
import Subscription from "./pages/Subscription";
import Calendar from "./pages/Calendar";
import Friends from "./pages/Friends";
import NotFound from "./pages/NotFound";
import AIChatbot from "./components/AIChatbot";

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/ai-tutor" element={<AITutor />} />
          <Route path="/study-materials" element={<StudyMaterials />} />
          <Route path="/video-summarizer" element={<VideoSummarizer />} />
          <Route path="/study-hub" element={<StudyHub />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIChatbot />
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
