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
          <p className="text-sm text-gray-500 mt-1">
            {session.totalExecutions} message{session.totalExecutions > 1 ? 's' : ''}
          </p>
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
    </div>
  );
}