import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Scan,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  X,
  Plus,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function InventoryOnboarding() {
  const [step, setStep] = useState("choose"); // choose, upload, manual, review, complete
  const [uploadType, setUploadType] = useState(null); // csv, document, barcode
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState([]);
  const [manualProducts, setManualProducts] = useState([]);
  const [currentBarcode, setCurrentBarcode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const uploadOptions = [
    {
      id: "csv",
      title: "Upload CSV/Excel",
      description: "Import products from spreadsheet",
      icon: FileSpreadsheet,
      color: "from-green-500 to-emerald-600",
      accepts: ".csv,.xlsx,.xls"
    },
    {
      id: "document",
      title: "Upload Documents",
      description: "Extract from photos or PDFs",
      icon: FileText,
      color: "from-blue-500 to-indigo-600",
      accepts: ".pdf,.png,.jpg,.jpeg"
    },
    {
      id: "barcode",
      title: "Scan Barcodes",
      description: "Add products one by one",
      icon: Scan,
      color: "from-purple-500 to-pink-600",
      accepts: null
    }
  ];

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStep("upload");
    setIsProcessing(true);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: selectedFile
      });

      // Define schema for extraction
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            sku: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            price: { type: "number" },
            cost: { type: "number" },
            stock_quantity: { type: "number" }
          },
          required: ["name", "price", "stock_quantity"]
        }
      };

      // Extract data
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: schema
      });

      if (result.status === "success") {
        setExtractedProducts(result.output || []);
        setStep("review");
      } else {
        toast.error("Failed to extract products: " + result.details);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process file");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBarcodeAdd = () => {
    if (!currentBarcode.trim()) {
      toast.error("Enter a barcode or product name");
      return;
    }

    const newProduct = {
      name: currentBarcode,
      sku: currentBarcode,
      price: 0,
      stock_quantity: 1,
      category: "other",
      isNew: true
    };

    setManualProducts([...manualProducts, newProduct]);
    setCurrentBarcode("");
    toast.success("Product added");
  };

  const updateProduct = (index, field, value) => {
    const products = step === "manual" ? [...manualProducts] : [...extractedProducts];
    products[index][field] = value;
    
    if (step === "manual") {
      setManualProducts(products);
    } else {
      setExtractedProducts(products);
    }
  };

  const removeProduct = (index) => {
    if (step === "manual") {
      setManualProducts(manualProducts.filter((_, i) => i !== index));
    } else {
      setExtractedProducts(extractedProducts.filter((_, i) => i !== index));
    }
  };

  const handleSaveProducts = async () => {
    const productsToSave = step === "manual" ? manualProducts : extractedProducts;
    
    if (productsToSave.length === 0) {
      toast.error("No products to save");
      return;
    }

    setIsSaving(true);
    try {
      const cleanedProducts = productsToSave.map(p => ({
        name: p.name || "Unnamed Product",
        sku: p.sku || "",
        description: p.description || "",
        category: p.category || "other",
        price: parseFloat(p.price) || 0,
        cost: parseFloat(p.cost) || 0,
        stock_quantity: parseInt(p.stock_quantity) || 0,
        status: "active"
      }));

      await base44.entities.Product.bulkCreate(cleanedProducts);
      
      setStep("complete");
      toast.success(`${cleanedProducts.length} products added!`);
    } catch (error) {
      console.error("Error saving products:", error);
      toast.error("Failed to save products");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <AnimatePresence mode="wait">
          {step === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Add Your Inventory
                </h1>
                <p className="text-slate-600">
                  Choose how you'd like to import your products
                </p>
              </div>

              <div className="grid gap-4 mb-6">
                {uploadOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Card
                      key={option.id}
                      className="border-2 border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => {
                        if (option.id === "barcode") {
                          setUploadType("barcode");
                          setStep("manual");
                        } else {
                          setUploadType(option.id);
                          document.getElementById(`file-input-${option.id}`).click();
                        }
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {option.title}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {option.description}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <input
                id="file-input-csv"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                id="file-input-document"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileSelect}
              />
            </motion.div>
          )}

          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6"
                    >
                      <Upload className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Processing Your File
                    </h2>
                    <p className="text-slate-600 mb-4">
                      Extracting product information...
                    </p>
                    <div className="flex justify-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          className="w-2 h-2 rounded-full bg-indigo-600"
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "manual" && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Scan Products
                  </h2>
                  <p className="text-sm text-slate-600">
                    {manualProducts.length} products added
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep("choose")}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <Card className="border-0 shadow-lg mb-4">
                <CardContent className="p-6">
                  <Label className="text-sm font-medium mb-2 block">
                    Barcode or Product Name
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      value={currentBarcode}
                      onChange={(e) => setCurrentBarcode(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleBarcodeAdd()}
                      placeholder="Scan or type..."
                      className="flex-1 h-12 text-lg"
                      autoFocus
                    />
                    <Button
                      onClick={handleBarcodeAdd}
                      className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3 mb-6">
                {manualProducts.map((product, index) => (
                  <Card key={index} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs text-slate-600">Product Name</Label>
                          <Input
                            value={product.name}
                            onChange={(e) => updateProduct(index, "name", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Price</Label>
                          <Input
                            type="number"
                            value={product.price}
                            onChange={(e) => updateProduct(index, "price", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Stock</Label>
                          <Input
                            type="number"
                            value={product.stock_quantity}
                            onChange={(e) => updateProduct(index, "stock_quantity", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {manualProducts.length > 0 && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("choose")}
                    className="flex-1 h-12"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSaveProducts}
                    disabled={isSaving}
                    className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save {manualProducts.length} Products
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Review Products
                  </h2>
                  <p className="text-sm text-slate-600">
                    {extractedProducts.length} products extracted
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep("choose")}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto">
                {extractedProducts.map((product, index) => (
                  <Card key={index} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-slate-600">Name</Label>
                          <Input
                            value={product.name || ""}
                            onChange={(e) => updateProduct(index, "name", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">SKU</Label>
                          <Input
                            value={product.sku || ""}
                            onChange={(e) => updateProduct(index, "sku", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Price</Label>
                          <Input
                            type="number"
                            value={product.price || ""}
                            onChange={(e) => updateProduct(index, "price", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Cost</Label>
                          <Input
                            type="number"
                            value={product.cost || ""}
                            onChange={(e) => updateProduct(index, "cost", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Stock</Label>
                          <Input
                            type="number"
                            value={product.stock_quantity || ""}
                            onChange={(e) => updateProduct(index, "stock_quantity", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(index)}
                            className="text-red-600 hover:text-red-700 w-full"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("choose")}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSaveProducts}
                  disabled={isSaving || extractedProducts.length === 0}
                  className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save {extractedProducts.length} Products
                      <CheckCircle2 className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12">
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-3">
                      Inventory Added!
                    </h2>
                    <p className="text-slate-600 mb-8">
                      Your products have been successfully imported
                    </p>
                    <Button
                      onClick={() => navigate(createPageUrl("Inventory"))}
                      className="h-12 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      View Inventory
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}