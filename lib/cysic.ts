// lib/cysic.ts
import axios from 'axios';

const baseUrl = 'https://api-ai.cysic.xyz';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function createCysicChatCompletion(
  model: string,
  messages: Message[],
  customApiKey?: string // Optional custom API key
) {
  const url = `${baseUrl}/api/ai/chat/completions`;
  
  // Use custom key if provided, otherwise use environment variable
  const apiKey = customApiKey || process.env.CYSIC_API_KEY;
  
  // Check if API key exists
  if (!apiKey) {
    console.error('Cysic API Error: No API key provided');
    throw new Error('Cysic API key is missing. Please check your environment variables or provide a custom API key.');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  
  const data = {
    model,
    messages,
  };

  try {
    console.log('Making request to Cysic API:', { url, model, messageCount: messages.length });
    
    const response = await axios.post(url, data, { headers });
    
    console.log('Cysic API response received:', response.status);
    
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('Cysic API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: url,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length
    });
    
    // More specific error messages
    if (error.response?.status === 401) {
      throw new Error('Cysic API authentication failed. Please check your API key.');
    } else if (error.response?.status === 403) {
      throw new Error('Cysic API access forbidden. Please check your API key permissions.');
    } else if (error.response?.status === 429) {
      throw new Error('Cysic API rate limit exceeded. Please try again later.');
    } else if (error.response?.status >= 500) {
      throw new Error('Cysic API server error. Please try again later.');
    } else {
      throw new Error(`Cysic API request failed: ${error.response?.data?.error || error.message}`);
    }
  }
}