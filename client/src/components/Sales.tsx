
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Search, 
  Trash2,
  Calculator,
  Receipt,
  AlertCircle,
  QrCode
} from 'lucide-react';

// Define local types to avoid import issues
interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string | null;
  barcode: string | null;
  stock_quantity: number;
  min_stock_threshold: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CreateSaleInput {
  customer_id: number | null;
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
  }>;
  discount_amount: number;
  payment_method: 'cash' | 'qris' | 'transfer';
  notes: string | null;
}

export function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number; unit_price: number }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [productsData, customersData] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getCustomers.query(),
        trpc.getSales.query()
      ]);
      setProducts(productsData);
      setCustomers(customersData);
    } catch {
      // Using stub data since backend is not implemented
      setProducts([
        {
          id: 1,
          name: 'Indomie Goreng',
          price: 3500,
          unit: 'pcs',
          category: 'Makanan',
          barcode: '8991234567890',
          stock_quantity: 50,
          min_stock_threshold: 10,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'Aqua 600ml',
          price: 4000,
          unit: 'botol',
          category: 'Minuman',
          barcode: '8991234567891',
          stock_quantity: 30,
          min_stock_threshold: 5,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
      setCustomers([
        {
          id: 1,
          name: 'Pelanggan Umum',
          phone: null,
          address: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add product to cart
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(prev => prev.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart(prev => [...prev, { product, quantity: 1, unit_price: product.price }]);
    }
  };

  // Update cart item quantity
  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const finalAmount = subtotal - discount;

  // Handle barcode scan/input
  const handleBarcodeInput = async (barcode: string) => {
    if (!barcode.trim()) return;
    
    try {
      const product = await trpc.getProductByBarcode.query(barcode);
      if (product) {
        addToCart(product);
        setBarcodeInput('');
      }
    } catch {
      // Try to find product in local state as fallback
      const product = products.find(p => p.barcode === barcode);
      if (product) {
        addToCart(product);
        setBarcodeInput('');
      } else {
        alert('Produk tidak ditemukan');
      }
    }
  };

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      alert('Keranjang kosong');
      return;
    }

    if (finalAmount < 0) {
      alert('Total tidak boleh negatif');
      return;
    }

    setIsLoading(true);
    try {
      const saleData: CreateSaleInput = {
        customer_id: selectedCustomer,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        discount_amount: discount,
        payment_method: paymentMethod,
        notes: notes || null
      };

      await trpc.createSale.mutate(saleData);
      
      // Reset form
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setNotes('');
      setPaymentMethod('cash');
      
      // Reload data
      loadData();
      
      alert('Transaksi berhasil disimpan!');
    } catch (error) {
      console.error('Failed to create sale:', error);
      alert('Gagal menyimpan transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchQuery)) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Penjualan</h2>
          <p className="text-gray-600">Buat transaksi penjualan baru</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barcode Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                <span>Scan Barcode</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Scan atau ketik barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeInput(barcodeInput);
                    }
                  }}
                />
                <Button onClick={() => handleBarcodeInput(barcodeInput)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card>
            <CardHeader>
              <CardTitle>Pilih Produk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.category}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-green-600">
                              {formatCurrency(product.price)}
                            </span>
                            <Badge variant={product.stock_quantity > product.min_stock_threshold ? "default" : "destructive"}>
                              Stok: {product.stock_quantity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-4">
          {/* Shopping Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Keranjang</span>
                </span>
                <Badge>{cart.length} item</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Keranjang kosong</p>
                  <p className="text-sm">Pilih produk untuk memulai</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{item.product.name}</h5>
                          <p className="text-xs text-gray-600">
                            {formatCurrency(item.unit_price)} x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Diskon:</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(finalAmount)}</span>
                    </div>
                  </div>
                
                </>
              )}
            </CardContent>
          </Card>

          {/* Checkout Form */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Checkout</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Selection */}
                <div className="space-y-2">
                  <Label>Pelanggan (Opsional)</Label>
                  <Select value={selectedCustomer?.toString() || 'none'} onValueChange={(value) => setSelectedCustomer(value === 'none' ? null : Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pelanggan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Pelanggan Umum</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Discount */}
                <div className="space-y-2">
                  <Label>Diskon</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    min="0"
                    max={subtotal}
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <Select value={paymentMethod} onValueChange={(value: 'cash' | 'qris' | 'transfer') => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Tunai</SelectItem>
                      <SelectItem value="qris">QRIS</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Show QR for QRIS */}
                {paymentMethod === 'qris' && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowQR(true)}
                      className="w-full"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Tampilkan QR Code
                    </Button>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Catatan (Opsional)</Label>
                  <Textarea
                    placeholder="Catatan transaksi..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Warning for negative total */}
                {finalAmount < 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Diskon tidak boleh lebih besar dari subtotal
                    </AlertDescription>
                  </Alert>
                )}

                {/* Process Sale Button */}
                <Button
                  onClick={processSale}
                  disabled={isLoading || finalAmount < 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    'Memproses...'
                  ) : (
                    <>
                      <Receipt className="h-4 w-4 mr-2" />
                      Proses Transaksi ({formatCurrency(finalAmount)})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <QrCode className="h-24 w-24 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Scan QR Code ini untuk pembayaran QRIS
            </p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(finalAmount)}
            </p>
            <Button onClick={() => setShowQR(false)} className="w-full">
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
