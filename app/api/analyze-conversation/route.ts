import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AnalyzeConversationRequest, AnalyzeConversationResponse, ConversationAnalysis } from '@/app/types/n8n';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPT = `Tu es un expert en analyse de conversations client. Analyse la conversation suivante et détermine :

1. LES CATÉGORIES (peut être plusieurs parmi) :
- conseils : demande de conseils, recommandations
- sav : service après-vente, problèmes, réclamations
- informations générales : questions générales, renseignements
- friction : difficulté, frustration, problème dans l'expérience
- impossibilité de répondre : questions hors sujet ou impossibles à traiter

2. LES SUJETS : mots-clés décrivant le sujet principal (ex: "produit maquillage", "livraison", "remboursement", etc.)

Réponds UNIQUEMENT en JSON avec cette structure exacte :
{
  "categories": ["categorie1", "categorie2"],
  "subjects": ["sujet1", "sujet2"]
}

Conversation à analyser :`;

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeConversationRequest = await request.json();
    const { sessionId, messages } = body;

    if (!sessionId || !messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session ID et messages requis' },
        { status: 400 }
      );
    }

    // Construire le texte de la conversation
    const conversationText = messages
      .map(msg => `${msg.type === 'user' ? 'Client' : 'IA'}: ${msg.content}`)
      .join('\n');

    // Appel à OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Utilisation du modèle disponible
      messages: [
        {
          role: 'system',
          content: ANALYSIS_PROMPT
        },
        {
          role: 'user',
          content: conversationText
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Pas de réponse de OpenAI');
    }

    // Parser la réponse JSON
    let analysisData;
    try {
      analysisData = JSON.parse(responseText);
    } catch (error) {
      console.error('Erreur parsing JSON OpenAI:', responseText, error);
      throw new Error('Format de réponse invalide de OpenAI');
    }

    // Créer l'objet d'analyse complet
    const analysis: ConversationAnalysis = {
      sessionId,
      categories: analysisData.categories || [],
      subjects: analysisData.subjects || [],
      analyzedAt: new Date().toISOString(),
    };

    const response: AnalyzeConversationResponse = {
      success: true,
      analysis,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur analyse conversation:', error);

    const response: AnalyzeConversationResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };

    return NextResponse.json(response, { status: 500 });
  }
}