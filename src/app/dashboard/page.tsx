'use client';

import { useState, useEffect } from 'react';
import { AlertsSection } from '@/components/dashboard/AlertsSection';
import { TasksSection } from '@/components/dashboard/TasksSection';
import { MetricsCards } from '@/components/dashboard/MetricsCards';

export default function DashboardEmpresarial() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [totalAlerts, setTotalAlerts] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/enterprise/alerts');
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.data.alerts);
        setTotalAlerts(data.data.totalAlerts);
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              🏢 Dashboard Empresarial
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-slate-300">Sistema Automatizado</span>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Metrics */}
            <MetricsCards totalAlerts={totalAlerts} />

            {/* Alertas y Tareas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlertsSection alerts={alerts} onRefresh={loadDashboardData} />
              <TasksSection />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
