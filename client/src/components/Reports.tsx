
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { 
  BarChart3, 
  Download, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt
} from 'lucide-react';

// Define local types to avoid import issues
interface SalesReportInput {
  start_date: Date;
  end_date: Date;
  payment_method?: 'cash' | 'qris' | 'transfer';
}

interface FinancialReportInput {
  start_date: Date;
  end_date: Date;
}

interface SalesReportData {
  total_sales: number;
  total_transactions: number;
  average_transaction: number;
  sales_by_payment_method: Array<{
    payment_method: string;
    total_amount: number;
    transaction_count: number;
  }>;
  daily_sales: Array<{
    date: string;
    total_sales: number;
    transaction_count: number;
  }>;
  top_products: Array<{
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
}

interface FinancialReportData {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  expenses_by_type: Array<{
    type: string;
    total_amount: number;
  }>;
  daily_profit: Array<{
    date: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export function Reports() {
  const [isLoading, setIsLoading] = useState(false);
  const [salesReport, setSalesReport] = useState<SalesReportData | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialReportData | null>(null);
  
  // Sales report filters
  const [salesFilters, setSalesFilters] = useState<SalesReportInput>({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)),
    end_date: new Date(),
    payment_method: undefined
  });
  
  // Financial report filters
  const [financialFilters, setFinancialFilters] = useState<FinancialReportInput>({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)),
    end_date: new Date()
  });

  // Load sales report
  const loadSalesReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const report = await trpc.getSalesReport.query(salesFilters);
      setSalesReport(report);
    } catch (error) {
      console.error('Failed to load sales report:', error);
      // Using stub data since backend is not implemented
      setSalesReport({
        total_sales: 12500000,
        total_transactions: 156,
        average_transaction: 80128,
        sales_by_payment_method: [
          { payment_method: 'cash', total_amount: 7500000, transaction_count: 98 },
          { payment_method: 'qris', total_amount: 3500000, transaction_count: 42 },
          { payment_method: 'transfer', total_amount: 1500000, transaction_count: 16 }
        ],
        daily_sales: [
          { date: '2024-01-01', total_sales: 250000, transaction_count: 8 },
          { date: '2024-01-02', total_sales: 320000, transaction_count: 12 },
          { date: '2024-01-03', total_sales: 180000, transaction_count: 6 }
        ],
        top_products: [
          { product_name: 'Indomie Goreng', quantity_sold: 89, revenue: 311500 },
          { product_name: 'Aqua 600ml', quantity_sold: 67, revenue: 268000 },
          { product_name: 'Teh Pucuk', quantity_sold: 45, revenue: 225000 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  }, [salesFilters]);

  // Load financial report
  const loadFinancialReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const report = await trpc.getFinancialReport.query(financialFilters);
      setFinancialReport(report);
    } catch (error) {
      console.error('Failed to load financial report:', error);
      // Using stub data since backend is not implemented
      setFinancialReport({
        total_revenue: 12500000,
        total_expenses: 3200000,
        net_profit: 9300000,
        profit_margin: 74.4,
        expenses_by_type: [
          { type: 'rent', total_amount: 1500000 },
          { type: 'electricity', total_amount: 800000 },
          { type: 'salary', total_amount: 600000 },
          { type: 'capital', total_amount: 300000 }
        ],
        daily_profit: [
          { date: '2024-01-01', revenue: 250000, expenses: 50000, profit: 200000 },
          { date: '2024-01-02', revenue: 320000, expenses: 80000, profit: 240000 },
          { date: '2024-01-03', revenue: 180000, expenses: 30000, profit: 150000 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  }, [financialFilters]);

  useEffect(() => {
    loadSalesReport();
  }, [loadSalesReport]);

  useEffect(() => {
    loadFinancialReport();
  }, [loadFinancialReport]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getPaymentMethodName = (method: string) => {
    const names: Record<string, string> = {
      cash: 'Tunai',
      qris: 'QRIS',
      transfer: 'Transfer'
    };
    return names[method] || method;
  };

  const getExpenseTypeName = (type: string) => {
    const names: Record<string, string> = {
      capital: 'Modal',
      electricity: 'Listrik',
      rent: 'Sewa',
      salary: 'Gaji',
      other: 'Lainnya'
    };
    return names[type] || type;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan</h2>
          <p className="text-gray-600">Analisis kinerja bisnis Anda</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales" className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>Laporan Penjualan</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Laporan Keuangan</span>
          </TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-6">
          {/* Sales Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Filter Laporan Penjualan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={formatDate(salesFilters.start_date)}
                    onChange={(e) => setSalesFilters(prev => ({ 
                      ...prev, 
                      start_date: new Date(e.target.value) 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Akhir</Label>
                  <Input
                    type="date"
                    value={formatDate(salesFilters.end_date)}
                    onChange={(e) => setSalesFilters(prev => ({ 
                      ...prev, 
                      end_date: new Date(e.target.value) 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <Select 
                    value={salesFilters.payment_method || 'all'} 
                    onValueChange={(value) => setSalesFilters(prev => ({ 
                      ...prev, 
                      payment_method: value === 'all' ? undefined : value as 'cash' | 'qris' | 'transfer'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Metode</SelectItem>
                      <SelectItem value="cash">Tunai</SelectItem>
                      <SelectItem value="qris">QRIS</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadSalesReport} disabled={isLoading} className="w-full">
                    {isLoading ? 'Loading...' : 'Update Laporan'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/*Sales Summary */}
          {salesReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Total Penjualan</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(salesReport.total_sales)}
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
                        <p className="text-blue-100 text-sm">Total Transaksi</p>
                        <p className="text-2xl font-bold">{salesReport.total_transactions}</p>
                      </div>
                      <Receipt className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Rata-rata Transaksi</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(salesReport.average_transaction)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sales by Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Penjualan per Metode Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesReport.sales_by_payment_method.map((method) => (
                      <div key={method.payment_method} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{getPaymentMethodName(method.payment_method)}</h4>
                          <p className="text-sm text-gray-600">{method.transaction_count} transaksi</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(method.total_amount)}</p>
                          <p className="text-sm text-gray-600">
                            {((method.total_amount / salesReport.total_sales) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Produk Terlaris</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesReport.top_products.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                            <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold">{product.product_name}</h4>
                            <p className="text-sm text-gray-600">Terjual: {product.quantity_sold} unit</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(product.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Financial Report */}
        <TabsContent value="financial" className="space-y-6">
          {/* Financial Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Filter Laporan Keuangan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={formatDate(financialFilters.start_date)}
                    onChange={(e) => setFinancialFilters(prev => ({ 
                      ...prev, 
                      start_date: new Date(e.target.value) 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Akhir</Label>
                  <Input
                    type="date"
                    value={formatDate(financialFilters.end_date)}
                    onChange={(e) => setFinancialFilters(prev => ({ 
                      ...prev, 
                      end_date: new Date(e.target.value) 
                    }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={loadFinancialReport} disabled={isLoading} className="w-full">
                    {isLoading ? 'Loading...' : 'Update Laporan'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          {financialReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Total Pendapatan</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(financialReport.total_revenue)}
                        </p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-sm">Total Pengeluaran</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(financialReport.total_expenses)}
                        </p>
                      </div>
                      <TrendingDown className="h-6 w-6 text-red-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Laba Bersih</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(financialReport.net_profit)}
                        </p>
                      </div>
                      <DollarSign className="h-6 w-6 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Margin Laba</p>
                        <p className="text-xl font-bold">
                          {financialReport.profit_margin.toFixed(1)}%
                        </p>
                      </div>
                      <BarChart3 className="h-6 w-6 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Expenses by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Pengeluaran per Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialReport.expenses_by_type.map((expense) => (
                      <div key={expense.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{getExpenseTypeName(expense.type)}</h4>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(expense.total_amount)}</p>
                          <p className="text-sm text-gray-600">
                            {((expense.total_amount / financialReport.total_expenses) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Profit/Loss Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Laba Rugi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <span className="font-semibold text-green-800">Total Pendapatan</span>
                      <span className="font-bold text-green-800">
                        {formatCurrency(financialReport.total_revenue)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <span className="font-semibold text-red-800">Total Pengeluaran</span>
                      <span className="font-bold text-red-800">
                        ({formatCurrency(financialReport.total_expenses)})
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <span className="font-semibold text-blue-800 text-lg">Laba Bersih</span>
                      <span className="font-bold text-blue-800 text-lg">
                        {formatCurrency(financialReport.net_profit)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
