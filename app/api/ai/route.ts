// app/api/ai/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';
import { createCysicChatCompletion } from '@/lib/cysic';

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, messages = [] } = await req.json();
    
    if (!prompt || !model) {
      return NextResponse.json({ error: 'Missing prompt or model' }, { status: 400 });
    }

    let responseText = '';

    if (model === 'gemini-2.5-flash' || model === 'gemini-2.5-pro') {
      // Gemini AI - gabungkan conversation history dengan prompt baru
      const conversationHistory = [
        ...messages,
        { role: 'user', content: prompt }
      ];
      
      responseText = await askGemini(conversationHistory);
    } else {
      // Cysic AI - gabungkan conversation history dengan prompt baru
      const conversationMessages = [
        { role: 'system', content: 'You are a helpful AI assistant' },
        ...messages, // conversation history dari frontend
        { role: 'user', content: prompt }, // prompt terbaru
      ];
      
      responseText = await createCysicChatCompletion(model, conversationMessages);
    }

    return NextResponse.json({ text: responseText });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}