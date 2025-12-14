import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  DollarSign,
  AlertCircle,
  Lightbulb,
  Trophy,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  AlertTriangle,
  Brain,
  X,
  Store
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, subDays, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Pulse() {
  const [greeting, setGreeting] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-expense_date'),
  });

  const { data: insights = [] } = useQuery({
    queryKey: ['insights'],
    queryFn: () => base44.entities.PulseInsight.filter({ is_dismissed: false }, '-created_date'),
  });

  const dismissInsightMutation = useMutation({
    mutationFn: (insightId) => base44.entities.PulseInsight.update(insightId, { is_dismissed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });

  // Calculate metrics
  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 7);

  const todaySales = sales.filter(s => 
    new Date(s.sale_date) >= today
  );
  const weekSales = sales.filter(s => 
    new Date(s.sale_date) >= weekAgo
  );

  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const weekRevenue = weekSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const weekExpenses = expenses
    .filter(e => new Date(e.expense_date) >= weekAgo)
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const weekProfit = weekRevenue - weekExpenses;
  const lowStockProducts = products.filter(p => 
    p.stock_quantity <= (p.low_stock_threshold || 10)
  );

  const vipCustomers = customers.filter(c => c.status === 'vip').length;
  const totalInventoryValue = products.reduce((sum, p) => 
    sum + ((p.price || 0) * (p.stock_quantity || 0)), 0
  );

  const metrics = [
    {
      label: "Today's Revenue",
      value: `$${todayRevenue.toFixed(0)}`,
      subtext: `${todaySales.length} orders`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: createPageUrl("Financials"),
    },
    {
      label: "Week Profit",
      value: `$${weekProfit.toFixed(0)}`,
      subtext: weekProfit > 0 ? "On track" : "Review expenses",
      icon: TrendingUp,
      color: weekProfit > 0 ? "text-emerald-600" : "text-orange-600",
      bgColor: weekProfit > 0 ? "bg-emerald-50" : "bg-orange-50",
      link: createPageUrl("Financials"),
    },
    {
      label: "Low Stock",
      value: lowStockProducts.length,
      subtext: "Need attention",
      icon: Package,
      color: lowStockProducts.length > 0 ? "text-red-600" : "text-slate-600",
      bgColor: lowStockProducts.length > 0 ? "bg-red-50" : "bg-slate-50",
      link: createPageUrl("Inventory"),
    },
    {
      label: "Customers",
      value: customers.length,
      subtext: `${vipCustomers} VIP`,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      link: createPageUrl("Customers"),
    },
  ];

  const insightIcons = {
    alert: AlertCircle,
    opportunity: Lightbulb,
    tip: Sparkles,
    achievement: Trophy,
    warning: AlertTriangle,
  };

  const insightColors = {
    alert: "border-red-200 bg-red-50/50",
    opportunity: "border-green-200 bg-green-50/50",
    tip: "border-blue-200 bg-blue-50/50",
    achievement: "border-yellow-200 bg-yellow-50/50",
    warning: "border-orange-200 bg-orange-50/50",
  };

  const priorityColors = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-blue-100 text-blue-700",
    low: "bg-slate-100 text-slate-700",
  };

  const handleInsightAction = (insight) => {
    // Route to appropriate page based on category
    const categoryRoutes = {
      sales: "Financials",
      customers: "Customers",
      inventory: "Inventory",
      finance: "Financials",
    };
    
    const route = categoryRoutes[insight.category] || "Chat";
    window.location.href = createPageUrl(route);
  };

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto">
        {/* Header with Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69113d25d60420d42757a90b/717cc756f_Screenshot2025-12-11at100048PM.png" 
              alt="Sanka" 
              className="w-10 h-10 rounded-xl"
            />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {greeting}
              </h1>
              <p className="text-sm text-slate-600">
                {format(new Date(), "EEEE, MMM d")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={metric.link}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3">
                      <div className={`w-9 h-9 rounded-lg ${metric.bgColor} flex items-center justify-center mb-2`}>
                        <Icon className={`w-4 h-4 ${metric.color}`} />
                      </div>
                      <div className="text-xl font-bold text-slate-900 truncate">
                        {metric.value}
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5 truncate">
                        {metric.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {metric.subtext}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* AI Insights CTA */}
        {insights.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Link to={createPageUrl("InsightsEngine")}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-xl transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1">
                        Generate AI Insights
                      </h3>
                      <p className="text-xs text-white/80">
                        Get smart recommendations for your business
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/80 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Insights Section */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Insights
              </h2>
              <Link to={createPageUrl("InsightsEngine")}>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Generate More
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {insights.slice(0, 3).map((insight, idx) => {
                  const Icon = insightIcons[insight.type] || Lightbulb;
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                      <Card className={`border ${insightColors[insight.type]} shadow-sm`}>
                        <CardContent className="p-3">
                          <div className="flex gap-2">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-slate-700" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900 text-xs leading-tight">
                                  {insight.title}
                                </h3>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-auto">
                                    {insight.category}
                                  </Badge>
                                  {insight.priority !== 'medium' && insight.priority !== 'low' && (
                                    <Badge className={`${priorityColors[insight.priority]} text-[10px] px-1 py-0 h-auto`}>
                                      {insight.priority}
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 hover:bg-slate-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissInsightMutation.mutate(insight.id);
                                    }}
                                  >
                                    <X className="w-3 h-3 text-slate-500" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {insight.message}
                              </p>
                              {insight.action_label && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 h-6 text-[10px] px-2"
                                  onClick={() => handleInsightAction(insight)}
                                >
                                  {insight.action_label}
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-base font-semibold text-slate-900 mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to={createPageUrl("Chat")}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <CardContent className="p-3">
                  <ShoppingBag className="w-7 h-7 mb-2 opacity-90" />
                  <div className="font-semibold text-sm">Record Sale</div>
                  <div className="text-xs opacity-80 mt-0.5">Ask Sanka</div>
                </CardContent>
              </Card>
            </Link>
            
            <Link to={createPageUrl("Marketplaces")}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-3">
                  <Store className="w-7 h-7 mb-2 text-indigo-600" />
                  <div className="font-semibold text-slate-900 text-sm">Cross-List</div>
                  <div className="text-xs text-slate-600 mt-0.5">Multi-platform</div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">
                Business Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-600 mb-1">Total Products</div>
                  <div className="text-xl font-bold text-slate-900">{products.length}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Inventory Value</div>
                  <div className="text-xl font-bold text-slate-900">
                    ${totalInventoryValue.toFixed(0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Week Sales</div>
                  <div className="text-xl font-bold text-slate-900">{weekSales.length}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Week Revenue</div>
                  <div className="text-xl font-bold text-slate-900">
                    ${weekRevenue.toFixed(0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}