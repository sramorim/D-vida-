'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShChatMessage } from './sh-chat-message'
import { ShTypingIndicator } from './sh-typing-indicator'
import type { ChatMessage } from '@/lib/chatbot/knowledge-base'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Olá! Sou o assistente do **SHANDON ELITE**. Posso ajudar com dúvidas sobre o projeto, explicar ferramentas ou analisar resultados. Como posso ajudar?',
  timestamp: Date.now(),
}

export function ShChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isTyping) return

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const json = await res.json()

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: json.success ? json.data.response : 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: json.success ? json.data.data?.timestamp ?? Date.now() : Date.now(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Erro de conexão. Verifique sua internet e tente novamente.',
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsTyping(false)
  }, [inputText, isTyping])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300',
          'bg-[#00E5FF] text-[#05070A] shadow-[0_0_30px_rgba(0,229,255,0.3)]',
          'hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] hover:scale-105',
          'active:scale-95',
          isOpen && 'rotate-0 bg-[#1E293B] text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.1)]',
          'md:bottom-5 md:right-5 bottom-4 right-4'
        )}
        aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden',
            'bg-[#0F121A] border border-[#1E293B] rounded-2xl',
            'shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,229,255,0.05)]',
            'animate-in',
            'bottom-20 right-4 w-[calc(100vw-2rem)] max-w-[400px] h-[500px]',
            'md:bottom-20 md:right-5 md:w-[400px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[#1E293B] bg-[#0A0D14] px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00E5FF]/10 ring-1 ring-[#00E5FF]/20">
              <Bot size={16} className="text-[#00E5FF]" />
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-bold tracking-wider text-white/90">
                ASSISTENTE SHANDON
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#22FF88]/60">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22FF88] animate-pulse" />
                Online
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10 transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scrollbar-thin">
            {messages.map(msg => (
              <ShChatMessage key={msg.id} message={msg} />
            ))}
            {isTyping && <ShTypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#1E293B] bg-[#0A0D14] px-3 py-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                disabled={isTyping}
                className="flex-1 rounded-full bg-white/5 border border-[#1E293B] px-4 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#00E5FF]/30 focus:ring-1 focus:ring-[#00E5FF]/20 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isTyping}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                  'bg-[#00E5FF] text-[#05070A]',
                  'hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]',
                  'disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none',
                  'active:scale-95'
                )}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
