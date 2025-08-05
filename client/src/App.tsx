
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Dashboard } from '@/components/Dashboard';
import { Sales } from '@/components/Sales';
import { Products } from '@/components/Products';
import { Stock } from '@/components/Stock';
import { Reports } from '@/components/Reports';
import { Customers } from '@/components/Customers';
import { Expenses } from '@/components/Expenses';
import { DebtCredit } from '@/components/DebtCredit';
import { Settings } from '@/components/Settings';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Package2,
  Users,
  CreditCard,
  Receipt,
  Settings as SettingsIcon,
  Menu,
  X
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

type ActivePage = 'dashboard' | 'sales' | 'products' | 'stock' | 'reports' | 'customers' | 'expenses' | 'debt-credit' | 'settings';

function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const summary = await trpc.getDashboardSummary.query();
      setDashboardData(summary);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Using stub data since backend is not implemented
      setDashboardData({
        today_sales: 1250000,
        today_transactions: 25,
        low_stock_products: 3,
        overdue_debts: 2,
        top_selling_products: [
          { product_name: 'Indomie Goreng', total_sold: 12 },
          { product_name: 'Aqua 600ml', total_sold: 8 },
          { product_name: 'Teh Pucuk', total_sold: 6 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const menuItems = [
    { id: 'dashboard' as ActivePage, label: 'Beranda', icon: Home },
    { id: 'sales' as ActivePage, label: 'Penjualan', icon: ShoppingCart },
    { id: 'products' as ActivePage, label: 'Produk', icon: Package },
    { id: 'stock' as ActivePage, label: 'Stok', icon: Package2 },
    { id: 'customers' as ActivePage, label: 'Pelanggan', icon: Users },
    { id: 'expenses' as ActivePage, label: 'Pengeluaran', icon: Receipt },
    { id: 'debt-credit' as ActivePage, label: 'Hutang/Piutang', icon: CreditCard },
    { id: 'reports' as ActivePage, label: 'Laporan', icon: BarChart3 },
    { id: 'settings' as ActivePage, label: 'Pengaturan', icon: SettingsIcon }
  ];

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard data={dashboardData} isLoading={isLoading} onRefresh={loadDashboardData} />;
      case 'sales':
        return <Sales />;
      case 'products':
        return <Products />;
      case 'stock':
        return <Stock />;
      case 'customers':
        return <Customers />;
      case 'expenses':
        return <Expenses />;
      case 'debt-credit':
        return <DebtCredit />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard data={dashboardData} isLoading={isLoading} onRefresh={loadDashboardData} />;
    }
  };

  const currentPageTitle = menuItems.find(item => item.id === activePage)?.label || 'Kasir Warung Pintar';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold">Kasir Warung Pintar</h1>
              <p className="text-xs text-green-100">{currentPageTitle}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-green-800 md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-white shadow-lg flex-col">
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activePage === item.id
                        ? 'bg-green-100 text-green-700 border-l-4 border-green-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black opacity-50" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
              </div>
              <nav className="p-4">
                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActivePage(item.id);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activePage === item.id
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden bg-white border-t border-gray-200 px-2 py-1">
        <div className="flex justify-around">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  activePage === item.id
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
