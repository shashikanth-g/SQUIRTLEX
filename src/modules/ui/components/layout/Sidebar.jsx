// Sidebar.jsx — Main navigation
import React from 'react';
import { useSimulation } from '@sim/../context/SimulationContext';
import {
  LayoutDashboard,
  Activity,
  Brain,
  AlertCircle,
  BarChart3,
  Droplets,
  Truck,
  Lock,
  MessageSquare
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, alertCount, tankerCount }) {
  const { testInsert } = useSimulation();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'simulation', label: 'Network Map', icon: Activity },
    { id: 'intelligence', label: 'AI Strategy', icon: Brain },
    { id: 'tankers', label: 'Tanker Ops', icon: Truck, badge: tankerCount },
    { id: 'alerts', label: 'System Alerts', icon: AlertCircle, badge: alertCount },
    { id: 'complaints', label: 'Complaints', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Droplets size={32} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="logo-text font-bold tracking-widest">SQUIRTLE-X</h1>
          <span className="logo-sub">Smart Water Intelligence System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span className={`nav-badge ${item.id === 'alerts' ? 'bg-accent' : 'bg-primary'}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-dot online" />
          <span>Core Engine: Online</span>
        </div>
      </div>
    </aside>
  );
}
