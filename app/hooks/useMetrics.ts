import { useMemo } from 'react';
import { ChatSession } from '@/app/types/n8n';

export interface Metrics {
  totalMessages: number;
  averageMessagesPerConversation: number;
}

export function useMetrics(sessions: ChatSession[], selectedMonth: string): Metrics {
  return useMemo(() => {
    if (!selectedMonth || sessions.length === 0) {
      return {
        totalMessages: 0,
        averageMessagesPerConversation: 0
      };
    }

    // Parse selectedMonth (format: "YYYY-MM")
    const [year, month] = selectedMonth.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Filter sessions that have activity in the selected month
    const filteredSessions = sessions.filter(session => {
      const sessionDate = new Date(session.lastActivity);
      return sessionDate >= startOfMonth && sessionDate <= endOfMonth;
    });

    if (filteredSessions.length === 0) {
      return {
        totalMessages: 0,
        averageMessagesPerConversation: 0
      };
    }

    // Calculate total messages across all filtered sessions
    const totalMessages = filteredSessions.reduce((total, session) => {
      return total + session.conversation.length;
    }, 0);

    // Calculate average messages per conversation
    const averageMessagesPerConversation = totalMessages / filteredSessions.length;

    return {
      totalMessages,
      averageMessagesPerConversation: Number(averageMessagesPerConversation.toFixed(1))
    };
  }, [sessions, selectedMonth]);
}