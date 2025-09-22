'use client';

import { useState } from 'react';

export default function TestPage() {
  const [apiUrl, setApiUrl] = useState('https://gaspard-irumuva.app.n8n.cloud/api/v1');
  const [workflowId, setWorkflowId] = useState('MdIDTNVC1KhLvEjc');
  const [apiKey, setApiKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNTAyNTAwNS04OTdkLTQ3ZTEtOTM2Ny02NzBmZTNjYTk0YzEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU4MzIzMzE3fQ.5IUiPg3BPQqF-JFfJ61QUbE1bJmioX758EcD9zmgjxE');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('');

    try {
      const params = new URLSearchParams();
      if (workflowId) params.append('workflowId', workflowId);
      params.append('limit', '2');

      const response = await fetch(`${apiUrl}/executions?${params.toString()}`, {
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Accept': 'application/json',
        },
      });

      const text = await response.text();

      if (response.ok) {
        try {
          const json = JSON.parse(text);
          setResult(`✅ Succès!\n\nRéponse JSON:\n${JSON.stringify(json, null, 2)}`);
        } catch {
          setResult(`✅ Succès! (réponse non-JSON)\n\nRéponse:\n${text}`);
        }
      } else {
        setResult(`❌ Erreur ${response.status}\n\nRéponse:\n${text.substring(0, 500)}...`);
      }
    } catch (error) {
      setResult(`❌ Erreur de connexion:\n${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateEnv = () => {
    // Cette fonction simule la mise à jour - en réalité il faut modifier .env.local
    setResult(`📝 Pour mettre à jour la configuration, modifiez le fichier .env.local avec:

N8N_API_URL=${apiUrl}
N8N_WORKFLOW_ID=${workflowId}
N8N_API_KEY=${apiKey}

Puis redémarrez le serveur de développement.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test de Configuration n8n</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuration de l&apos;API</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de l&apos;API n8n
              </label>
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-workspace.app.n8n.cloud/api/v1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Exemples d&apos;URLs courantes :
              </p>
              <ul className="text-sm text-gray-500 ml-4">
                <li>• https://app.n8n.cloud/api/v1 (n8n.cloud principal)</li>
                <li>• https://your-workspace.app.n8n.cloud/api/v1 (workspace spécifique)</li>
                <li>• http://localhost:5678/api/v1 (instance locale)</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workflow ID
              </label>
              <input
                type="text"
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MdIDTNVC1KhLvEjc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API
              </label>
              <textarea
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 font-mono text-sm"
                placeholder="votre-clé-api-jwt"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Test en cours...
                </>
              ) : (
                '🔍 Tester la connexion'
              )}
            </button>

            <button
              onClick={updateEnv}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              📝 Générer config .env
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Résultat du test</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">💡 Conseils de dépannage</h3>
          <ul className="text-yellow-700 space-y-1">
            <li>• Vérifiez que votre workspace n8n est actif et en ligne</li>
            <li>• Assurez-vous que la clé API est valide et a les bonnes permissions</li>
            <li>• Testez d&apos;abord avec l&apos;URL principale : https://app.n8n.cloud/api/v1</li>
            <li>• Si vous utilisez une instance locale, vérifiez que n8n est démarré</li>
          </ul>
        </div>
      </div>
    </div>
  );
}