import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import HomePage from "./pages/HomePage";
import DashboardOverview from "./pages/DashboardOverview";
import Auth from "./pages/Auth";
import AITutor from "./pages/AITutor";
import StudyHub from "./pages/StudyHub";
import Subscription from "./pages/Subscription";
import MemorisePro from "./pages/MemorisePro";
import MemoriseReview from "./pages/MemoriseReview";
import CustomParagraphReview from "./pages/CustomParagraphReview";
import FocusTimer from "./pages/FocusTimer";
import NotFound from "./pages/NotFound";
import AIChatbot from "./components/AIChatbot";

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/ai-tutor" element={<AITutor />} />
          <Route path="/study-hub" element={<StudyHub />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/memorise-pro" element={<MemorisePro />} />
          <Route path="/memorise-pro/review/:textKey" element={<MemoriseReview />} />
          <Route path="/memorise-pro/custom/:id" element={<CustomParagraphReview />} />
          <Route path="/focus-timer" element={<FocusTimer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIChatbot />
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
