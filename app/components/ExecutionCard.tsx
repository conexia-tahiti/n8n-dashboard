import { N8nExecution } from '@/app/types/n8n';

interface ExecutionCardProps {
  execution: N8nExecution;
  onClick?: () => void;
  isSelected?: boolean;
  isCompact?: boolean;
}

export default function ExecutionCard({ execution, onClick, isSelected, isCompact }: ExecutionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'canceled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'crashed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'running':
        return '⟳';
      case 'waiting':
        return '⏸';
      case 'canceled':
        return '⊘';
      case 'crashed':
        return '!';
      default:
        return '•';
    }
  };

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
    if (!stop && execution.status === 'running') {
      return 'En cours...';
    }
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

  if (isCompact) {
    return (
      <div
        className={`bg-white rounded-md border cursor-pointer p-3 hover:bg-gray-50 transition-colors ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={onClick}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(execution.status)}`}>
                {getStatusIcon(execution.status)} {execution.status}
              </span>
              <span className="text-xs text-gray-500">#{execution.id}</span>
            </div>
            {execution.chatInput && (
              <p className="text-sm text-gray-700 mb-1">&quot;{execution.chatInput.slice(0, 60)}...&quot;</p>
            )}
            <p className="text-xs text-gray-500">
              {formatDate(execution.startedAt)} • {calculateDuration(execution.startedAt, execution.stoppedAt)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-4 border cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {execution.workflowName || `Workflow ${execution.workflowId}`}
          </h3>
          <p className="text-sm text-gray-500 mt-1">ID: {execution.id}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(execution.status)}`}>
          <span className="mr-1">{getStatusIcon(execution.status)}</span>
          {execution.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Mode:</span>
          <span className="ml-2 font-medium text-gray-900">{execution.mode}</span>
        </div>
        <div>
          <span className="text-gray-500">Durée:</span>
          <span className="ml-2 font-medium text-gray-900">
            {calculateDuration(execution.startedAt, execution.stoppedAt)}
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Démarré le:</span>
          <span className="ml-2 font-medium text-gray-900">{formatDate(execution.startedAt)}</span>
        </div>
        {execution.stoppedAt && (
          <div className="col-span-2">
            <span className="text-gray-500">Terminé le:</span>
            <span className="ml-2 font-medium text-gray-900">{formatDate(execution.stoppedAt)}</span>
          </div>
        )}
      </div>

      {!!execution.data?.resultData?.error && (
        <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
          <p className="text-sm text-red-800 font-medium">Erreur:</p>
          <p className="text-sm text-red-700 mt-1">
            {typeof execution.data.resultData.error === 'string'
              ? execution.data.resultData.error
              : (execution.data.resultData.error as Record<string, unknown>)?.message as string || 'Une erreur est survenue'}
          </p>
        </div>
      )}
    </div>
  );
}