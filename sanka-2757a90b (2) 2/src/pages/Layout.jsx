
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquare, Package, Users, Sparkles, Settings as SettingsIcon, DollarSign } from "lucide-react";
import ChatModal from "@/components/ChatModal";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const navItems = [
    { name: "Pulse", path: createPageUrl("Pulse"), icon: Sparkles },
    { name: "Payments", path: createPageUrl("Payments"), icon: DollarSign },
    { name: "Customers", path: createPageUrl("Customers"), icon: Users },
    { name: "Settings", path: createPageUrl("Settings"), icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 pb-20">
      <style>{`
        :root {
          --primary-500: #6366f1;
          --primary-600: #4f46e5;
          --primary-700: #4338ca;
          --secondary-500: #8b5cf6;
          --success-500: #10b981;
          --warning-500: #f59e0b;
          --error-500: #ef4444;
        }
        
        /* Ensure safe area for notches */
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
      
      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all z-40"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </Button>

      {/* Chat Modal */}
      <ChatModal open={isChatOpen} onOpenChange={setIsChatOpen} />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 z-50 safe-area-inset-bottom">
        <div className="max-w-screen-xl mx-auto px-1">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex flex-col items-center justify-center px-2 py-2 rounded-xl transition-all duration-200 min-w-0 ${
                    isActive 
                      ? 'text-indigo-600' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-lg' : ''}`} />
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium truncate max-w-full ${isActive ? 'text-indigo-600' : ''}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
