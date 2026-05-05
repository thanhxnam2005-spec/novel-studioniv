'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, supabaseConfig } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Đang xử lý đăng nhập...')

  useEffect(() => {
    if (!supabase) return

    const handleAuthCallback = async () => {
      if (!supabase) {
        setStatus('error')
        setMessage('Supabase client không khả dụng')
        setTimeout(() => router.push('/auth'), 3000)
        return
      }

      try {
        setStatus('loading')
        setMessage('Đang xử lý đăng nhập...')

        // Handle OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setMessage('Lỗi đăng nhập: ' + error.message)
          setTimeout(() => router.push('/auth'), 3000)
          return
        }

        if (data.session) {
          console.log('Auth callback success:', data.session.user.email)
          setStatus('success')
          setMessage('Đăng nhập thành công! Đang chuyển hướng...')
          setTimeout(() => router.push('/'), 1000)
        } else {
          // If no session, try to exchange code for session (for OAuth)
          setMessage('Đang trao đổi mã xác thực...')
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(window.location.search)
          
          if (sessionError) {
            console.error('Session exchange error:', sessionError)
            setStatus('error')
            setMessage('Lỗi trao đổi phiên: ' + sessionError.message)
            setTimeout(() => router.push('/auth'), 3000)
          } else if (sessionData.session) {
            console.log('Session exchange success:', sessionData.session.user.email)
            setStatus('success')
            setMessage('Đăng nhập thành công! Đang chuyển hướng...')
            setTimeout(() => router.push('/'), 1000)
          } else {
            setStatus('error')
            setMessage('Không thể xác thực phiên đăng nhập')
            setTimeout(() => router.push('/auth'), 3000)
          }
        }
      } catch (err) {
        console.error('Auth callback exception:', err)
        setStatus('error')
        setMessage('Lỗi không mong muốn: ' + (err as Error).message)
        setTimeout(() => router.push('/auth'), 3000)
      }
    }

    handleAuthCallback()
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

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-lg shadow-black/20">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
            </div>
            <p className="text-lg font-semibold text-white mb-2">Đang xử lý</p>
            <p className="text-gray-400">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-white mb-2">Thành công</p>
            <p className="text-gray-400">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-white mb-2">Lỗi</p>
            <p className="text-gray-400 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Sẽ chuyển hướng về trang đăng nhập...</p>
          </>
        )}
      </div>
    </div>
  )
}
