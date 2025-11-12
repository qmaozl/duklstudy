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
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl border-b border-white/10 bg-black/30">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 group transition-transform hover:scale-105">
          <img src={logo} alt="DUKL Study logo" className="h-8 w-8 rounded-lg" />
          <span className="text-white text-xl font-light tracking-wide font-swiss">
            STUDY
          </span>
        </Link>
        <ul className="flex items-center gap-6 text-sm font-swiss">
          <li><Link className="text-white/80 hover:text-white transition-colors" to="/">Home</Link></li>
          <li><Link className="text-white/80 hover:text-white transition-colors" to="/dashboard">Dashboard</Link></li>
          <li><SubscriptionButton /></li>
        </ul>
      </nav>
    </header>
  );
};

export default Navigation;
