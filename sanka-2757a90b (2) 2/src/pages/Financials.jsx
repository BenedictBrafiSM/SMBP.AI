import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank
} from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, startOfMonth } from "date-fns";

export default function Financials() {
  const [period, setPeriod] = useState("week");

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-expense_date'),
  });

  const today = startOfDay(new Date());
  const periodStart = period === 'today' ? today : 
                      period === 'week' ? subDays(today, 7) :
                      startOfMonth(today);

  const periodSales = sales.filter(s => new Date(s.sale_date) >= periodStart);
  const periodExpenses = expenses.filter(e => new Date(e.expense_date) >= periodStart);

  const revenue = periodSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalExpenses = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const profit = revenue - totalExpenses;
  const profitMargin = revenue > 0 ? (profit / revenue * 100).toFixed(1) : 0;

  // Group expenses by category
  const expensesByCategory = periodExpenses.reduce((acc, e) => {
    const cat = e.category || 'other';
    acc[cat] = (acc[cat] || 0) + (e.amount || 0);
    return acc;
  }, {});

  const topExpenseCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const categoryColors = {
    inventory: "text-blue-600",
    rent: "text-purple-600",
    utilities: "text-green-600",
    marketing: "text-pink-600",
    salaries: "text-orange-600",
    supplies: "text-cyan-600",
    shipping: "text-indigo-600",
    taxes: "text-red-600",
    maintenance: "text-yellow-600",
    software: "text-violet-600",
    other: "text-slate-600",
  };

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            Financials
          </h1>
          <p className="text-xs text-slate-600">
            Track revenue, expenses, and profit
          </p>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={setPeriod} className="mb-4">
          <TabsList className="bg-white border border-slate-200 grid grid-cols-3 w-full">
            <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
            <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Main Metrics */}
        <div className="space-y-3 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="w-5 h-5 opacity-90" />
                  <span className="text-xs font-medium opacity-90">Net Profit</span>
                </div>
                <div className="text-3xl font-bold mb-1">
                  ${profit.toFixed(2)}
                </div>
                <div className="flex items-center gap-2 text-xs opacity-90">
                  {profit >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{profitMargin}% margin</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-slate-600">Revenue</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    ${revenue.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {periodSales.length} transactions
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownCircle className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-slate-600">Expenses</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    ${totalExpenses.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {periodExpenses.length} expenses
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Top Expense Categories */}
        {topExpenseCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm">Top Expense Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                {topExpenseCategories.map(([category, amount], idx) => {
                  const percentage = (amount / totalExpenses * 100).toFixed(0);
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium capitalize ${categoryColors[category]}`}>
                          {category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full"
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {percentage}% of total expenses
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Recent Activity
          </h2>
          <div className="space-y-2">
            {[...periodSales.slice(0, 3), ...periodExpenses.slice(0, 3)]
              .sort((a, b) => {
                const dateA = new Date(a.sale_date || a.expense_date);
                const dateB = new Date(b.sale_date || b.expense_date);
                return dateB - dateA;
              })
              .slice(0, 5)
              .map((item, idx) => {
                const isSale = 'sale_date' in item;
                return (
                  <Card key={idx} className="border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-lg ${
                            isSale ? 'bg-green-100' : 'bg-red-100'
                          } flex items-center justify-center flex-shrink-0`}>
                            {isSale ? (
                              <ArrowUpCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowDownCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-xs text-slate-900 truncate">
                              {isSale ? item.customer_name || 'Sale' : item.title}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {format(new Date(item.sale_date || item.expense_date), 'MMM d, h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className={`font-semibold text-sm flex-shrink-0 ${
                          isSale ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isSale ? '+' : '-'}${(item.total_amount || item.amount).toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}