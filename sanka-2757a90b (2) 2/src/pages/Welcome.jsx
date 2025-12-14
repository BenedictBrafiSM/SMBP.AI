import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Chrome, Facebook, Apple, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Welcome() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (isAuthenticated) {
        const user = await base44.auth.me();
        const hasOnboarded = user.has_completed_onboarding || localStorage.getItem("smbp_onboarded");
        
        if (hasOnboarded) {
          navigate(createPageUrl("Chat"));
        } else {
          navigate(createPageUrl("Onboarding"));
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignIn = async (provider) => {
    try {
      const nextUrl = createPageUrl("Onboarding");
      base44.auth.redirectToLogin(nextUrl);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69113d25d60420d42757a90b/717cc756f_Screenshot2025-12-11at100048PM.png" 
            alt="SMBP" 
            className="w-16 h-16 mx-auto rounded-2xl mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome to SMBP
          </h1>
          <p className="text-slate-600 text-sm">
            Your intelligent business partner
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => handleSignIn('email')}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-500">or continue with</span>
            </div>
          </div>

          <Button
            onClick={() => handleSignIn('google')}
            variant="outline"
            className="w-full h-12 flex items-center justify-center gap-3"
          >
            <Chrome className="w-5 h-5" />
            <span className="font-medium">Google</span>
          </Button>
        </div>

        <p className="text-xs text-center text-slate-500 mt-6">
          By continuing, you agree to our Terms and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}