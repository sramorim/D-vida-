'use client'

import { useEffect, useState } from 'react'

interface LoadingScanProps {
  progress: number
  query: string
}

export function LoadingScan({ progress, query }: LoadingScanProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="card border-neon/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
        <div>
          <div className="text-[12px] font-bold text-white/80">
            Escaneando{dots}
          </div>
          <div className="text-[10px] text-white/30 font-mono">
            {query}
          </div>
        </div>
      </div>

      <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-neon/50 to-neon transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="mt-2 text-right text-[10px] text-white/20 font-mono">
        {Math.round(progress)}%
      </div>
    </div>
  )
}
