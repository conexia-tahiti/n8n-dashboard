import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.N8N_API_KEY;
  const apiUrl = process.env.N8N_API_URL || 'https://dev-conexia.app.n8n.cloud/api/v1';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'n8n API key not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${apiUrl}/executions/${id}?includeData=true`, {
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n API error:', response.status, errorText);
      return NextResponse.json(
        { error: `n8n API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching execution details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution details' },
      { status: 500 }
    );
  }
}