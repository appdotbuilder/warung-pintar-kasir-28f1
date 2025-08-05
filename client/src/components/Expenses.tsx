
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { 
  Plus, 
  Receipt,
  TrendingDown,
  Calendar,
  Search,
  DollarSign
} from 'lucide-react';

// Define local types to avoid import issues
interface Expense {
  id: number;
  type: 'capital' | 'electricity' | 'rent' | 'salary' | 'other';
  amount: number;
  description: string | null;
  expense_date: Date;
  created_at: Date;
  updated_at: Date;
}

interface CreateExpenseInput {
  type: 'capital' | 'electricity' | 'rent' | 'salary' | 'other';
  amount: number;
  description: string | null;
  expense_date: Date;
}

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [formData, setFormData] = useState<CreateExpenseInput>({
    type: 'other',
    amount: 0,
    description: null,
    expense_date: new Date()
  });

  // Load expenses
  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getExpenses.query();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      // Using stub data since backend is not implemented
      setExpenses([
        {
          id: 1,
          type: 'rent',
          amount: 1500000,
          description: 'Sewa toko bulan Januari',
          expense_date: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        {
          id: 2,
          type: 'electricity',
          amount: 450000,
          description: 'Tagihan listrik bulan Januari',
          expense_date: new Date('2024-01-02'),
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02')
        },
        {
          id: 3,
          type: 'capital',
          amount: 2000000,
          description: 'Pembelian stok barang',
          expense_date: new Date('2024-01-03'),
          created_at: new Date('2024-01-03'),
          updated_at: new Date('2024-01-03')
        },
        {
          id: 4,
          type: 'salary',
          amount: 1200000,
          description: 'Gaji karyawan bulan Januari',
          expense_date: new Date('2024-01-04'),
          created_at: new Date('2024-01-04'),
          updated_at: new Date('2024-01-04')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'other',
      amount: 0,
      description: null,
      expense_date: new Date()
    });
  };

  // Handle create expense
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createExpense.mutate(formData);
      setExpenses((prev: Expense[]) => [response, ...prev]);
      setShowCreateDialog(false);
      resetForm();
      alert('Pengeluaran berhasil dicatat!');
    } catch (error) {
      console.error('Failed to create expense:', error);
      alert('Gagal mencatat pengeluaran');
    } finally {
      setIsLoading(false);
    }
  };

  // Get expense type names
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

  const getExpenseTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      capital: 'bg-blue-100 text-blue-800',
      electricity: 'bg-yellow-100 text-yellow-800',
      rent: 'bg-purple-100 text-purple-800',
      salary: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = (expense.description && expense.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         getExpenseTypeName(expense.type).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || expense.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseMonth = expense.expense_date.getMonth();
      const currentMonth = new Date().getMonth();
      return expenseMonth === currentMonth;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const expensesByType = expenses.reduce((acc, expense) => {
    acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

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

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pencatatan Pengeluaran</h2>
          <p className="text-gray-600">Catat dan pantau pengeluaran bisnis</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Catat Pengeluaran
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Jenis Pengeluaran *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'capital' | 'electricity' | 'rent' | 'salary' | 'other') => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="capital">Modal</SelectItem>
                    <SelectItem value="electricity">Listrik</SelectItem>
                    <SelectItem value="rent">Sewa</SelectItem>
                    <SelectItem value="salary">Gaji</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Jumlah *</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tanggal Pengeluaran *</Label>
                <Input
                  type="date"
                  value={formatDate(formData.expense_date)}
                  onChange={(e) => setFormData(prev => ({ ...prev, expense_date: new Date(e.target.value) }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value || null }))}
                  placeholder="Keterangan pengeluaran..."
                  rows={3}
                />
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Total Pengeluaran</p>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Bulan Ini</p>
                <p className="text-2xl font-bold">{formatCurrency(monthlyExpenses)}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Transaksi</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Rata-rata</p>
                <p className="text-2xl font-bold">
                  {expenses.length > 0 ? formatCurrency(totalExpenses / expenses.length) : formatCurrency(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-200" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(expensesByType).map(([type, amount]) => (
              <div key={type} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{getExpenseTypeName(type)}</h4>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(amount)}</p>
                  </div>
                  <Badge className={getExpenseTypeColor(type)}>
                    {((amount / totalExpenses) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari pengeluaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter || 'all'} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="capital">Modal</SelectItem>
                <SelectItem value="electricity">Listrik</SelectItem>
                <SelectItem value="rent">Sewa</SelectItem>
                <SelectItem value="salary">Gaji</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expense List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery || typeFilter !== 'all' ? 'Pengeluaran tidak ditemukan' : 'Belum ada pengeluaran'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || typeFilter !== 'all' 
                ? 'Coba ubah kata kunci pencarian atau filter'
                : 'Catat pengeluaran pertama Anda'
              }
            </p>
            {!searchQuery && typeFilter === 'all' && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Catat Pengeluaran
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge className={getExpenseTypeColor(expense.type)}>
                        {getExpenseTypeName(expense.type)}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {expense.expense_date.toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {formatCurrency(expense.amount)}
                    </h3>
                    
                    {expense.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {expense.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-2">
                      Dicatat: {expense.created_at.toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
