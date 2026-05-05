'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabaseClient = getSupabaseClient()
    if (!supabaseClient) return

    supabaseClient.auth.getSession().then(() => {
      router.push('/')
    })
  }, [router])

  return <div className="min-h-screen flex items-center justify-center">Đang chuyển hướng...</div>
}