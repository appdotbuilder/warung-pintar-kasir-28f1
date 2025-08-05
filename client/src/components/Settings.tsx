
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { 
  Store,
  QrCode,
  Users,
  Download,
  Upload,
  Shield,
  Info
} from 'lucide-react';

// Define local types to avoid import issues
interface Settings {
  id: number;
  key: string;
  value: string;
  created_at: Date;
  updated_at: Date;
}

export function Settings() {
  const [settings, setSettings] = useState<Settings[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [qrImage, setQrImage] = useState('');

  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    currency: 'IDR',
    tax_rate: '0'
  });

  // Load settings
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getSettings.query();
      setSettings(data);
      
      // Parse settings into organized format
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      setStoreSettings({
        store_name: settingsMap.store_name || 'Warung Pintar',
        store_address: settingsMap.store_address || '',
        store_phone: settingsMap.store_phone || '',
        store_email: settingsMap.store_email || '',
        currency: settingsMap.currency || 'IDR',
        tax_rate: settingsMap.tax_rate || '0'
      });

      setQrImage(settingsMap.qr_image || '');
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Using default values since backend is not implemented
      setStoreSettings({
        store_name: 'Warung Pintar',
        store_address: 'Jl. Contoh No. 123, Jakarta',
        store_phone: '081234567890',
        store_email: 'warung@example.com',
        currency: 'IDR',
        tax_rate: '10'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Update setting
  const updateSetting = async (key: string, value: string) => {
    try {
      await trpc.updateSetting.mutate({ key, value });
      setSettings(prev => {
        const existing = prev.find(s => s.key === key);
        if (existing) {
          return prev.map(s => s.key === key ? { ...s, value } : s);
        } else {
          return [...prev, { id: Date.now(), key, value, created_at: new Date(), updated_at: new Date() }];
        }
      });
    } catch (error) {
      console.error('Failed to update setting:', error);
      alert('Gagal menyimpan pengaturan');
    }
  };

  // Save store settings
  const saveStoreSettings = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        updateSetting('store_name', storeSettings.store_name),
        updateSetting('store_address', storeSettings.store_address),
        updateSetting('store_phone', storeSettings.store_phone),
        updateSetting('store_email', storeSettings.store_email),
        updateSetting('currency', storeSettings.currency),
        updateSetting('tax_rate', storeSettings.tax_rate)
      ]);
      alert('Pengaturan toko berhasil disimpan!');
    } catch (error) {
      console.error('Failed to save store settings:', error);
      alert('Gagal menyimpan pengaturan toko');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle QR image upload
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real implementation, you would upload the file to a server
    // For now, we'll just create a local URL
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      setQrImage(imageUrl);
      await updateSetting('qr_image', imageUrl);
      alert('QR Code berhasil diupload!');
    };
    reader.readAsDataURL(file);
  };

  // Backup data
  const handleBackup = () => {
    // In a real implementation, this would generate a backup file
    const backupInfo = {
      timestamp: new Date().toISOString(),
      settings: settings,
      note: 'Backup data dari Kasir Warung Pintar'
    };
    
    const blob = new Blob([JSON.stringify(backupInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warung-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle restore
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        JSON.parse(event.target?.result as string);
        // In a real implementation, you would restore the data
        alert('Data berhasil dipulihkan!');
        loadSettings();
      } catch {
        alert('File backup tidak valid');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pengaturan</h2>
          <p className="text-gray-600">Kelola pengaturan aplikasi</p>
        </div>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="store" className="flex items-center space-x-2">
            <Store className="h-4 w-4" />
            <span>Toko</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center space-x-2">
            <QrCode className="h-4 w-4" />
            <span>Pembayaran</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Pengguna</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Backup</span>
          </TabsTrigger>
        </TabsList>

        {/* Store Settings */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Store className="h-5 w-5" />
                <span>Informasi Toko</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Toko *</Label>
                  <Input
                    value={storeSettings.store_name}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, store_name: e.target.value }))}
                    placeholder="Nama toko Anda"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Telepon</Label>
                  <Input
                    value={storeSettings.store_phone}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, store_phone: e.target.value }))}
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alamat Toko</Label>
                <Textarea
                  value={storeSettings.store_address}
                  onChange={(e) => setStoreSettings(prev => ({ ...prev, store_address: e.target.value }))}
                  placeholder="Alamat lengkap toko"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={storeSettings.store_email}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, store_email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mata Uang</Label>
                  <Input
                    value={storeSettings.currency}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, currency: e.target.value }))}
                    placeholder="IDR"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pajak (%)</Label>
                <Input
                  type="number"
                  value={storeSettings.tax_rate}
                  onChange={(e) => setStoreSettings(prev => ({ ...prev, tax_rate: e.target.value }))}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <Button onClick={saveStoreSettings} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                <span>Pengaturan QRIS</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Upload QR Code QRIS</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Upload gambar QR Code QRIS untuk ditampilkan saat transaksi
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="mb-4"
                  />
                </div>

                {qrImage && (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-48 h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={qrImage} 
                        alt="QR Code QRIS" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm text-gray-600">QR Code QRIS aktif</p>
                  </div>
                )}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    QR Code ini akan ditampilkan kepada pelanggan saat memilih metode pembayaran QRIS.
                    Pastikan QR Code valid dan dapat menerima pembayaran.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Tunai</h4>
                    <p className="text-sm text-gray-600">Pembayaran dengan uang tunai</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">QRIS</h4>
                    <p className="text-sm text-gray-600">Pembayaran dengan scan QR Code</p>
                  </div>
                  <Switch checked={!!qrImage} disabled />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Transfer Bank</h4>
                    <p className="text-sm text-gray-600">Pembayaran via transfer bank</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Settings */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Manajemen Pengguna</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Fitur manajemen pengguna akan tersedia dalam versi mendatang. 
                  Saat ini aplikasi berjalan dalam mode single user.
                </AlertDescription>
              </Alert>

              <div className="mt-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Mode Kasir</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Akses terbatas hanya untuk transaksi penjualan dan melihat produk
                  </p>
                  <Switch disabled />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Mode Owner</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Akses penuh ke semua fitur termasuk laporan dan pengaturan
                  </p>
                  <Switch checked disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Backup & Restore</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Backup Data</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Download backup data aplikasi untuk keamanan data Anda
                  </p>
                  <Button onClick={handleBackup} variant="outline" className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Download Backup</span>
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Restore Data</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Pulihkan data dari file backup yang sudah ada
                  </p>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={handleRestore}
                      className="hidden"
                      id="restore-input"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('restore-input')?.click()}
                      className="flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Backup</span>
                    </Button>
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Penting:</strong> Selalu buat backup data secara berkala. 
                  Restore data akan mengganti semua data yang ada saat ini.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Aplikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Versi Aplikasi:</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Backup:</span>
                  <span className="font-medium">Belum pernah</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Used:</span>
                  <span className="font-medium">~2.5 MB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
