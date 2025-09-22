import { ConversationAnalysis } from '@/app/types/n8n';

interface ConversationTagsProps {
  analysis: ConversationAnalysis;
}

export default function ConversationTags({ analysis }: ConversationTagsProps) {
  // Couleurs pour les différentes catégories
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'conseils':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sav':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'informations générales':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'friction':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'impossibilité de répondre':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  // Couleur pour les sujets
  const getSubjectColor = () => 'bg-indigo-100 text-indigo-800 border-indigo-200';

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50">
      <div className="flex flex-col gap-3">
        {/* Titre avec date d'analyse */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">Analyse automatique</h4>
          <span className="text-xs text-gray-500">
            {new Date(analysis.analyzedAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Catégories */}
        {analysis.categories.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-600 mb-2 block">Catégories :</span>
            <div className="flex flex-wrap gap-2">
              {analysis.categories.map((category, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sujets */}
        {analysis.subjects.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-600 mb-2 block">Sujets :</span>
            <div className="flex flex-wrap gap-2">
              {analysis.subjects.map((subject, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getSubjectColor()}`}
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}