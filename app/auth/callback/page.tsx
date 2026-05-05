'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, supabaseConfig } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(() => {
      router.push('/')
    })
  }, [router])

  if (!supabase) {
    const missing = []
    if (!supabaseConfig.url) missing.push('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
    if (!supabaseConfig.anonKey)
      missing.push(
        'NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY',
      )

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-lg shadow-black/20">
          <p className="text-red-300 text-lg font-semibold mb-3">Không thể kết nối Supabase.</p>
          <p className="text-gray-300 mb-4">Vui lòng kiểm tra biến môi trường.</p>
          {missing.length > 0 ? (
            <div className="rounded-xl bg-red-950/40 p-3 text-left text-sm text-red-100">
              <p className="font-medium">Biến thiếu:</p>
              <ul className="list-disc pl-5">
                {missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return <div className="min-h-screen flex items-center justify-center">Đang chuyển hướng...</div>
}
