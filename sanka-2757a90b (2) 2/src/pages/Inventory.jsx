import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Plus, AlertCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-updated_date'),
  });

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = products.filter(p => 
    p.stock_quantity <= (p.low_stock_threshold || 10)
  ).length;

  const totalValue = products.reduce((sum, p) => 
    sum + ((p.price || 0) * (p.stock_quantity || 0)), 0
  );

  const statusColors = {
    active: "bg-green-100 text-green-700 border-green-200",
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    out_of_stock: "bg-red-100 text-red-700 border-red-200",
    discontinued: "bg-orange-100 text-orange-700 border-orange-200",
  };

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-indigo-600" />
            Inventory
          </h1>
          <p className="text-xs text-slate-600">
            {products.length} products • ${totalValue.toFixed(0)} total value
          </p>
        </div>

        {/* Stats */}
        {lowStockCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-orange-900 text-sm">
                      {lowStockCount} items need restocking
                    </div>
                    <div className="text-xs text-orange-700 truncate">
                      Stock running low on several products
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-9 rounded-2xl border-slate-200 text-sm"
          />
        </div>

        {/* Products List */}
        <div className="space-y-3">
          {filteredProducts.map((product, idx) => {
            const isLowStock = product.stock_quantity <= (product.low_stock_threshold || 10);
            const margin = product.price && product.cost ? 
              ((product.price - product.cost) / product.price * 100).toFixed(0) : 0;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {/* Image */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm truncate">
                              {product.name}
                            </h3>
                            {product.sku && (
                              <p className="text-[10px] text-slate-500">SKU: {product.sku}</p>
                            )}
                          </div>
                          <Badge className={`${statusColors[product.status] || statusColors.active} text-[10px] px-1.5 py-0`}>
                            {product.status || 'active'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <div>
                            <div className="text-[10px] text-slate-600">Price</div>
                            <div className="font-semibold text-slate-900 text-sm">
                              ${product.price?.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-600">Stock</div>
                            <div className={`font-semibold text-sm ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                              {product.stock_quantity}
                            </div>
                          </div>
                          {margin > 0 && (
                            <div>
                              <div className="text-[10px] text-slate-600">Margin</div>
                              <div className="font-semibold text-green-600 flex items-center gap-0.5 text-sm">
                                <TrendingUp className="w-3 h-3" />
                                {margin}%
                              </div>
                            </div>
                          )}
                        </div>

                        {isLowStock && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            Low stock - reorder soon
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {filteredProducts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">No products found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search or add a new product
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}