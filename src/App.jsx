// App.jsx — Main application shell
import React, { useState } from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import TopBar from './components/layout/TopBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Simulation from './pages/Simulation.jsx';
import Intelligence from './pages/Intelligence.jsx';
import TankerDashboard from './pages/TankerDashboard.jsx';
import Alerts from './pages/Alerts.jsx';
import Analytics from './pages/Analytics.jsx';
import Complaints from './pages/Complaints.jsx';
import { ToastContainer } from './components/ui/ToastNotification.jsx';
import { Loader2 } from 'lucide-react';

import Login from './pages/Login.jsx';
import { supabase } from './lib/supabaseClient';

function AppShell() {
  const [activePage, setActivePage] = useState('dashboard');
  const { alerts, tankers, toasts, dismissToast } = useSimulation();
  
  const alertCount = alerts.filter((a) => !a.dismissed).length;
  const tankerCount = tankers.filter((t) => t.status !== 'completed').length;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'simulation': return <Simulation />;
      case 'intelligence': return <Intelligence />;
      case 'tankers': return <TankerDashboard />;
      case 'alerts': return <Alerts />;
      case 'complaints': return <Complaints />;
      case 'analytics': return <Analytics />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout animate-in fade-in duration-700">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        alertCount={alertCount}
        tankerCount={tankerCount}
      />
      <div className="app-main">
        <TopBar />
        <main className="app-content">
          {renderPage()}
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={48} />
      </div>
    );
  }

  return (
    <SimulationProvider>
      {user ? <AppShell /> : <Login />}
    </SimulationProvider>
  );
}
