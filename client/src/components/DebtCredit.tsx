
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { 
  Plus, 
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  DollarSign,
  Users
} from 'lucide-react';

// Define local types to avoid import issues
interface DebtCredit {
  id: number;
  customer_id: number;
  type: 'debt' | 'credit';
  amount: number;
  remaining_amount: number;
  description: string | null;
  due_date: Date | null;
  is_paid: boolean;
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

interface CreateDebtCreditInput {
  customer_id: number;
  type: 'debt' | 'credit';
  amount: number;
  description: string | null;
  due_date: Date | null;
}

interface DebtCreditPaymentInput {
  debt_credit_id: number;
  payment_amount: number;
  notes: string | null;
}

export function DebtCredit() {
  const [debtCredits, setDebtCredits] = useState<DebtCredit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedDebtCredit, setSelectedDebtCredit] = useState<DebtCredit | null>(null);
  
  const [formData, setFormData] = useState<CreateDebtCreditInput>({
    customer_id: 0,
    type: 'debt',
    amount: 0,
    description: null,
    due_date: null
  });

  const [paymentData, setPaymentData] = useState<DebtCreditPaymentInput>({
    debt_credit_id: 0,
    payment_amount: 0,
    notes: null
  });

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [debtCreditsData, customersData] = await Promise.all([
        trpc.getDebtCredits.query(),
        trpc.getCustomers.query()
      ]);
      setDebtCredits(debtCreditsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Using stub data since backend is not implemented
      const stubCustomers: Customer[] = [
        {
          id: 1,
          name: 'Budi Santoso',
          phone: '081234567890',
          address: 'Jl. Merdeka No. 123',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'Siti Rahayu',
          phone: '082345678901',
          address: 'Jl. Sudirman No. 456',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const stubDebtCredits: DebtCredit[] = [
        {
          id: 1,
          customer_id: 1,
          type: 'debt',
          amount: 500000,
          remaining_amount: 300000,
          description: 'Utang pembelian barang',
          due_date: new Date('2024-02-15'),
          is_paid: false,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        {
          id: 2,
          customer_id: 2,
          type: 'credit',
          amount: 200000,
          remaining_amount: 200000,
          description: 'Piutang penjualan',
          due_date: new Date('2024-02-10'),
          is_paid: false,
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02')
        },
        {
          id: 3,
          customer_id: 1,
          type: 'debt',
          amount: 150000,
          remaining_amount: 0,
          description: 'Utang sudah lunas',
          due_date: new Date('2024-01-20'),
          is_paid: true,
          created_at: new Date('2023-12-15'),
          updated_at: new Date('2024-01-10')
        }
      ];

      setCustomers(stubCustomers);
      setDebtCredits(stubDebtCredits);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset forms
  const resetCreateForm = () => {
    setFormData({
      customer_id: 0,
      type: 'debt',
      amount: 0,
      description: null,
      due_date: null
    });
  };

  const resetPaymentForm = () => {
    setPaymentData({
      debt_credit_id: 0,
      payment_amount: 0,
      notes: null
    });
    setSelectedDebtCredit(null);
  };

  // Handle create debt/credit
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createDebtCredit.mutate(formData);
      setDebtCredits((prev: DebtCredit[]) => [response, ...prev]);
      setShowCreateDialog(false);
      resetCreateForm();
      alert(`${formData.type === 'debt' ? 'Hutang' : 'Piutang'} berhasil dicatat!`);
    } catch (error) {
      console.error('Failed to create debt/credit:', error);
      alert('Gagal mencatat data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtCredit) return;

    setIsLoading(true);
    try {
      await trpc.payDebtCredit.mutate(paymentData);
      
      // Update local state
      setDebtCredits((prev: DebtCredit[]) => 
        prev.map((dc: DebtCredit) => 
          dc.id === selectedDebtCredit.id 
            ? { 
                ...dc, 
                remaining_amount: dc.remaining_amount - paymentData.payment_amount,
                is_paid: (dc.remaining_amount - paymentData.payment_amount) <= 0,
                updated_at: new Date()
              }
            : dc
        )
      );
      
      setShowPaymentDialog(false);
      resetPaymentForm();
      alert('Pembayaran berhasil dicatat!');
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Gagal memproses pembayaran');
    } finally {
      setIsLoading(false);
    }
  };

  // Get customer name
  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown';
  };

  // Check if overdue
  const isOverdue = (debtCredit: DebtCredit) => {
    if (!debtCredit.due_date || debtCredit.is_paid) return false;
    return new Date() > debtCredit.due_date;
  };

  // Filter debt/credits
  const debts = debtCredits.filter(dc => dc.type === 'debt');
  const credits = debtCredits.filter(dc => dc.type === 'credit');
  const activeDebts = debts.filter(dc => !dc.is_paid);
  const activeCredits = credits.filter(dc => !dc.is_paid);
  const overdueItems = debtCredits.filter(isOverdue);

  // Calculate totals
  const totalDebts = debts.reduce((sum, dc) => sum + dc.remaining_amount, 0);
  const totalCredits = credits.reduce((sum, dc) => sum + dc.remaining_amount, 0);
  const overdueAmount = overdueItems.reduce((sum, dc) => sum + dc.remaining_amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handlePaymentClick = (debtCredit: DebtCredit) => {
    setSelectedDebtCredit(debtCredit);
    setPaymentData({
      debt_credit_id: debtCredit.id,
      payment_amount: Math.min(debtCredit.remaining_amount, 0),
      notes: null
    });
    setShowPaymentDialog(true);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Hutang & Piutang</h2>
          <p className="text-gray-600">Kelola hutang dan piutang pelanggan</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Hutang/Piutang</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Pelanggan *</Label>
                <Select 
                  value={formData.customer_id ? formData.customer_id.toString() : ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pelanggan" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Belum ada pelanggan
                      </SelectItem>
                    ) : (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Jenis *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'debt' | 'credit') => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debt">Hutang (Kami berhutang)</SelectItem>
                    <SelectItem value="credit">Piutang (Pelanggan berhutang)</SelectItem>
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
                <Label>Tanggal Jatuh Tempo</Label>
                <Input
                  type="date"
                  value={formData.due_date ? formatDate(formData.due_date) : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    due_date: e.target.value ? new Date(e.target.value) : null 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value || null }))}
                  placeholder="Keterangan..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetCreateForm();
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
                <p className="text-red-100 text-sm">Total Hutang</p>
                <p className="text-2xl font-bold">{formatCurrency(totalDebts)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Piutang</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCredits)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Jatuh Tempo</p>
                <p className="text-2xl font-bold">{formatCurrency(overdueAmount)}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Net Position</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCredits - totalDebts)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueItems.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{overdueItems.length} item</strong> sudah jatuh tempo dengan total{' '}
            <strong>{formatCurrency(overdueAmount)}</strong>. Segera lakukan penagihan atau pembayaran.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="debts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="debts" className="flex items-center space-x-2">
            <TrendingDown className="h-4 w-4" />
            <span>Hutang ({activeDebts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="credits" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Piutang ({activeCredits.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Debts Tab */}
        <TabsContent value="debts" className="space-y-4">
          {activeDebts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CreditCard className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Tidak ada hutang aktif</h3>
                <p className="text-gray-500">Semua hutang sudah lunas!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeDebts.map((debt) => (
                <Card key={debt.id} className={`hover:shadow-md transition-shadow ${isOverdue(debt) ? 'border-red-300 bg-red-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-800">
                            {getCustomerName(debt.customer_id)}
                          </h3>
                          {isOverdue(debt) && (
                            <Badge variant="destructive" className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Jatuh Tempo</span>
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Hutang: <strong>{formatCurrency(debt.amount)}</strong> • 
                            Sisa: <strong className="text-red-600">{formatCurrency(debt.remaining_amount)}</strong>
                          </p>
                          
                          {debt.due_date && (
                            <p className="text-sm text-gray-600">
                              Jatuh tempo: {debt.due_date.toLocaleDateString('id-ID')}
                            </p>
                          )}
                          
                          {debt.description && (
                            <p className="text-sm text-gray-600">{debt.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="text-xl font-bold text-red-600">
                          {formatCurrency(debt.remaining_amount)}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handlePaymentClick(debt)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Bayar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-4">
          {activeCredits.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Tidak ada piutang aktif</h3>
                <p className="text-gray-500">Semua piutang sudah terbayar!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeCredits.map((credit) => (
                <Card key={credit.id} className={`hover:shadow-md transition-shadow ${isOverdue(credit) ? 'border-orange-300 bg-orange-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-800">
                            {getCustomerName(credit.customer_id)}
                          </h3>
                          {isOverdue(credit) && (
                            <Badge variant="destructive" className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Jatuh Tempo</span>
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Piutang: <strong>{formatCurrency(credit.amount)}</strong> • 
                            Sisa: <strong className="text-green-600">{formatCurrency(credit.remaining_amount)}</strong>
                          </p>
                          
                          {credit.due_date && (
                            <p className="text-sm text-gray-600">
                              Jatuh tempo: {credit.due_date.toLocaleDateString('id-ID')}
                            </p>
                          )}
                          
                          {credit.description && (
                            <p className="text-sm text-gray-600">{credit.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(credit.remaining_amount)}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handlePaymentClick(credit)}
                          variant="outline"
                        >
                          Terima Bayar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDebtCredit?.type === 'debt' ? 'Bayar Hutang' : 'Terima Pembayaran'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDebtCredit && (
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">{getCustomerName(selectedDebtCredit.customer_id)}</h4>
                <p className="text-sm text-gray-600">
                  {selectedDebtCredit.type === 'debt' ? 'Hutang' : 'Piutang'}: {formatCurrency(selectedDebtCredit.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  Sisa: <strong>{formatCurrency(selectedDebtCredit.remaining_amount)}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Jumlah Pembayaran *</Label>
                <Input
                  type="number"
                  value={paymentData.payment_amount}
                  onChange={(e) => setPaymentData(prev => ({ 
                    ...prev, 
                    payment_amount: Number(e.target.value) || 0 
                  }))}
                  placeholder="0"
                  min="0"
                  max={selectedDebtCredit.remaining_amount}
                  step="1000"
                  required
                />
                <p className="text-xs text-gray-500">
                  Maksimal: {formatCurrency(selectedDebtCredit.remaining_amount)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  value={paymentData.notes || ''}
                  onChange={(e) => setPaymentData(prev => ({ 
                    ...prev, 
                    notes: e.target.value || null 
                  }))}
                  placeholder="Catatan pembayaran..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    resetPaymentForm();
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || paymentData.payment_amount <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Memproses...' : 'Bayar'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
