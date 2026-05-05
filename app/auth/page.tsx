'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { getSupabaseClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [supabaseClient, setSupabaseClient] = useState(() => getSupabaseClient())

  useEffect(() => {
    if (!supabaseClient) {
      setSupabaseClient(getSupabaseClient())
      return
    }

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/')
    })

    const { data: listener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session) router.push('/')
    })

    return () => listener.subscription.unsubscribe()
  }, [router, supabaseClient])

  if (!supabaseClient) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">Đang tải...</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white">Novel Studio</h1>
          <p className="text-gray-400 mt-2">Đăng nhập để tiếp tục</p>
        </div>

        <Auth
          supabaseClient={supabaseClient}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          redirectTo="https://thuyetthucac.vercel.app/auth/callback"
        />
      </div>
    </div>
  )
}