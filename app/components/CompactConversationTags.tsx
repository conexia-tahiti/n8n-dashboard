import { ConversationAnalysis } from '@/app/types/n8n';

interface CompactConversationTagsProps {
  analysis: ConversationAnalysis;
}

export default function CompactConversationTags({ analysis }: CompactConversationTagsProps) {
  // Couleurs pour les différentes catégories
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'conseils':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'sav':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'informations générales':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'friction':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'impossibilité de répondre':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  // Couleur pour les sujets
  const getSubjectColor = () => 'bg-indigo-100 text-indigo-700 border-indigo-200';

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {/* Catégories */}
      {analysis.categories.map((category, index) => (
        <span
          key={`cat-${index}`}
          className={`px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(category)}`}
        >
          {category}
        </span>
      ))}

      {/* Sujets */}
      {analysis.subjects.map((subject, index) => (
        <span
          key={`sub-${index}`}
          className={`px-2 py-0.5 rounded text-xs font-medium border ${getSubjectColor()}`}
        >
          {subject}
        </span>
      ))}
    </div>
  );
}