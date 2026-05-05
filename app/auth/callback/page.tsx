'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(() => {
      router.push('/')
    })
  }, [router])

  return <div className="min-h-screen flex items-center justify-center">Đang chuyển hướng...</div>
}