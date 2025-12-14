import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Search, 
  Crown, 
  TrendingDown, 
  Mail, 
  Phone,
  Sparkles,
  Loader2,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-updated_date'),
  });

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const vipCount = customers.filter(c => c.status === 'vip').length;
  const atRiskCount = customers.filter(c => c.status === 'at_risk').length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);

  const statusColors = {
    active: "bg-green-100 text-green-700 border-green-200",
    vip: "bg-purple-100 text-purple-700 border-purple-200",
    at_risk: "bg-orange-100 text-orange-700 border-orange-200",
    churned: "bg-red-100 text-red-700 border-red-200",
  };

  const handleEmailClick = (customer) => {
    setSelectedCustomer(customer);
    setEmailDialog(true);
    setEmailSubject("");
    setEmailContent("");
  };

  const generateEmail = async () => {
    if (!selectedCustomer) return;
    
    setIsGenerating(true);
    try {
      const prompt = `Generate a professional, friendly email for ${selectedCustomer.name}, a ${selectedCustomer.status} customer who has spent $${selectedCustomer.total_spent?.toFixed(2) || 0} across ${selectedCustomer.total_orders || 0} orders.

Customer notes: ${selectedCustomer.notes || 'No additional notes'}

Create an email that:
1. Is personalized and warm
2. Thanks them for their business
3. ${selectedCustomer.status === 'at_risk' ? 'Re-engages them with a special offer' : 'Offers value or exclusive benefits'}
4. Includes a clear call-to-action

Return the email in this format:
Subject: [compelling subject line]
Body: [email body with proper formatting]`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" }
          }
        }
      });

      setEmailSubject(response.subject);
      setEmailContent(response.body);
    } catch (error) {
      console.error("Error generating email:", error);
      toast.error("Failed to generate email");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!selectedCustomer || !emailSubject || !emailContent) return;
    
    setIsSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: selectedCustomer.email,
        subject: emailSubject,
        body: emailContent,
        from_name: "Sanka Team"
      });
      
      toast.success(`Email sent to ${selectedCustomer.name}!`);
      setEmailDialog(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-indigo-600" />
            Customers
          </h1>
          <p className="text-xs text-slate-600">
            {customers.length} total • {vipCount} VIP • ${totalRevenue.toFixed(0)} lifetime value
          </p>
        </div>

        {/* Stats */}
        {(vipCount > 0 || atRiskCount > 0) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {vipCount > 0 && (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-900">VIP Customers</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{vipCount}</div>
                </CardContent>
              </Card>
            )}
            
            {atRiskCount > 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-900">At Risk</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">{atRiskCount}</div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="pl-9 rounded-2xl border-slate-200 text-sm"
          />
        </div>

        {/* Customers List */}
        <div className="space-y-3">
          {filteredCustomers.map((customer, idx) => {
            const avgOrderValue = customer.total_orders > 0 ? 
              (customer.total_spent / customer.total_orders).toFixed(2) : 0;

            return (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {customer.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm truncate">
                              {customer.name}
                            </h3>
                            {customer.company && (
                              <p className="text-[10px] text-slate-500 truncate">{customer.company}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className={`${statusColors[customer.status] || statusColors.active} text-[10px] px-1.5 py-0`}>
                              {customer.status || 'active'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-indigo-50"
                              onClick={() => handleEmailClick(customer)}
                            >
                              <Mail className="w-3 h-3 text-indigo-600" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1 mb-2">
                          {customer.email && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-600">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-600">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-[10px] text-slate-600">Total Spent</div>
                            <div className="font-semibold text-slate-900 text-sm">
                              ${customer.total_spent?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-600">Orders</div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {customer.total_orders || 0}
                            </div>
                          </div>
                          {avgOrderValue > 0 && (
                            <div>
                              <div className="text-[10px] text-slate-600">Avg Order</div>
                              <div className="font-semibold text-slate-900 text-sm">
                                ${avgOrderValue}
                              </div>
                            </div>
                          )}
                        </div>

                        {customer.last_purchase_date && (
                          <div className="mt-1.5 text-[10px] text-slate-500 truncate">
                            Last purchase: {format(new Date(customer.last_purchase_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {filteredCustomers.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">No customers found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              Email {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription>
              Send a personalized email to your customer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                onClick={generateEmail}
                disabled={isGenerating}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>

            <div>
              <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-sm font-medium">Message</Label>
              <Textarea
                id="content"
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Email content"
                className="mt-2 min-h-[200px]"
              />
            </div>

            {selectedCustomer && (
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                <div className="font-medium mb-1">Customer Info:</div>
                <div>Email: {selectedCustomer.email}</div>
                <div>Status: {selectedCustomer.status}</div>
                <div>Total Spent: ${selectedCustomer.total_spent?.toFixed(2)}</div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={sendEmail}
              disabled={!emailSubject || !emailContent || isSending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}