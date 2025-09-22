import { useState, useEffect, useCallback } from 'react';
import { ConversationAnalysis, ConversationMessage, AnalyzeConversationResponse } from '@/app/types/n8n';

export function useConversationAnalysis(sessionId: string) {
  const [analysis, setAnalysis] = useState<ConversationAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clé pour le localStorage
  const getStorageKey = (id: string) => `conversation-analysis-${id}`;

  // Charger l'analyse depuis le localStorage et réinitialiser lors du changement de session
  useEffect(() => {
    // Réinitialiser les états lors du changement de session
    setAnalysis(null);
    setError(null);

    if (typeof window !== 'undefined' && sessionId) {
      try {
        const stored = localStorage.getItem(getStorageKey(sessionId));
        if (stored) {
          const parsedAnalysis = JSON.parse(stored);
          setAnalysis(parsedAnalysis);
        }
      } catch (err) {
        console.error('Erreur lecture localStorage:', err);
      }
    }
  }, [sessionId]);

  // Sauvegarder l'analyse dans le localStorage
  const saveAnalysis = useCallback((analysisData: ConversationAnalysis) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(getStorageKey(sessionId), JSON.stringify(analysisData));
        setAnalysis(analysisData);
      } catch (err) {
        console.error('Erreur sauvegarde localStorage:', err);
      }
    }
  }, [sessionId]);

  // Fonction pour analyser une conversation
  const analyzeConversation = useCallback(async (messages: ConversationMessage[]) => {
    if (!sessionId || messages.length === 0) {
      setError('Session ID ou messages manquants');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          messages,
        }),
      });

      const data: AnalyzeConversationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erreur HTTP: ${response.status}`);
      }

      if (data.success && data.analysis) {
        saveAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Erreur lors de l\'analyse');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur analyse conversation:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionId, saveAnalysis]);

  // Fonction pour supprimer l'analyse
  const clearAnalysis = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getStorageKey(sessionId));
      setAnalysis(null);
      setError(null);
    }
  }, [sessionId]);

  // Vérifier si une conversation a déjà été analysée
  const isAnalyzed = analysis !== null;

  return {
    analysis,
    isAnalyzing,
    error,
    isAnalyzed,
    analyzeConversation,
    clearAnalysis,
  };
}