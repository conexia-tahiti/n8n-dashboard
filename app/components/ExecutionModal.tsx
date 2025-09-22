'use client';

import { useState, useEffect } from 'react';
import { N8nExecution } from '@/app/types/n8n';
import LoadingSpinner from './LoadingSpinner';

interface ExecutionModalProps {
  execution: N8nExecution;
  onClose: () => void;
  isPanel?: boolean;
}

interface ExecutionDetails {
  data?: {
    resultData?: {
      runData?: Record<string, unknown[]>;
      lastNodeExecuted?: string;
      error?: unknown;
    };
    executionData?: {
      nodeExecutionStack?: unknown[];
      metadata?: unknown;
      waitingExecution?: unknown;
      waitingExecutionSource?: unknown;
    };
  };
}

export default function ExecutionModal({ execution, onClose, isPanel }: ExecutionModalProps) {
  const [details, setDetails] = useState<ExecutionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/executions/${execution.id}`);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        setDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des détails');
        console.error('Error fetching execution details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [execution.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calculateDuration = (start: string, stop?: string) => {
    if (!stop) return '-';
    const duration = new Date(stop).getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const renderNodeData = (nodeData: unknown[], nodeName: string) => {
    if (!nodeData || nodeData.length === 0) return null;

    return (
      <div key={nodeName} className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
          {nodeName}
        </h4>
        {nodeData.map((item, index: number) => {
          const itemRecord = item as Record<string, unknown>;
          return (
          <div key={index} className="bg-gray-50 rounded-md p-4 mb-3 border border-gray-200">
            <div className="text-sm text-gray-800 mb-3">
              <span className="font-semibold text-gray-900">Exécution #{index + 1}</span>
              {!!itemRecord.startTime && (
                <span className="ml-4 text-gray-700">
                  Temps: {new Date(itemRecord.startTime as string).toLocaleTimeString('fr-FR')}
                </span>
              )}
              {!!itemRecord.executionTime && (
                <span className="ml-4 text-gray-700">Durée: {itemRecord.executionTime as number}ms</span>
              )}
            </div>

            {!!itemRecord.data && (
              <div className="space-y-2">
                <h5 className="font-semibold text-gray-900">Données:</h5>
                <pre className="bg-white p-3 rounded text-xs text-gray-800 overflow-auto max-h-40 border border-gray-300 font-mono">
                  {JSON.stringify(itemRecord.data, null, 2)}
                </pre>
              </div>
            )}

            {!!itemRecord.error && (
              <div className="mt-3">
                <h5 className="font-semibold text-red-800">Erreur:</h5>
                <div className="bg-red-50 p-3 rounded text-sm text-red-800 border border-red-200">
                  {typeof itemRecord.error === 'string' ? itemRecord.error : JSON.stringify(itemRecord.error, null, 2)}
                </div>
              </div>
            )}
          </div>
        );
        })}
      </div>
    );
  };

  if (isPanel) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Détails de l&apos;exécution #{execution.id}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {execution.workflowName || `Workflow ${execution.workflowId}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Informations générales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <span className="text-sm font-medium text-gray-600">Mode:</span>
              <p className="font-semibold text-gray-900">{execution.mode}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Statut:</span>
              <p className="font-semibold text-gray-900">{execution.status}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Démarré le:</span>
              <p className="font-semibold text-gray-900 text-sm">{formatDate(execution.startedAt)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Durée:</span>
              <p className="font-semibold text-gray-900">{calculateDuration(execution.startedAt, execution.stoppedAt)}</p>
            </div>
          </div>

          {/* Contenu principal */}
          {loading && <LoadingSpinner />}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-medium">Erreur lors du chargement</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {details && !loading && !error && (
            <div className="space-y-6">
              {/* Erreur globale */}
              {!!details.data?.resultData?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur d&apos;exécution</h3>
                  <pre className="bg-red-100 p-3 rounded text-sm text-red-800 overflow-auto">
                    {typeof details.data.resultData.error === 'string'
                      ? details.data.resultData.error
                      : JSON.stringify(details.data.resultData.error, null, 2)}
                  </pre>
                </div>
              )}

              {/* Dernière node exécutée */}
              {!!details.data?.resultData?.lastNodeExecuted && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800">
                    Dernière node exécutée: {details.data.resultData.lastNodeExecuted}
                  </h3>
                </div>
              )}

              {/* Données d'exécution des nodes */}
              {!!details.data?.resultData?.runData && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Logs d&apos;exécution des nodes</h3>
                  <div className="space-y-4">
                    {Object.entries(details.data.resultData.runData).map(([nodeName, nodeData]) =>
                      renderNodeData(nodeData, nodeName)
                    )}
                  </div>
                </div>
              )}

              {/* Métadonnées */}
              {!!details.data?.executionData?.metadata && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Métadonnées</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm text-gray-800 overflow-auto">
                    {JSON.stringify(details.data.executionData.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Détails de l&apos;exécution #{execution.id}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {execution.workflowName || `Workflow ${execution.workflowId}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Informations générales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <span className="text-sm font-medium text-gray-600">Mode:</span>
              <p className="font-semibold text-gray-900">{execution.mode}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Statut:</span>
              <p className="font-semibold text-gray-900">{execution.status}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Démarré le:</span>
              <p className="font-semibold text-gray-900 text-sm">{formatDate(execution.startedAt)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Durée:</span>
              <p className="font-semibold text-gray-900">{calculateDuration(execution.startedAt, execution.stoppedAt)}</p>
            </div>
          </div>

          {/* Contenu principal */}
          {loading && <LoadingSpinner />}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-medium">Erreur lors du chargement</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {details && !loading && !error && (
            <div className="space-y-6">
              {/* Erreur globale */}
              {!!details.data?.resultData?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur d&apos;exécution</h3>
                  <pre className="bg-red-100 p-3 rounded text-sm text-red-800 overflow-auto">
                    {typeof details.data.resultData.error === 'string'
                      ? details.data.resultData.error
                      : JSON.stringify(details.data.resultData.error, null, 2)}
                  </pre>
                </div>
              )}

              {/* Dernière node exécutée */}
              {!!details.data?.resultData?.lastNodeExecuted && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800">
                    Dernière node exécutée: {details.data.resultData.lastNodeExecuted}
                  </h3>
                </div>
              )}

              {/* Données d'exécution des nodes */}
              {!!details.data?.resultData?.runData && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Logs d&apos;exécution des nodes</h3>
                  <div className="space-y-4">
                    {Object.entries(details.data.resultData.runData).map(([nodeName, nodeData]) =>
                      renderNodeData(nodeData, nodeName)
                    )}
                  </div>
                </div>
              )}

              {/* Métadonnées */}
              {!!details.data?.executionData?.metadata && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Métadonnées</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm text-gray-800 overflow-auto">
                    {JSON.stringify(details.data.executionData.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}