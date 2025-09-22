'use client';

import { useState, useEffect, useCallback } from 'react';
import { N8nExecution, ChatSession, GroupedExecutionsResponse } from '@/app/types/n8n';
import { useMetrics, Metrics } from '@/app/hooks/useMetrics';
import LoadingSpinner from './LoadingSpinner';
import SessionConversation from './SessionConversation';

interface ExecutionsListProps {
  onMetricsChange?: (metrics: Metrics, selectedMonth: string) => void;
}

export default function ExecutionsList({ onMetricsChange }: ExecutionsListProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [ungroupedExecutions, setUngroupedExecutions] = useState<N8nExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Calculate metrics using the custom hook
  const metrics = useMetrics(sessions, selectedMonth);

  const fetchExecutions = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/executions?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: GroupedExecutionsResponse = await response.json();
      setSessions(data.sessions || []);
      setUngroupedExecutions(data.ungroupedExecutions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des exécutions');
      console.error('Error fetching executions:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Initialiser le mois par défaut
  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (selectedMonth) { // Ne fetch que si selectedMonth est défini
      fetchExecutions();
    }
  }, [statusFilter, selectedMonth, fetchExecutions]);

  // Call the metrics callback whenever metrics or selectedMonth change
  useEffect(() => {
    if (onMetricsChange && selectedMonth) {
      onMetricsChange(metrics, selectedMonth);
    }
  }, [metrics, selectedMonth, onMetricsChange]);


  const handleRefresh = () => {
    setLoading(true);
    fetchExecutions();
  };

  const statuses = ['all', 'success', 'error'];

  if (loading && sessions.length === 0 && ungroupedExecutions.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-screen">
      {/* Panneau gauche - Liste des exécutions */}
      <div className="w-1/2 flex flex-col bg-gray-50 border-r border-gray-200">
        <div className="bg-white shadow p-4 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Toutes' : status}
                </button>
              ))}
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="month-picker" className="text-sm font-semibold text-gray-900">
                  Mois :
                </label>
                <input
                  id="month-picker"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleRefresh}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium text-xs flex items-center gap-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Chargement...
                  </>
                ) : (
                  <>
                    ⟳ Rafraîchir
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg mt-4">
              <p className="font-medium text-sm">Erreur</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && sessions.length === 0 && ungroupedExecutions.length === 0 && (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner />
            </div>
          )}

          {sessions.length === 0 && ungroupedExecutions.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune exécution trouvée</p>
            </div>
          )}

          <div className="space-y-3">
            {/* Sessions de chat */}
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className={`border rounded-lg bg-white cursor-pointer hover:shadow-md transition-all duration-200 ${
                  selectedSession?.sessionId === session.sessionId
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {session.status === 'active' && (
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    )}
                    <h3 className="font-semibold text-gray-900">
                      {session.sessionId}
                    </h3>
                    {session.status === 'active' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Actif
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mb-1">
                    {session.conversation.length} message{session.conversation.length > 1 ? 's' : ''} •
                    Dernière activité: {formatDate(session.lastActivity)}
                  </p>

                </div>
              </div>
            ))}

            {/* Exécutions non groupées */}
            {ungroupedExecutions.length > 0 && (
              <div className="border border-gray-200 rounded-lg bg-white">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Exécutions sans session</h3>
                  <p className="text-sm text-gray-500">
                    {ungroupedExecutions.length} exécution{ungroupedExecutions.length > 1 ? 's' : ''} sans conversation associée
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panneau droit - Conversation */}
      <div className="w-1/2 flex flex-col bg-white">
        {selectedSession ? (
          <SessionConversation
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">Sélectionnez une session</p>
              <p className="text-sm mt-1">Cliquez sur une session à gauche pour voir la conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}