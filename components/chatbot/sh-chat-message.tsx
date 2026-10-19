'use client'

import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'
import type { ChatMessage } from '@/lib/chatbot/knowledge-base'

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatContent(content: string): string {
  let html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n•/g, '<br/>•')
    .replace(/\n/g, '<br/>')
  return html
}

interface ShChatMessageProps {
  message: ChatMessage
}

export function ShChatMessage({ message }: ShChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-2.5 animate-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-[#00E5FF]/20 ring-1 ring-[#00E5FF]/30'
            : 'bg-[#1E293B] ring-1 ring-white/10'
        )}
      >
        {isUser ? (
          <User size={13} className="text-[#00E5FF]" />
        ) : (
          <Bot size={13} className="text-[#00E5FF]" />
        )}
      </div>

      <div
        className={cn(
          'flex flex-col gap-1 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
            isUser
              ? 'bg-[#00E5FF] text-[#05070A] rounded-br-md'
              : 'bg-[#1E293B] text-white/90 border border-white/5 rounded-bl-md'
          )}
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />
        <span className="text-[10px] text-white/25 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
