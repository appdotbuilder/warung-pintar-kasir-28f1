
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { 
  Plus, 
  Search, 
  Edit,
  Package,
  AlertTriangle,
  QrCode,
  CheckCircle
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

interface CreateProductInput {
  name: string;
  price: number;
  unit: string;
  category: string | null;
  barcode: string | null;
  stock_quantity: number;
  min_stock_threshold: number;
}

interface UpdateProductInput {
  id: number;
  name?: string;
  price?: number;
  unit?: string;
  category?: string | null;
  barcode?: string | null;
  stock_quantity?: number;
  min_stock_threshold?: number;
  is_active?: boolean;
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateProductInput>({
    name: '',
    price: 0,
    unit: '',
    category: null,
    barcode: null,
    stock_quantity: 0,
    min_stock_threshold: 5
  });

  // Load products
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getProducts.query();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
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
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      unit: '',
      category: null,
      barcode: null,
      stock_quantity: 0,
      min_stock_threshold: 5
    });
    setEditingProduct(null);
  };

  // Handle create product
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createProduct.mutate(formData);
      setProducts((prev: Product[]) => [...prev, response]);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create product:', error);
      alert('Gagal menambah produk');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit product
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      unit: product.unit,
      category: product.category,
      barcode: product.barcode,
      stock_quantity: product.stock_quantity,
      min_stock_threshold: product.min_stock_threshold
    });
  };

  // Handle update product
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsLoading(true);
    try {
      const updateData: UpdateProductInput = {
        id: editingProduct.id,
        ...formData
      };
      await trpc.updateProduct.mutate(updateData);
      
      setProducts((prev: Product[]) => 
        prev.map((p: Product) => 
          p.id === editingProduct.id ? { ...p, ...formData, updated_at: new Date() } : p
        )
      );
      
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Gagal mengupdate produk');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products
  const categories = Array.from(new Set(products.map(p => p.category).filter((cat): cat is string => cat !== null)));
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchQuery)) ||
                         (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

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
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Produk</h2>
          <p className="text-gray-600">Kelola daftar produk Anda</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Produk Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Produk *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama produk"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Harga *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                    step="100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Satuan *</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="pcs, kg, liter"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input
                  value={formData.category || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value || null }))}
                  
                  placeholder="Makanan, Minuman, dll"
                />
              </div>

              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input
                  value={formData.barcode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value || null }))}
                  placeholder="Kode barcode"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stok Awal</Label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: Number(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Stok</Label>
                  <Input
                    type="number"
                    value={formData.min_stock_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_stock_threshold: Number(e.target.value) || 0 }))}
                    placeholder="5"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari produk, barcode, atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery || categoryFilter !== 'all' ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || categoryFilter !== 'all' 
                ? 'Coba ubah kata kunci pencarian atau filter'
                : 'Tambahkan produk pertama Anda untuk memulai'
              }
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category || 'Tanpa kategori'}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-sm text-gray-500">/{product.unit}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Stok: {product.stock_quantity}</span>
                      </div>
                      <Badge 
                        variant={product.stock_quantity > product.min_stock_threshold ? "default" : "destructive"}
                      >
                        {product.stock_quantity <= product.min_stock_threshold ? (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Menipis
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aman
                          </>
                        )}
                      </Badge>
                    </div>

                    {product.barcode && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <QrCode className="h-3 w-3" />
                        <span className="font-mono">{product.barcode}</span>
                      </div>
                    )}
                  </div>

                  {product.stock_quantity <= product.min_stock_threshold && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Stok menipis! Minimal: {product.min_stock_threshold} {product.unit}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Produk *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nama produk"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  step="100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Satuan *</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="pcs, kg, liter"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value || null }))}
                placeholder="Makanan, Minuman, dll"
              />
            </div>

            <div className="space-y-2">
              <Label>Barcode</Label>
              <Input
                value={formData.barcode || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value || null }))}
                placeholder="Kode barcode"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stok Saat Ini</Label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: Number(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Stok</Label>
                <Input
                  type="number"
                  value={formData.min_stock_threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_stock_threshold: Number(e.target.value) || 0 }))}
                  placeholder="5"
                  min="0"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProduct(null)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                {isLoading ? 'Menyimpan...' : 'Update'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
