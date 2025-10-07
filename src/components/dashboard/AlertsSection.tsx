'use client';

import { useState } from 'react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  icon: string;
  count: number;
  message: string;
  priority: 'high' | 'medium' | 'low';
  details: Array<{
    id: string | number;
    nombre: string;
    cantidad: number;
    talla: string;
    precio: number;
  }>;
}

interface AlertsSectionProps {
  alerts: Alert[];
  onRefresh: () => void;
}

export function AlertsSection({ alerts, onRefresh }: AlertsSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [sending, setSending] = useState(false);

  const openModal = (alert: Alert) => {
    setSelectedAlert(alert);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAlert(null);
  };

  const sendToTelegram = async () => {
    try {
      setSending(true);
      
      const alertDetails = {
        productosSinStock: alerts
          .find((a) => a.id === 'sin-stock')
          ?.details.map((d) => ({
            id: d.id,
            nombre: d.nombre,
            cantidad: d.cantidad,
          })) || [],
        stockBajo: alerts
          .find((a) => a.id === 'stock-bajo')
          ?.details.map((d) => ({
            id: d.id,
            nombre: d.nombre,
            cantidad: d.cantidad,
          })) || [],
      };

      const response = await fetch('/api/enterprise/send-to-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertDetails }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Alertas enviadas a Telegram correctamente');
      } else {
        alert('❌ Error al enviar alertas');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🔔 Alertas</h2>
          <div className="flex gap-2">
            <button
              onClick={sendToTelegram}
              disabled={sending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {sending ? '📤 Enviando...' : '📱 Enviar a Telegram'}
            </button>
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all hover:scale-[1.02] ${
                alert.priority === 'high'
                  ? 'bg-red-900/20 border-red-500'
                  : alert.priority === 'medium'
                  ? 'bg-yellow-900/20 border-yellow-500'
                  : 'bg-blue-900/20 border-blue-500'
              }`}
              onClick={() => alert.details.length > 0 && openModal(alert)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{alert.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{alert.title}</h3>
                    <p className="text-sm text-slate-300">{alert.message}</p>
                  </div>
                </div>
                {alert.count > 0 && (
                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-bold text-white">
                    {alert.count}
                  </span>
                )}
              </div>
              {alert.details.length > 0 && (
                <button className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                  Ver más →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedAlert && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                {selectedAlert.icon} {selectedAlert.title}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {selectedAlert.details.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-300">ID</th>
                        <th className="text-left py-3 px-4 text-slate-300">Producto</th>
                        <th className="text-left py-3 px-4 text-slate-300">Stock</th>
                        <th className="text-left py-3 px-4 text-slate-300">Talla</th>
                        <th className="text-left py-3 px-4 text-slate-300">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAlert.details.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          <td className="py-3 px-4 text-white">{item.id}</td>
                          <td className="py-3 px-4 text-white">{item.nombre}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded ${
                                item.cantidad === 0
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {item.cantidad}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{item.talla}</td>
                          <td className="py-3 px-4 text-white font-bold">
                            ${item.precio.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">
                  No hay detalles disponibles
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
