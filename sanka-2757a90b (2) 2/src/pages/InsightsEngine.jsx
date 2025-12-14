import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign,
  Loader2,
  CheckCircle2,
  Brain,
  Zap,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, startOfDay } from "date-fns";

export default function InsightsEngine() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState([]);
  const [analysisStage, setAnalysisStage] = useState("");
  const queryClient = useQueryClient();

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

  const generateInsights = async () => {
    setIsGenerating(true);
    setGeneratedInsights([]);
    
    try {
      // 1. Analyze Sales and Top Products
      setAnalysisStage("Analyzing sales trends and top products...");
      
      const today = startOfDay(new Date());
      const thirtyDaysAgo = subDays(today, 30);
      const recentSales = sales.filter(s => new Date(s.sale_date) >= thirtyDaysAgo);
      
      // Calculate product sales
      const productSales = {};
      recentSales.forEach(sale => {
        sale.items?.forEach(item => {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = {
              name: item.product_name,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.product_id].quantity += item.quantity || 0;
          productSales[item.product_id].revenue += item.total || 0;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const salesInsightPrompt = `Analyze this sales data and provide actionable insights:
      
Top 5 Products (last 30 days):
${topProducts.map(p => `- ${p.name}: ${p.quantity} units sold, $${p.revenue.toFixed(2)} revenue`).join('\n')}

Total Products: ${products.length}
Total Sales: ${recentSales.length} orders
Total Revenue: $${recentSales.reduce((sum, s) => sum + (s.total_amount || 0), 0).toFixed(2)}

Provide 2-3 specific, actionable insights about:
1. Which products to stock more of based on demand
2. Forecasting and inventory recommendations
3. Product bundling or promotion opportunities`;

      const salesAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: salesInsightPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  message: { type: "string" },
                  action_label: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });

      // 2. Analyze Customer Patterns
      setAnalysisStage("Detecting customer purchasing patterns...");
      
      const customerInsightPrompt = `Analyze customer data and identify patterns:

Total Customers: ${customers.length}
VIP Customers: ${customers.filter(c => c.status === 'vip').length}
At-Risk Customers: ${customers.filter(c => c.status === 'at_risk').length}
Total Customer Lifetime Value: $${customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toFixed(2)}

Top 5 Customers by Spend:
${customers.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0)).slice(0, 5).map(c => 
  `- ${c.name}: $${(c.total_spent || 0).toFixed(2)} (${c.total_orders || 0} orders)`
).join('\n')}

Provide 2-3 specific insights about:
1. Customer retention opportunities
2. Targeted promotion suggestions for different customer segments
3. Re-engagement strategies for at-risk customers`;

      const customerAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: customerInsightPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  message: { type: "string" },
                  action_label: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });

      // 3. Inventory Analysis
      setAnalysisStage("Checking inventory levels and forecasting...");
      
      const lowStockProducts = products.filter(p => 
        p.stock_quantity <= (p.low_stock_threshold || 10) && p.status === 'active'
      );
      
      const overstockProducts = products.filter(p => {
        const avgSales = productSales[p.id]?.quantity || 0;
        return p.stock_quantity > avgSales * 3 && avgSales > 0;
      });

      const inventoryPrompt = `Analyze inventory situation:

Low Stock Products (${lowStockProducts.length}):
${lowStockProducts.slice(0, 5).map(p => 
  `- ${p.name}: ${p.stock_quantity} units (threshold: ${p.low_stock_threshold || 10})`
).join('\n')}

Potential Overstock (${overstockProducts.length}):
${overstockProducts.slice(0, 3).map(p => 
  `- ${p.name}: ${p.stock_quantity} units in stock`
).join('\n')}

Total Inventory Value: $${products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0).toFixed(2)}

Provide 2-3 specific insights about:
1. Urgent restocking needs and quantities
2. Overstock reduction strategies
3. Inventory optimization opportunities`;

      const inventoryAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: inventoryPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  message: { type: "string" },
                  action_label: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });

      // 4. Financial Analysis
      setAnalysisStage("Analyzing financials and finding opportunities...");
      
      const recentExpenses = expenses.filter(e => new Date(e.expense_date) >= thirtyDaysAgo);
      const revenue = recentSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const totalExpenses = recentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const profit = revenue - totalExpenses;
      
      const expensesByCategory = recentExpenses.reduce((acc, e) => {
        const cat = e.category || 'other';
        acc[cat] = (acc[cat] || 0) + (e.amount || 0);
        return acc;
      }, {});

      const financialPrompt = `Analyze financial performance (last 30 days):

Revenue: $${revenue.toFixed(2)}
Expenses: $${totalExpenses.toFixed(2)}
Net Profit: $${profit.toFixed(2)}
Profit Margin: ${revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0}%

Top Expense Categories:
${Object.entries(expensesByCategory)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([cat, amt]) => `- ${cat.replace(/_/g, ' ')}: $${amt.toFixed(2)}`)
  .join('\n')}

Provide 2-3 specific insights about:
1. Cost-saving opportunities in high-expense categories
2. Profit margin improvement strategies
3. Cash flow optimization recommendations`;

      const financialAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: financialPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  message: { type: "string" },
                  action_label: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Combine all insights
      const allInsights = [
        ...salesAnalysis.insights.map(i => ({ ...i, category: 'sales', type: 'opportunity' })),
        ...customerAnalysis.insights.map(i => ({ ...i, category: 'customers', type: 'tip' })),
        ...inventoryAnalysis.insights.map(i => ({ ...i, category: 'inventory', type: 'alert' })),
        ...financialAnalysis.insights.map(i => ({ ...i, category: 'finance', type: 'opportunity' }))
      ];

      setAnalysisStage("Saving insights...");

      // Save insights to database
      const savedInsights = [];
      for (const insight of allInsights) {
        const saved = await base44.entities.PulseInsight.create({
          title: insight.title,
          message: insight.message,
          type: insight.type,
          priority: insight.priority === 'high' ? 'high' : 
                   insight.priority === 'critical' ? 'critical' : 'medium',
          category: insight.category,
          action_label: insight.action_label,
          insight_date: new Date().toISOString().split('T')[0],
          is_read: false,
          is_dismissed: false
        });
        savedInsights.push(saved);
      }

      setGeneratedInsights(savedInsights);
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      setAnalysisStage("Analysis complete!");
      
    } catch (error) {
      console.error("Error generating insights:", error);
      setAnalysisStage("Error generating insights. Please try again.");
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setAnalysisStage("");
      }, 2000);
    }
  };

  const insightTypeIcons = {
    alert: Package,
    opportunity: TrendingUp,
    tip: Sparkles,
    achievement: CheckCircle2,
  };

  const insightTypeColors = {
    alert: "border-red-200 bg-red-50",
    opportunity: "border-green-200 bg-green-50",
    tip: "border-blue-200 bg-blue-50",
    achievement: "border-yellow-200 bg-yellow-50",
  };

  const categoryIcons = {
    sales: BarChart3,
    customers: Users,
    inventory: Package,
    finance: DollarSign,
  };

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Insights Engine
              </h1>
              <p className="text-xs text-slate-600">
                Powered by Sanka Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                Generate AI-Powered Insights
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Analyze your sales, inventory, customers, and financials to get actionable recommendations.
              </p>
              
              <Button
                onClick={generateInsights}
                disabled={isGenerating}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Insights
                  </>
                )}
              </Button>

              {isGenerating && analysisStage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-sm text-indigo-600 flex items-center justify-center gap-2"
                >
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                  {analysisStage}
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Categories */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-slate-700">Sales Trends</span>
              </div>
              <p className="text-[10px] text-slate-600">
                Top products, demand forecasting, bundling opportunities
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-slate-700">Customer Patterns</span>
              </div>
              <p className="text-[10px] text-slate-600">
                Purchase behavior, retention, targeted promotions
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-slate-700">Inventory Health</span>
              </div>
              <p className="text-[10px] text-slate-600">
                Stock-out alerts, overstock detection, optimization
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-slate-700">Financial Insights</span>
              </div>
              <p className="text-[10px] text-slate-600">
                Cost savings, profit optimization, cash flow tips
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Generated Insights */}
        <AnimatePresence>
          {generatedInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Fresh Insights
                </h2>
                <Badge className="bg-green-100 text-green-700">
                  {generatedInsights.length} new
                </Badge>
              </div>

              <div className="space-y-3">
                {generatedInsights.map((insight, idx) => {
                  const TypeIcon = insightTypeIcons[insight.type] || Sparkles;
                  const CategoryIcon = categoryIcons[insight.category] || Sparkles;
                  
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className={`border ${insightTypeColors[insight.type]} shadow-sm`}>
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                                <TypeIcon className="w-4 h-4 text-slate-700" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900 text-xs leading-tight">
                                  {insight.title}
                                </h3>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <CategoryIcon className="w-3 h-3 text-slate-500" />
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-auto capitalize">
                                    {insight.priority}
                                  </Badge>
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
                                >
                                  {insight.action_label}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Card */}
        <Card className="border-slate-200 bg-slate-50 mt-6">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Brain className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">
                  How It Works
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sanka's AI engine analyzes your business data across sales, inventory, customers, and finances. 
                  It identifies patterns, predicts trends, and provides actionable recommendations to help you grow.
                  Run this analysis regularly to stay ahead!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}