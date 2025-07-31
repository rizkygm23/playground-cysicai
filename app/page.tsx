"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Settings, Key, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const models = {
  gemini: ["gemini-2.5-flash", "gemini-2.5-pro"],
  cysic: [
    "QwQ-32B-Q4_K_M",
    "Meta-Llama-3-8B-Instruct",
    "phi-4",
    "Llama-Guard-3-8B",
    "DeepSeek-R1-0528-Qwen3-8B",
    "gemma-2-9b-it",
  ],
}

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  model?: string
}

// Simple markdown parser for basic formatting
const parseMarkdown = (text: string) => {
  // Split text by markdown patterns while preserving the delimiters
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)

  return parts.map((part, index) => {
    // Bold text **text**
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    // Italic text *text*
    else if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    }
    // Inline code `code`
    else if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">
          {part.slice(1, -1)}
        </code>
      )
    }
    // Regular text
    else {
      return part
    }
  })
}

export default function Home() {
  const [provider, setProvider] = useState<"gemini" | "cysic">("gemini")
  const [model, setModel] = useState("gemini-2.5-flash")
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showCysicAlert, setShowCysicAlert] = useState(false)

  // Cysic API Key settings
  const [cysicApiKeyMode, setCysicApiKeyMode] = useState<"default" | "custom">("default")
  const [customCysicApiKey, setCustomCysicApiKey] = useState("")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [prompt])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || loading) return

    // Validate custom API key for Cysic
    if (provider === "cysic" && cysicApiKeyMode === "custom" && !customCysicApiKey.trim()) {
      alert("Please enter your Cysic API key or use default key")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: prompt,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setPrompt("")
    setLoading(true)

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }))

      const requestBody: any = {
        prompt,
        model,
        messages: conversationHistory,
      }

      // Add custom API key for Cysic if needed
      if (provider === "cysic" && cysicApiKeyMode === "custom") {
        requestBody.customApiKey = customCysicApiKey
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await res.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data?.text || data?.response || "No response received",
        role: "assistant",
        timestamp: new Date(),
        model: model,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error while processing your request.",
        role: "assistant",
        timestamp: new Date(),
        model: model,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleProviderChange = (newProvider: "gemini" | "cysic") => {
    if (newProvider === "cysic") {
      setShowCysicAlert(true)
    } else {
      setProvider(newProvider)
      setModel(models[newProvider][0])
    }
  }

  const confirmCysicSelection = () => {
    setProvider("cysic")
    setModel(models["cysic"][0])
    setShowCysicAlert(false)
  }

  const getProviderLogo = (provider: string) => {
    if (provider === "gemini") {
      return <Image src="/gemini-logo.svg" alt="Gemini" width={20} height={20} />
    }
    return (
      <div className="w-5 h-5 relative bg-[#090A09] rounded-md flex items-center justify-center">
        <Image src="/cysic-logo.png" alt="Cysic" width={20} height={20} className="object-contain rounded-sm" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#090A09] text-white flex flex-col overflow-hidden">
      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        /* Webkit browsers (Chrome, Safari, Edge) */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #00ffcd, #6b2ce1);
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #00ffcd, #8b5cf6);
          transform: scale(1.1);
        }

        ::-webkit-scrollbar-corner {
          background: #1f2937;
        }

        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: #6b2ce1 #1f2937;
        }
      `}</style>

      {/* Header */}
      <div className="border-b border-gray-800 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${provider === "gemini" ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" : "bg-[#090A09]"} flex items-center justify-center`}
              >
                {getProviderLogo(provider)}
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Chat</h1>
                <p className="text-sm text-gray-400">Powered by {provider === "gemini" ? "Gemini" : "Cysic"}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* Provider Selection - Always Visible */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium">Provider:</label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="gemini" className="text-white hover:bg-gray-700 focus:bg-gray-700">
                  Gemini
                </SelectItem>
                <SelectItem value="cysic" className="text-white hover:bg-gray-700 focus:bg-gray-700">
                  Cysic
                </SelectItem>
              </SelectContent>
            </Select>

            <label className="text-sm font-medium">Model:</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {models[provider].map((m) => (
                  <SelectItem key={m} value={m} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cysic API Key Settings */}
          {provider === "cysic" && (
            <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-[#00FFCD]" />
                <h3 className="text-sm font-medium">Cysic API Key Settings</h3>
              </div>

              <div className="flex gap-2 mb-3">
                <Button
                  type="button"
                  variant={cysicApiKeyMode === "default" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCysicApiKeyMode("default")}
                  className={`text-xs ${
                    cysicApiKeyMode === "default"
                      ? "bg-[#00FFCD] text-black hover:bg-[#00FFCD]/80"
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Use default API key
                </Button>
                <Button
                  type="button"
                  variant={cysicApiKeyMode === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCysicApiKeyMode("custom")}
                  className={`text-xs ${
                    cysicApiKeyMode === "custom"
                      ? "bg-[#00FFCD] text-black hover:bg-[#00FFCD]/80"
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Use my own API key
                </Button>
              </div>

              {cysicApiKeyMode === "custom" && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter your Cysic API key..."
                    value={customCysicApiKey}
                    onChange={(e) => setCustomCysicApiKey(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-[40px] resize-none"
                    rows={1}
                  />
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>Get your API key from</span>
                    <a
                      href="https://ai.cysic.xyz/models"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00FFCD] hover:text-[#00FFCD]/80 inline-flex items-center gap-1"
                    >
                      ai.cysic.xyz/models
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Additional Settings Panel */}
      {showSettings && (
        <div className="border-b border-gray-800 p-4 bg-gray-900/50 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-400">Additional settings can be added here in the future.</p>
          </div>
        </div>
      )}

      {/* Chat Messages - Takes remaining space */}
      <div className="flex-1 overflow-hidden pb-32">
        <div className="max-w-4xl mx-auto h-full">
          <div className="h-full overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div
                  className={`w-16 h-16 rounded-full ${provider === "gemini" ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" : "bg-[#090A09]"} flex items-center justify-center mb-4`}
                >
                  {getProviderLogo(provider)}
                </div>
                <h2 className="text-2xl font-bold mb-2">Start a conversation</h2>
                <p className="text-gray-400 max-w-md">
                  Ask me anything! I'm powered by {provider === "gemini" ? "Gemini" : "Cysic"} AI and ready to help.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div
                      className={`w-8 h-8 rounded-full ${provider === "gemini" ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" : "bg-[#090A09]"} flex items-center justify-center flex-shrink-0 mt-1`}
                    >
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className={`max-w-[70%] ${message.role === "user" ? "order-1" : ""}`}>
                    <Card
                      className={`p-4 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-[#00FFCD] to-[#6B2CE1] text-white"
                          : "bg-gray-800 border-gray-700 text-white"
                      }`}
                    >
                      <div className="text-sm leading-relaxed break-words">
                        {message.content.split("\n").map((line, lineIndex) => (
                          <div key={lineIndex}>
                            {parseMarkdown(line)}
                            {lineIndex < message.content.split("\n").length - 1 && <br />}
                          </div>
                        ))}
                      </div>
                      {message.role === "assistant" && message.model && (
                        <div className="text-xs text-gray-300 mt-2 pt-2 border-t border-gray-600">{message.model}</div>
                      )}
                    </Card>
                    <div
                      className={`text-xs text-gray-500 mt-1 ${message.role === "user" ? "text-right" : "text-left"}`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div
                  className={`w-8 h-8 rounded-full ${provider === "gemini" ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" : "bg-[#090A09]"} flex items-center justify-center flex-shrink-0 mt-1`}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-400">AI is thinking...</span>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Form - Fixed at bottom of viewport */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-[#090A09] p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[44px] max-h-[200px] resize-none bg-gray-800 border-gray-700 focus:border-[#00FFCD] focus:ring-[#00FFCD] text-white placeholder-gray-400"
                disabled={loading}
                rows={1}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="bg-gradient-to-r from-[#00FFCD] to-[#6B2CE1] hover:from-[#00FFCD]/80 hover:to-[#6B2CE1]/80 text-white h-[44px] px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-xs text-gray-500 mt-2 text-center">Press Enter to send • Shift+Enter for new line</div>
        </div>
      </div>

      {/* Cysic Alert Dialog */}
      <AlertDialog open={showCysicAlert} onOpenChange={setShowCysicAlert}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cysic Provider Notice</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              There are currently some technical issues on Cysic.ai's side that may affect performance and response
              time. We recommend using Gemini for a more stable experience.
              <br />
              <br />
              Do you still want to continue with Cysic?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCysicSelection}
              className="bg-gradient-to-r from-[#00FFCD] to-[#6B2CE1] hover:from-[#00FFCD]/80 hover:to-[#6B2CE1]/80"
            >
              Continue with Cysic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
