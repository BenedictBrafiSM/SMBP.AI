import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Search,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Copy,
  ArrowRight,
  ArrowUpRight,
  Wifi,
  CreditCard,
  Plus,
  Minus,
  Package
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showTapToPayDialog, setShowTapToPayDialog] = useState(false);
  const [tapAmount, setTapAmount] = useState("");
  const [isWaitingForTap, setIsWaitingForTap] = useState(false);
  const [amount, setAmount] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [note, setNote] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-created_date'),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create(data),
    onSuccess: async (payment) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      
      // Auto-send email
      if (payment.customer_email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: payment.customer_email,
            subject: `Payment Request - $${payment.amount.toFixed(2)}`,
            body: `You have a payment request for $${payment.amount.toFixed(2)}.\n\n${payment.description ? `For: ${payment.description}\n\n` : ''}Pay securely: ${payment.payment_link}\n\nThank you!`,
            from_name: "Sanka"
          });
        } catch (error) {
          console.error("Email error:", error);
        }
      }
      
      setShowRequestDialog(false);
      setAmount("");
      setCustomerEmail("");
      setNote("");
      toast.success("Payment request sent!");
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Payment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const handleRequestPayment = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!customerEmail) {
      toast.error("Enter customer email");
      return;
    }

    const feeRate = 0.029;
    const feeFixed = 0.30;
    const feeAmount = (amt * feeRate) + feeFixed;
    const totalAmount = amt + feeAmount; // Customer pays fees

    const invoiceNumber = `PAY-${Date.now()}`;
    const paymentLink = `https://pay.sanka.app/${invoiceNumber}`;

    createPaymentMutation.mutate({
      customer_email: customerEmail,
      amount: totalAmount,
      description: note,
      fee_amount: feeAmount,
      net_amount: amt,
      invoice_number: invoiceNumber,
      payment_link: paymentLink,
      status: "pending",
      payment_method: "card",
      payment_type: "one_time",
      payment_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleMarkPaid = (payment) => {
    updatePaymentMutation.mutate({
      id: payment.id,
      data: { status: "completed", payment_date: new Date().toISOString().split('T')[0] }
    });
    toast.success("Marked as paid");
  };

  const copyPaymentLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied!");
  };

  const addProductToCart = (product) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const updateProductQuantity = (productId, change) => {
    setSelectedProducts(selectedProducts.map(p => {
      if (p.id === productId) {
        const newQty = p.quantity + change;
        return newQty > 0 ? { ...p, quantity: newQty } : p;
      }
      return p;
    }).filter(p => p.quantity > 0));
  };

  const getCartTotal = () => {
    return selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  };

  const handleTapToPay = () => {
    const amt = getCartTotal();
    if (amt <= 0) {
      toast.error("Add products to cart");
      return;
    }
    setIsWaitingForTap(true);
    
    // Simulate tap detection (in real implementation, use Web NFC API)
    setTimeout(() => {
      const feeRate = 0.029;
      const feeFixed = 0.30;
      const feeAmount = (amt * feeRate) + feeFixed;
      const totalAmount = amt + feeAmount; // Customer pays fees

      const description = selectedProducts.map(p => `${p.name} x${p.quantity}`).join(", ");

      createPaymentMutation.mutate({
        amount: totalAmount,
        description: description,
        fee_amount: feeAmount,
        net_amount: amt,
        invoice_number: `TAP-${Date.now()}`,
        payment_link: "",
        status: "completed",
        payment_method: "card",
        payment_type: "one_time",
        payment_date: new Date().toISOString().split('T')[0],
      });

      setIsWaitingForTap(false);
      setShowTapToPayDialog(false);
      setSelectedProducts([]);
      setProductSearch("");
      toast.success("Payment accepted!");
    }, 2000);
  };

  const filteredPayments = payments.filter(p =>
    p.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalProcessed = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.net_amount || 0), 0);

  const pendingPayments = filteredPayments.filter(p => p.status === 'pending');
  const completedPayments = filteredPayments.filter(p => p.status === 'completed');

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Payments</h1>
          <p className="text-sm text-slate-600">Request and track payments</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setShowTapToPayDialog(true)}
            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Tap to Pay
          </Button>
          <Button
            onClick={() => setShowRequestDialog(true)}
            variant="outline"
            className="flex-1 h-12"
          >
            Request
          </Button>
        </div>

        {/* Balance Card */}
        <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 mb-6">
          <CardContent className="p-6">
            <div className="text-slate-400 text-sm mb-2">Available Balance</div>
            <div className="text-4xl font-bold text-white mb-4">
              ${totalProcessed.toFixed(2)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="text-slate-400">Pending</div>
                <div className="text-white font-semibold">${totalPending.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        {pendingPayments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Pending Requests</h2>
            <div className="space-y-2">
              {pendingPayments.map((payment) => (
                <Card key={payment.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">${payment.amount?.toFixed(2)}</div>
                        <div className="text-xs text-slate-600">{payment.customer_email}</div>
                        {payment.description && (
                          <div className="text-xs text-slate-500 mt-1">{payment.description}</div>
                        )}
                      </div>
                      <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => copyPaymentLink(payment.payment_link)}
                      >
                        <LinkIcon className="w-3 h-3 mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs bg-slate-900 hover:bg-slate-800"
                        onClick={() => handleMarkPaid(payment)}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Mark Paid
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        {completedPayments.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Activity</h2>
            <div className="space-y-2">
              {completedPayments.slice(0, 10).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        ${payment.amount?.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-600">{payment.customer_email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">
                      +${payment.net_amount?.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {payment.payment_date && format(new Date(payment.payment_date), 'MMM d')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {payments.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Start accepting payments</h3>
            <p className="text-sm text-slate-600 mb-6">
              Request payments via email or share a payment link
            </p>
            <Button
              onClick={() => setShowRequestDialog(true)}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Request Your First Payment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>

      {/* Tap to Pay Dialog */}
      <Dialog open={showTapToPayDialog} onOpenChange={(open) => {
        setShowTapToPayDialog(open);
        if (!open) {
          setSelectedProducts([]);
          setProductSearch("");
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Tap to Pay</DialogTitle>
          </DialogHeader>

          {!isWaitingForTap ? (
            <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
              {/* Search Products */}
              <div>
                <Label className="text-sm font-medium">Search Products</Label>
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search..."
                  className="mt-2"
                />
              </div>

              {/* Product List */}
              <div className="flex-1 overflow-y-auto border rounded-lg">
                {products
                  .filter(p => 
                    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
                    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
                  )
                  .slice(0, 10)
                  .map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addProductToCart(product)}
                      className="w-full p-3 border-b hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-slate-900">{product.name}</div>
                          <div className="text-xs text-slate-600">${product.price?.toFixed(2)}</div>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                {products.filter(p => 
                  p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.sku?.toLowerCase().includes(productSearch.toLowerCase())
                ).length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No products found
                  </div>
                )}
              </div>

              {/* Cart */}
              {selectedProducts.length > 0 && (
                <div className="border-t pt-3">
                  <Label className="text-sm font-medium mb-2 block">Cart</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg p-2">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{product.name}</div>
                          <div className="text-xs text-slate-600">${product.price?.toFixed(2)} each</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => updateProductQuantity(product.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-medium w-6 text-center">{product.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => updateProductQuantity(product.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-slate-400 text-xs mb-1">Total</div>
                <div className="text-white text-3xl font-bold">
                  ${getCartTotal().toFixed(2)}
                </div>
              </div>

              <Button
                onClick={handleTapToPay}
                disabled={selectedProducts.length === 0}
                className="w-full bg-slate-900 hover:bg-slate-800 h-11"
              >
                <Wifi className="w-4 h-4 mr-2" />
                Ready to Accept
              </Button>
            </div>
          ) : (
            <div className="py-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6"
                >
                  <CreditCard className="w-16 h-16 text-white" />
                </motion.div>
                <div className="text-xl font-bold text-slate-900 mb-2">
                  ${getCartTotal().toFixed(2)}
                </div>
                <div className="text-sm text-slate-600 mb-4">Hold card near device</div>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex gap-1"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Payment Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Request a Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Amount</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7 text-2xl h-14 font-semibold"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Customer Email</Label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Note (Optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's this for?"
                className="mt-2"
              />
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">You receive</span>
                  <span className="font-medium">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Processing fee (2.9% + $0.30)</span>
                  <span className="text-slate-600">+${((parseFloat(amount) * 0.029) + 0.30).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                  <span className="font-semibold">Customer pays</span>
                  <span className="font-semibold text-slate-900">
                    ${(parseFloat(amount) + (parseFloat(amount) * 0.029) + 0.30).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleRequestPayment}
              disabled={!amount || !customerEmail || createPaymentMutation.isPending}
              className="w-full bg-slate-900 hover:bg-slate-800 h-11"
            >
              Send Payment Request
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}