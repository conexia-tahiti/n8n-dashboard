'use client';

import { ChatSession } from '@/app/types/n8n';
import { useRef } from 'react';
import { useConversationAnalysis } from '@/app/hooks/useConversationAnalysis';
import CompactConversationTags from './CompactConversationTags';

interface SessionConversationProps {
  session: ChatSession;
  onClose: () => void;
}

export default function SessionConversation({ session, onClose }: SessionConversationProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { analysis, isAnalyzing, error, isAnalyzed, analyzeConversation } = useConversationAnalysis(session.sessionId);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageContent = (content: string) => {
    // Remplacer les retours à la ligne par des <br />
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  const handleAnalyze = () => {
    if (session.conversation.length > 0) {
      analyzeConversation(session.conversation);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">
            {session.sessionId}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">
              {session.totalExecutions} message{session.totalExecutions > 1 ? 's' : ''}
            </p>
            {session.hasLeadTool && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                🎯 Tool Lead utilisé
              </span>
            )}
          </div>
          {/* Affichage compact des tags d'analyse dans le header */}
          {analysis && <CompactConversationTags analysis={analysis} />}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || session.conversation.length === 0}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              isAnalyzed
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <>
                <span className="animate-spin mr-1">⟳</span>
                Analyse...
              </>
            ) : isAnalyzed ? (
              'Réanalyser'
            ) : (
              'Analyser'
            )}
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-4">
          {session.conversation.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun message dans cette conversation</p>
            </div>
          ) : (
            session.conversation.map((message, index) => (
              <div
                key={`${message.executionId}-${message.type}-${index}`}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  <div className="text-sm">
                    {formatMessageContent(message.content)}
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 p-4">
          <div className="text-red-800 text-sm">
            <strong>Erreur d&apos;analyse :</strong> {error}
          </div>
        </div>
      )}

      {/* Footer avec statistiques */}
      <div className="bg-white px-6 py-3 border-t">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Session ID: {session.sessionId}</span>
          <span>Total exécutions: {session.totalExecutions}</span>
        </div>
      </div>

      {/* Section Leads générés */}
      {session.hasLeadTool && session.leadExecutions && session.leadExecutions.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            🎯 Leads générés ({session.leadExecutions.length})
          </h3>
          <div className="space-y-3">
            {session.leadExecutions.map((execution) => (
              <div
                key={execution.id}
                className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600">
                    {formatTimestamp(execution.startedAt)}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Lead
                  </span>
                </div>
                {execution.leadData && (
                  <div className="space-y-2 text-sm">
                    {execution.leadData.name && (
                      <div>
                        <span className="font-medium text-gray-700">Nom :</span>{' '}
                        <span className="text-gray-900">{execution.leadData.name}</span>
                      </div>
                    )}
                    {execution.leadData.email && (
                      <div>
                        <span className="font-medium text-gray-700">Email :</span>{' '}
                        <span className="text-gray-900">{execution.leadData.email}</span>
                      </div>
                    )}
                    {execution.leadData.phone && (
                      <div>
                        <span className="font-medium text-gray-700">Téléphone :</span>{' '}
                        <span className="text-gray-900">{execution.leadData.phone}</span>
                      </div>
                    )}
                    {execution.leadData.subject && (
                      <div>
                        <span className="font-medium text-gray-700">Sujet :</span>{' '}
                        <span className="text-gray-900">{execution.leadData.subject}</span>
                      </div>
                    )}
                    {execution.leadData.message && (
                      <div>
                        <span className="font-medium text-gray-700">Message :</span>
                        <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 text-gray-900 whitespace-pre-wrap">
                          {execution.leadData.message}
                        </div>
                      </div>
                    )}
                    {/* Afficher d'autres champs personnalisés s'il y en a */}
                    {Object.entries(execution.leadData).map(([key, value]) => {
                      // Ne pas afficher les champs déjà affichés
                      if (['name', 'email', 'phone', 'subject', 'message'].includes(key)) {
                        return null;
                      }
                      if (value && typeof value === 'string') {
                        return (
                          <div key={key}>
                            <span className="font-medium text-gray-700 capitalize">{key} :</span>{' '}
                            <span className="text-gray-900">{value}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
                {!execution.leadData && (
                  <p className="text-sm text-gray-500 italic">Aucune donnée disponible</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}