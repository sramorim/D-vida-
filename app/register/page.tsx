'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShAuthModal } from '@/components/sh-auth-modal'

export default function RegisterPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = document.cookie.split('; ').find(c => c.startsWith('shandon-auth-token='))
    if (token) {
      router.replace('/')
    } else {
      setChecking(false)
    }
  }, [router])

  if (checking) return null

  return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center">
      <div className="matrix-bg" />
      <div className="scan-line" />
      <ShAuthModal
        isOpen={true}
        onClose={() => router.replace('/')}
        mode="register"
        onAuth={() => router.replace('/')}
      />
    </div>
  )
}
