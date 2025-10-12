import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { SubscriptionButton } from "./SubscriptionButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur border-b border-white/10 bg-black/20">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="DUKL Study logo" className="h-8 w-8" />
          <span className="text-white text-xl font-extralight tracking-wide" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
            STUDY
          </span>
        </Link>
        <ul className="flex items-center gap-6 text-sm">
          <li><Link className="text-white/90 hover:text-white story-link" to="/">Home</Link></li>
          <li><Link className="text-white/90 hover:text-white story-link" to="/dashboard">Dashboard</Link></li>
          <li><SubscriptionButton /></li>
        </ul>
      </nav>
    </header>
  );
};

export default Navigation;
