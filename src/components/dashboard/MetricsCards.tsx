'use client';

interface MetricsCardsProps {
  totalAlerts: number;
}

export function MetricsCards({ totalAlerts }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Alertas */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm font-medium">Alertas Activas</p>
            <p className="text-4xl font-bold text-white mt-2">{totalAlerts}</p>
          </div>
          <div className="text-5xl opacity-80">🚨</div>
        </div>
      </div>

      {/* Sistema Activo */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium">Sistema</p>
            <p className="text-2xl font-bold text-white mt-2">Activo</p>
          </div>
          <div className="text-5xl opacity-80">✅</div>
        </div>
      </div>

      {/* Última Actualización */}
      <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-cyan-100 text-sm font-medium">Última Actualización</p>
            <p className="text-lg font-bold text-white mt-2">
              {new Date().toLocaleTimeString('es-CO')}
            </p>
          </div>
          <div className="text-5xl opacity-80">🕐</div>
        </div>
      </div>
    </div>
  );
}
