
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { 
  Package2, 
  AlertTriangle, 
  Edit,
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw
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

interface StockAdjustmentInput {
  product_id: number;
  new_quantity: number;
  notes: string | null;
}

export function Stock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentData, setAdjustmentData] = useState<StockAdjustmentInput>({
    product_id: 0,
    new_quantity: 0,
    notes: null
  });

  // Load stock data
  const loadStockData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsData, lowStockData] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getLowStockProducts.query()
      ]);
      setProducts(productsData);
      setLowStockProducts(lowStockData);
    } catch (error) {
      console.error('Failed to load stock data:', error);
      // Using stub data since backend is not implemented
      const stubProducts: Product[] = [
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
        },
        {
          id: 3,
          name: 'Teh Pucuk Harum',
          price: 5000,
          unit: 'botol',
          category: 'Minuman',
          barcode: '8991234567892',
          stock_quantity: 3,
          min_stock_threshold: 5,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          name: 'Beras Premium',
          price: 15000,
          unit: 'kg',
          category: 'Sembako',
          barcode: '8991234567893',
          stock_quantity: 2,
          min_stock_threshold: 10,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      setProducts(stubProducts);
      setLowStockProducts(stubProducts.filter(p => p.stock_quantity <= p.min_stock_threshold));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStockData();
  }, [loadStockData]);

  // Handle stock adjustment
  const handleStockAdjustment = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentData({
      product_id: product.id,
      new_quantity: product.stock_quantity,
      notes: null
    });
    setShowAdjustDialog(true);
  };

  // Process stock adjustment
  const processAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsLoading(true);
    try {
      await trpc.adjustStock.mutate(adjustmentData);
      
      // Update local state
      setProducts((prev: Product[]) => 
        prev.map((p: Product) => 
          p.id === selectedProduct.id 
            ? { ...p, stock_quantity: adjustmentData.new_quantity, updated_at: new Date() }
            : p
        )
      );
      
      setShowAdjustDialog(false);
      setSelectedProduct(null);
      setAdjustmentData({ product_id: 0, new_quantity: 0, notes: null });
      
      // Reload to update low stock list
      loadStockData();
      
      alert('Stok berhasil disesuaikan!');
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      alert('Gagal menyesuaikan stok');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (product.barcode && product.barcode.includes(searchQuery))
  );

  // Calculate stock statistics
  const totalProducts = products.length;
  const lowStockCount = lowStockProducts.length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.price), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return { status: 'Habis', color: 'destructive' as const };
    if (product.stock_quantity <= product.min_stock_threshold) return { status: 'Menipis', color: 'secondary' as const };
    return { status: 'Aman', color: 'default' as const };
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Stok</h2>
          <p className="text-gray-600">Pantau dan kelola stok barang</p>
        </div>
        <Button onClick={loadStockData} variant="outline" className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stock Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Produk</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <Package2 className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Stok Menipis</p>
                <p className="text-2xl font-bold">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Stok Habis</p>
                <p className="text-2xl font-bold">{outOfStockCount}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Nilai Stok</p>
                <p className="text-xl font-bold">{formatCurrency(totalStockValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{lowStockCount} produk</strong> memiliki stok menipis atau habis. 
            Segera lakukan restok untuk menghindari kehabisan barang.
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stock List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Tambahkan produk dari menu Produk'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{product.name}</h3>
                          <p className="text-sm text-gray-600">
                            {product.category} • {formatCurrency(product.price)}/{product.unit}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Stok saat ini:</span>
                          <span className="font-bold text-lg">
                            {product.stock_quantity} {product.unit}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Min. stok:</span>
                          <span className="text-sm font-medium">
                            {product.min_stock_threshold} {product.unit}
                          </span>
                        </div>
                        
                        <Badge variant={stockStatus.color}>
                          {stockStatus.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleStockAdjustment(product)}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Sesuaikan</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sesuaikan Stok</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <form onSubmit={processAdjustment} className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">{selectedProduct.name}</h4>
                <p className="text-sm text-gray-600">
                  Stok saat ini: {selectedProduct.stock_quantity} {selectedProduct.unit}
                </p>
                <p className="text-sm text-gray-600">
                  Minimum stok: {selectedProduct.min_stock_threshold} {selectedProduct.unit}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Stok Baru *</Label>
                <Input
                  type="number"
                  value={adjustmentData.new_quantity}
                  onChange={(e) => setAdjustmentData(prev => ({ 
                    ...prev, 
                    new_quantity: Number(e.target.value) || 0 
                  }))}
                  placeholder="Jumlah stok baru"
                  min="0"
                  required
                />
                <p className="text-xs text-gray-500">
                  Perubahan: {adjustmentData.new_quantity - selectedProduct.stock_quantity > 0 ? '+' : ''}
                  {adjustmentData.new_quantity - selectedProduct.stock_quantity} {selectedProduct.unit}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  value={adjustmentData.notes || ''}
                  onChange={(e) => setAdjustmentData(prev => ({ 
                    ...prev, 
                    notes: e.target.value || null 
                  }))}
                  placeholder="Alasan penyesuaian stok (opsional)"
                  rows={3}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdjustDialog(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Menyimpan...' : 'Sesuaikan Stok'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
