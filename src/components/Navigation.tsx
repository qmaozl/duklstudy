import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo-new.png";
import { SubscriptionButton } from "./SubscriptionButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-sm border-b border-saas-border bg-white/95">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 group transition-transform hover:scale-105">
          <img src={logo} alt="DUKL Study logo" className="h-8 w-8 rounded-lg" />
          <span className="text-saas-charcoal text-xl font-semibold tracking-tight font-swiss">
            STUDY
          </span>
        </Link>
        <div>
          <Button 
            asChild 
            className="bg-gradient-to-r from-saas-blue-dark to-saas-blue text-white font-semibold px-6 py-2 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] transition-all"
          >
            <Link to="/subscription">Get DUKL Pro</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navigation;
