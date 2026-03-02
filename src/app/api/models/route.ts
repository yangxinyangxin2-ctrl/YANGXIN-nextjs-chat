import { NextResponse } from 'next/server';
import { ModelOption } from '@/app/types/chat';
export const dynamic = 'force-dynamic';

const MODEL = process.env.MODEL || '';

function loadModelsFromEnv(): ModelOption[] {
  const models: ModelOption[] = [];
  const maxModels = 10;
  for (let i = 1; i <= maxModels; i++) {
    const modelId = process.env[`MODEL_${i}`];

    if (!modelId) {
      break;
    }

    models.push({
      id: modelId,
      name: modelId,
    });
  }

  if (!models?.length) {
    models.push({
      id: MODEL,
      name: MODEL,
    });
  }

  return models;
}

export async function GET() {
  try {
    const models = loadModelsFromEnv();
    return NextResponse.json({ models });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load models' }, { status: 500 });
  }
}
