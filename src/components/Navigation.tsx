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
          <li><Link className="text-white/90 hover:text-white story-link" to="/home">Home</Link></li>
          <li><Link className="text-white/90 hover:text-white story-link" to="/">Dashboard</Link></li>
          <li><SubscriptionButton /></li>
          {profile && (
            <li>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-white/10 text-white text-xs">
                    {profile.full_name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{profile.full_name || 'Profile'}</span>
              </Button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Navigation;
