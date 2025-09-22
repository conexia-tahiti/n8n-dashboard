# Dashboard n8n

## Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```bash
# Nom du projet (affiché dans l'interface)
NEXT_PUBLIC_PROJECT_NAME=Votre Nom de Projet

# Configuration API n8n
N8N_API_KEY=votre_clé_api_n8n
N8N_API_URL=https://votre-instance.app.n8n.cloud/api/v1
N8N_WORKFLOW_ID=votre_workflow_id

# Configuration OpenAI (pour l'analyse des conversations)
OPENAI_API_KEY=votre_clé_openai
```

## Installation et lancement

```bash
npm install
npm run dev
```