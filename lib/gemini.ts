// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

// Update function untuk support conversation history
export async function askGemini(messages: Array<{role: string, content: string}>): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  
  try {
    // Jika hanya ada 1 message (tidak ada conversation history)
    if (messages.length === 1) {
      const result = await model.generateContent(messages[0].content)
      const response = result.response
      return response.text()
    }
    
    // Jika ada conversation history, gunakan chat
    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    })

    // Kirim message terakhir
    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    return result.response.text()
    
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to get response from Gemini')
  }
}

// Backup function untuk compatibility (jika masih ada yang pakai format lama)
export async function askGeminiSimple(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  const result = await model.generateContent(prompt)
  const response = result.response
  return response.text()
}