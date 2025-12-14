import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Bell, 
  Lock, 
  Globe, 
  CreditCard,
  LogOut,
  Store,
  Mail,
  Phone,
  Building2,
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    low_stock_alerts: true,
    new_order_alerts: true,
    customer_messages: true,
    marketing_emails: false,
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setProfileData({
        full_name: currentUser.full_name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        company: currentUser.company || "",
      });
      
      if (currentUser.notification_settings) {
        setNotificationSettings({
          ...notificationSettings,
          ...currentUser.notification_settings
        });
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        phone: profileData.phone,
        company: profileData.company,
      });
      toast.success("Profile updated successfully!");
      await loadUser();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        notification_settings: notificationSettings
      });
      toast.success("Notification settings saved!");
    } catch (error) {
      console.error("Error saving notifications:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("smbp_onboarded");
      
      const welcomeUrl = createPageUrl("Welcome");
      base44.auth.logout(welcomeUrl);
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = createPageUrl("Welcome");
    }
  };

  const marketplaces = [
    { id: "ebay", name: "eBay", icon: "🛒", connected: false },
    { id: "etsy", name: "Etsy", icon: "🎨", connected: false },
    { id: "shopify", name: "Shopify", icon: "🛍️", connected: false },
    { id: "amazon", name: "Amazon", icon: "📦", connected: false },
    { id: "walmart", name: "Walmart", icon: "🏪", connected: false },
    { id: "grailed", name: "Grailed", icon: "👕", connected: false },
    { id: "stockx", name: "StockX", icon: "👟", connected: false },
    { id: "michaels", name: "Michaels", icon: "🎨", connected: false },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-indigo-600" />
            Account Settings
          </h1>
          <p className="text-xs text-slate-600">
            Manage your profile and preferences
          </p>
        </div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name" className="text-xs font-medium text-slate-700">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  disabled
                  className="mt-1 bg-slate-50 text-sm"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Name cannot be changed here
                </p>
              </div>

              <div>
                <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                  Email Address
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="pl-9 bg-slate-50 text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Email cannot be changed here
                </p>
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs font-medium text-slate-700">
                  Phone Number
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company" className="text-xs font-medium text-slate-700">
                  Business Name
                </Label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    placeholder="Your Business Name"
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Email Notifications</Label>
                  <p className="text-[10px] text-slate-500">Receive email updates</p>
                </div>
                <Switch
                  checked={notificationSettings.email_notifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, email_notifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Low Stock Alerts</Label>
                  <p className="text-[10px] text-slate-500">Get notified when inventory is low</p>
                </div>
                <Switch
                  checked={notificationSettings.low_stock_alerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, low_stock_alerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">New Order Alerts</Label>
                  <p className="text-[10px] text-slate-500">Alert me when orders come in</p>
                </div>
                <Switch
                  checked={notificationSettings.new_order_alerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, new_order_alerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Customer Messages</Label>
                  <p className="text-[10px] text-slate-500">Notify about customer inquiries</p>
                </div>
                <Switch
                  checked={notificationSettings.customer_messages}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, customer_messages: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Marketing Emails</Label>
                  <p className="text-[10px] text-slate-500">SMBP tips and updates</p>
                </div>
                <Switch
                  checked={notificationSettings.marketing_emails}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, marketing_emails: checked })
                  }
                />
              </div>

              <Button
                onClick={handleSaveNotifications}
                disabled={isSaving}
                variant="outline"
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Marketplace Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-600" />
                Marketplace Connections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {marketplaces.map((marketplace) => (
                <div key={marketplace.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{marketplace.icon}</div>
                    <div>
                      <div className="font-medium text-sm">{marketplace.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {marketplace.connected ? "Connected" : "Not connected"}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={marketplace.connected ? "outline" : "default"}
                    className="h-7 text-xs"
                  >
                    {marketplace.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="text-center text-xs text-slate-500 mt-6">
          SMBP v1.0.0 • Made with ❤️ for merchants
        </div>
      </div>
    </div>
  );
}