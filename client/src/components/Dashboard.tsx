
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  Clock,
  RefreshCw,
  DollarSign,
  Package,
  Users
} from 'lucide-react';

// Define local types to avoid import issues
interface DashboardSummary {
  today_sales: number;
  today_transactions: number;
  low_stock_products: number;
  overdue_debts: number;
  top_selling_products: Array<{
    product_name: string;
    total_sold: number;
  }>;
}

interface DashboardProps {
  data: DashboardSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function Dashboard({ data, isLoading, onRefresh }: DashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-600">Ringkasan bisnis hari ini</p>
        </div>
        <Button 
          onClick={onRefresh} 
          variant="outline" 
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Penjualan Hari Ini</p>
                <p className="text-2xl font-bold">
                  {data ? formatCurrency(data.today_sales) : formatCurrency(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Transaksi Hari Ini</p>
                <p className="text-2xl font-bold">
                  {data ? data.today_transactions : 0}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Stok Menipis</p>
                <p className="text-2xl font-bold">
                  {data ? data.low_stock_products : 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Hutang Jatuh Tempo</p>
                <p className="text-2xl font-bold">
                  {data ? data.overdue_debts : 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Notifikasi Penting</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data && data.low_stock_products > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-orange-800">Stok Menipis</p>
                    <p className="text-sm text-orange-600">
                      {data.low_stock_products} produk perlu di-restock
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  {data.low_stock_products}
                </Badge>
              </div>
            )}

            {data && data.overdue_debts > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-800">Hutang Jatuh Tempo</p>
                    <p className="text-sm text-red-600">
                      {data.overdue_debts} hutang sudah jatuh tempo
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-red-600 border-red-600">
                  {data.overdue_debts}
                </Badge>
              </div>
            )}

            {(!data || (data.low_stock_products === 0 && data.overdue_debts === 0)) && (
              <div className="flex items-center justify-center p-8 text-gray-500">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada notifikasi penting</p>
                  <p className="text-sm">Semua berjalan lancar! 🎉</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Produk Terlaris</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.top_selling_products.length > 0 ? (
              <div className="space-y-3">
                {data.top_selling_products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{product.product_name}</p>
                        <p className="text-sm text-gray-600">Terjual: {product.total_sold} unit</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {product.total_sold}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Belum ada data penjualan</p>
                  <p className="text-sm">Mulai transaksi pertama Anda!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col space-y-2 bg-green-600 hover:bg-green-700">
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">Transaksi Baru</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Package className="h-6 w-6" />
              <span className="text-sm">Tambah Produk</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Tambah Pelanggan</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Lihat Laporan</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
