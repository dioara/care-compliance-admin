import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, useLocation, Link, Redirect } from 'wouter';
import { auth } from './lib/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Organisations from './pages/Organisations';
import OrganisationDetail from './pages/OrganisationDetail';
import Users from './pages/Users';
import Subscriptions from './pages/Subscriptions';
import SupportTickets from './pages/SupportTickets';
import {
  LayoutDashboard,
  Building2,
  Users as UsersIcon,
  CreditCard,
  TicketIcon,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  
  const logoutMutation = useMutation({
    mutationFn: auth.logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/organisations', icon: Building2, label: 'Organisations' },
    { href: '/users', icon: UsersIcon, label: 'Users' },
    { href: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { href: '/support', icon: TicketIcon, label: 'Support Tickets' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="font-bold text-lg">Admin Portal</h1>
              <p className="text-xs text-slate-400">Care Compliance</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-800 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="flex items-center gap-3 px-3 py-2 w-full text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>
    </>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">Admin Portal</h1>
        </header>
        
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: auth.me,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data?.user) {
    return <Redirect to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/organisations">
        <ProtectedRoute>
          <Organisations />
        </ProtectedRoute>
      </Route>
      <Route path="/organisations/:id">
        {(params) => (
          <ProtectedRoute>
            <OrganisationDetail id={parseInt(params.id)} />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/users">
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      </Route>
      <Route path="/subscriptions">
        <ProtectedRoute>
          <Subscriptions />
        </ProtectedRoute>
      </Route>
      <Route path="/support">
        <ProtectedRoute>
          <SupportTickets />
        </ProtectedRoute>
      </Route>
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}
