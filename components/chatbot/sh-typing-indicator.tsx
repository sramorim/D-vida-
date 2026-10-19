'use client'

import { Bot } from 'lucide-react'

export function ShTypingIndicator() {
  return (
    <div className="flex gap-2.5 animate-in">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E293B] ring-1 ring-white/10">
        <Bot size={13} className="text-[#00E5FF]" />
      </div>

      <div className="flex flex-col gap-1 items-start">
        <div className="rounded-2xl rounded-bl-md bg-[#1E293B] border border-white/5 px-4 py-3">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-white/40 mr-1">Assistente está digitando</span>
            <span className="flex gap-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00E5FF]/60 animate-bounce [animation-delay:-0.3s]" />
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00E5FF]/60 animate-bounce [animation-delay:-0.15s]" />
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00E5FF]/60 animate-bounce" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
