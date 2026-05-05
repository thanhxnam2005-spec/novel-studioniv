'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { BookOpenIcon } from 'lucide-react'
import { supabase, supabaseConfig } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/')
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push('/')
    })

    return () => listener.subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-xl">Đang tải...</p>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg shadow-black/20">
            <BookOpenIcon className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Novel Studio</h1>
          <p className="text-gray-400">Đăng nhập hoặc đăng ký</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          redirectTo={`${window.location.origin}/auth/callback`}
        />
      </div>
    </div>
  )
}
