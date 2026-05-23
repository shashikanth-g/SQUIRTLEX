// App.jsx — Main application shell (Demo Deployment Mode)
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
        {/* Subtle Demonstration Banner */}
        <div className="bg-primary/10 border-b border-primary/15 text-primary/95 py-1.5 px-4 text-[11px] font-mono tracking-widest text-center shrink-0 flex items-center justify-center gap-2 select-none uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00D4FF]" />
          <span>Authentication disabled for portfolio demonstration.</span>
        </div>
        <TopBar />
        <main className="app-content">
          {renderPage()}
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      {/* Floating Demo Mode Badge */}
      <div className="fixed top-2.5 right-4 bg-primary/20 border border-primary/45 text-primary text-[10px] px-3 py-1 rounded-full font-mono font-bold uppercase tracking-widest shadow-[0_0_12px_rgba(0,212,255,0.3)] z-[9999] backdrop-blur-md select-none">
        Demo Mode
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SimulationProvider>
      <AppShell />
    </SimulationProvider>
  );
}
