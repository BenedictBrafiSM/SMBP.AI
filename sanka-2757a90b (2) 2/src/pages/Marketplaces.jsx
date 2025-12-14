import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Store, 
  Plus, 
  ExternalLink, 
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Marketplaces() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [listingDialog, setListingDialog] = useState(false);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState([]);
  const [listingData, setListingData] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-updated_date'),
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['marketplaceListings'],
    queryFn: () => base44.entities.MarketplaceListing.list('-created_date'),
  });

  const marketplaces = [
    { id: "ebay", name: "eBay", color: "bg-yellow-500", icon: "🛒" },
    { id: "etsy", name: "Etsy", color: "bg-orange-500", icon: "🎨" },
    { id: "shopify", name: "Shopify", color: "bg-green-500", icon: "🛍️" },
    { id: "amazon", name: "Amazon", color: "bg-orange-600", icon: "📦" },
    { id: "walmart", name: "Walmart", color: "bg-blue-600", icon: "🏪" },
    { id: "grailed", name: "Grailed", color: "bg-slate-800", icon: "👕" },
    { id: "stockx", name: "StockX", color: "bg-emerald-600", icon: "👟" },
    { id: "michaels", name: "Michaels", color: "bg-red-500", icon: "🎨" },
  ];

  const handleOpenListing = (product) => {
    setSelectedProduct(product);
    setSelectedMarketplaces([]);
    setListingData({
      title: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      quantity: product.stock_quantity?.toString() || "",
    });
    setListingDialog(true);
  };

  const toggleMarketplace = (marketplaceId) => {
    setSelectedMarketplaces(prev =>
      prev.includes(marketplaceId)
        ? prev.filter(id => id !== marketplaceId)
        : [...prev, marketplaceId]
    );
  };

  const generateOptimizedListing = async () => {
    if (!selectedProduct) return;
    
    setIsGenerating(true);
    try {
      const prompt = `Create an optimized marketplace listing for this product:
      
Product: ${selectedProduct.name}
Category: ${selectedProduct.category}
Current Description: ${selectedProduct.description || 'No description'}
Price: $${selectedProduct.price}

Generate:
1. A compelling, SEO-optimized title (50-80 characters)
2. A detailed, persuasive product description (150-300 words) that:
   - Highlights key features and benefits
   - Uses bullet points for readability
   - Includes relevant keywords
   - Creates urgency or desire
   - Addresses common buyer questions

Optimize for multiple marketplaces including eBay, Amazon, Etsy, etc.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" }
          }
        }
      });

      setListingData({
        ...listingData,
        title: response.title,
        description: response.description,
      });
      toast.success("Listing optimized with AI!");
    } catch (error) {
      console.error("Error generating listing:", error);
      toast.error("Failed to generate listing");
    } finally {
      setIsGenerating(false);
    }
  };

  const createListings = async () => {
    if (!selectedProduct || selectedMarketplaces.length === 0) return;
    
    setIsCreating(true);
    try {
      const listingsToCreate = selectedMarketplaces.map(marketplace => ({
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        marketplace: marketplace,
        listing_title: listingData.title,
        listing_description: listingData.description,
        price: parseFloat(listingData.price) || selectedProduct.price,
        quantity: parseInt(listingData.quantity) || selectedProduct.stock_quantity,
        status: "active",
        sync_enabled: true,
        last_synced: new Date().toISOString(),
      }));

      for (const listing of listingsToCreate) {
        await base44.entities.MarketplaceListing.create(listing);
      }

      queryClient.invalidateQueries({ queryKey: ['marketplaceListings'] });
      toast.success(`Listed on ${selectedMarketplaces.length} marketplace(s)!`);
      setListingDialog(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error creating listings:", error);
      toast.error("Failed to create listings");
    } finally {
      setIsCreating(false);
    }
  };

  const getProductListings = (productId) => {
    return listings.filter(l => l.product_id === productId);
  };

  const statusColors = {
    draft: "bg-slate-100 text-slate-700",
    active: "bg-green-100 text-green-700",
    sold: "bg-blue-100 text-blue-700",
    ended: "bg-orange-100 text-orange-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
            <Store className="w-5 h-5 text-indigo-600" />
            Cross-Listing
          </h1>
          <p className="text-xs text-slate-600">
            List products across multiple marketplaces
          </p>
        </div>

        {/* Marketplace Overview */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Connected Marketplaces</h3>
            <div className="grid grid-cols-4 gap-2">
              {marketplaces.map((marketplace) => (
                <div
                  key={marketplace.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center"
                >
                  <div className="text-2xl mb-1">{marketplace.icon}</div>
                  <div className="text-[10px] font-medium truncate">
                    {marketplace.name}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Listing Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-slate-900">
                {listings.filter(l => l.status === 'active').length}
              </div>
              <div className="text-xs text-slate-600 mt-1">Active</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-slate-900">
                {listings.filter(l => l.status === 'sold').length}
              </div>
              <div className="text-xs text-slate-600 mt-1">Sold</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-slate-900">
                {new Set(listings.map(l => l.product_id)).size}
              </div>
              <div className="text-xs text-slate-600 mt-1">Products</div>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Your Products
          </h2>
        </div>

        <div className="space-y-3">
          {products.map((product, idx) => {
            const productListings = getProductListings(product.id);
            const listedOn = productListings.map(l => l.marketplace);

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
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm truncate">
                              {product.name}
                            </h3>
                            <p className="text-xs text-slate-600">
                              ${product.price?.toFixed(2)} • {product.stock_quantity} in stock
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleOpenListing(product)}
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            List
                          </Button>
                        </div>

                        {/* Listed Marketplaces */}
                        {listedOn.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {listedOn.map((marketplace) => {
                              const mp = marketplaces.find(m => m.id === marketplace);
                              return (
                                <Badge
                                  key={marketplace}
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-auto"
                                >
                                  {mp?.icon} {mp?.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {products.length === 0 && (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">No products yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Add products to start cross-listing
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Listing Dialog */}
      <Dialog open={listingDialog} onOpenChange={setListingDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cross-List Product</DialogTitle>
            <DialogDescription>
              Create optimized listings across multiple marketplaces
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* AI Generate Button */}
            <Button
              onClick={generateOptimizedListing}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Optimize with AI
                </>
              )}
            </Button>

            {/* Listing Fields */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium">Listing Title</Label>
              <Input
                id="title"
                value={listingData.title}
                onChange={(e) => setListingData({ ...listingData, title: e.target.value })}
                placeholder="Optimized product title"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={listingData.description}
                onChange={(e) => setListingData({ ...listingData, description: e.target.value })}
                placeholder="Detailed product description"
                className="mt-2 min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-sm font-medium">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={listingData.price}
                  onChange={(e) => setListingData({ ...listingData, price: e.target.value })}
                  placeholder="0.00"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={listingData.quantity}
                  onChange={(e) => setListingData({ ...listingData, quantity: e.target.value })}
                  placeholder="0"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Marketplace Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Select Marketplaces</Label>
              <div className="grid grid-cols-2 gap-3">
                {marketplaces.map((marketplace) => (
                  <button
                    key={marketplace.id}
                    onClick={() => toggleMarketplace(marketplace.id)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      selectedMarketplaces.includes(marketplace.id)
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-2xl">{marketplace.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm">{marketplace.name}</div>
                    </div>
                    {selectedMarketplaces.includes(marketplace.id) && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Note:</strong> This creates listings in your Sanka inventory. To sync with actual marketplace accounts, connect your accounts in Settings.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setListingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={createListings}
              disabled={!listingData.title || selectedMarketplaces.length === 0 || isCreating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Store className="w-4 h-4 mr-2" />
                  Create Listings ({selectedMarketplaces.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}