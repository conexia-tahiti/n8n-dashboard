'use client';

import { useState } from 'react';
import ExecutionsList from './components/ExecutionsList';
import { Metrics } from './hooks/useMetrics';

export default function Home() {
  const [metrics, setMetrics] = useState<Metrics>({ totalMessages: 0, averageMessagesPerConversation: 0 });
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const handleMetricsChange = (newMetrics: Metrics, month: string) => {
    setMetrics(newMetrics);
    setSelectedMonth(month);
  };

  const formatMonth = (monthString: string) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard {process.env.NEXT_PUBLIC_PROJECT_NAME || 'n8n'}</h1>
              <p className="text-sm text-gray-500 mt-1">Surveillance des exécutions de workflows</p>
            </div>

            {/* Metrics Section */}
            {selectedMonth && (
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Métriques - {formatMonth(selectedMonth)}
                </h3>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {metrics.totalMessages.toLocaleString('fr-FR')}
                    </div>
                    <div className="text-xs text-gray-500">Messages total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {metrics.averageMessagesPerConversation}
                    </div>
                    <div className="text-xs text-gray-500">Moy./conversation</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Connecté</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExecutionsList onMetricsChange={handleMetricsChange} />
      </main>

      <footer className="mt-auto bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Dashboard {process.env.NEXT_PUBLIC_PROJECT_NAME || 'n8n'} - Surveillance des workflows
          </p>
        </div>
      </footer>
    </div>
  );
}