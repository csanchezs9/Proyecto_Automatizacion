'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  frequency: string;
  icon: string;
  lastRun: string;
  nextRun: string;
}

export function TasksSection() {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/enterprise/tasks');
      const data = await response.json();

      if (data.success) {
        setTask(data.data.task);
      }
    } catch (error) {
      console.error('Error cargando tareas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">⚙️ Tareas Automáticas</h2>
        <button
          onClick={loadTasks}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
        </div>
      ) : task ? (
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{task.icon}</span>
            <div className="flex-1">
              <h3 className="font-bold text-xl text-white">{task.name}</h3>
              <p className="text-sm text-slate-300">{task.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-bold text-sm">
                {task.status === 'active' ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Frecuencia</p>
              <p className="text-white font-bold">{task.frequency}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Última Ejecución</p>
              <p className="text-white font-bold">
                {new Date(task.lastRun).toLocaleTimeString('es-CO')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-slate-400 text-center py-8">
          No hay tareas programadas
        </p>
      )}
    </div>
  );
}
