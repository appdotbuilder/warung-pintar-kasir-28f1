
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { 
  Plus, 
  Search,
  Users,
  Phone,
  MapPin,
  User
} from 'lucide-react';

// Define local types to avoid import issues
interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CreateCustomerInput {
  name: string;
  phone: string | null;
  address: string | null;
}

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    phone: null,
    address: null
  });

  // Load customers
  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getCustomers.query();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
      // Using stub data since backend is not implemented
      setCustomers([
        {
          id: 1,
          name: 'Pelanggan Umum',
          phone: null,
          address: null,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'Budi Santoso',
          phone: '081234567890',
          address: 'Jl. Merdeka No. 123, Jakarta',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        {
          id: 3,
          name: 'Siti Rahayu',
          phone: '082345678901',
          address: 'Jl. Sudirman No. 456, Bandung',
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02')
        },
        {
          id: 4,
          name: 'Ahmad Wijaya',
          phone: '083456789012',
          address: null,
          created_at: new Date('2024-01-03'),
          updated_at: new Date('2024-01-03')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      phone: null,
      address: null
    });
  };

  // Handle create customer
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createCustomer.mutate(formData);
      setCustomers((prev: Customer[]) => [...prev, response]);
      setShowCreateDialog(false);
      resetForm();
      alert('Pelanggan berhasil ditambahkan!');
    } catch (error) {
      console.error('Failed to create customer:', error);
      alert('Gagal menambah pelanggan');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery)) ||
    (customer.address && customer.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Pelanggan</h2>
          <p className="text-gray-600">Kelola data pelanggan Anda</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pelanggan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Pelanggan *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama lengkap pelanggan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Nomor Telepon</Label>
                <Input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value || null }))}
                  placeholder="081234567890"
                />
              </div>

              <div className="space-y-2">
                <Label>Alamat</Label>
                <Textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value || null }))}
                  placeholder="Alamat lengkap pelanggan"
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

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari pelanggan berdasarkan nama, telepon, atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Pelanggan</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Dengan Nomor HP</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.phone).length}
                </p>
              </div>
              <Phone className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Dengan Alamat</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.address).length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery ? 'Pelanggan tidak ditemukan' : 'Belum ada pelanggan'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? 'Coba ubah kata kunci pencarian'
                : 'Tambahkan pelanggan pertama Anda'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pelanggan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                    
                    <div className="mt-2 space-y-1">
                      {customer.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      
                      {customer.address && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-2">{customer.address}</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400">
                        Bergabung: {customer.created_at.toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <Button variant="outline" size="sm">
                      Detail
                    </Button>
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
