import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Store, 
  Target, 
  Zap, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    goals: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndOnboarding();
  }, []);

  const checkAuthAndOnboarding = async () => {
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) {
        navigate(createPageUrl("Welcome"));
        return;
      }

      const user = await base44.auth.me();
      const hasOnboarded = user.has_completed_onboarding || localStorage.getItem("smbp_onboarded");
      
      if (hasOnboarded) {
        navigate(createPageUrl("Chat"));
        return;
      }

      if (user.business_name) setFormData(prev => ({ ...prev, businessName: user.business_name }));
      if (user.business_type) setFormData(prev => ({ ...prev, businessType: user.business_type }));
      if (user.business_goals) setFormData(prev => ({ ...prev, goals: user.business_goals }));
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate(createPageUrl("Welcome"));
    } finally {
      setIsLoading(false);
    }
  };

  const businessTypes = [
    { id: "retail", label: "Retail", icon: Store },
    { id: "ecommerce", label: "E-commerce", icon: Zap },
    { id: "service", label: "Service", icon: Sparkles },
    { id: "other", label: "Other", icon: Target },
  ];

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        business_name: formData.businessName,
        business_type: formData.businessType,
        has_completed_onboarding: true
      });

      localStorage.setItem("smbp_onboarded", "true");

      navigate(createPageUrl("Chat"));
    } catch (error) {
      console.error("Error saving onboarding:", error);
      localStorage.setItem("smbp_onboarded", "true");
      navigate(createPageUrl("Chat"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(step / 2) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-slate-900"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  What's your business name?
                </h2>
                <p className="text-slate-600 text-sm">
                  We'll use this to personalize your experience
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Enter business name"
                  className="h-12 text-base"
                />

                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.businessName.trim()}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  What type of business?
                </h2>
                <p className="text-slate-600 text-sm">
                  This helps us customize your experience
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {businessTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setFormData({ ...formData, businessType: type.id })}
                      className={`p-5 rounded-xl border-2 transition-all ${
                        formData.businessType === type.id
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <Icon className={`w-7 h-7 mb-2 mx-auto ${
                        formData.businessType === type.id ? "text-white" : "text-slate-400"
                      }`} />
                      <div className="font-medium text-sm">
                        {type.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="h-12"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!formData.businessType || isSaving}
                  className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Get Started
                      <Sparkles className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}


        </AnimatePresence>
      </div>
    </div>
  );
}