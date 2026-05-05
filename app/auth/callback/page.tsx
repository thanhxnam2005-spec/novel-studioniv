'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, supabaseConfig } from '@/lib/supabase'
import { Loader2Icon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'

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
        setTimeout(() => router.replace('/auth'), 3000)
        return
      }

      try {
        setStatus('loading')
        setMessage('Đang xử lý đăng nhập...')

        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setMessage('Lỗi đăng nhập: ' + error.message)
          setTimeout(() => router.replace('/auth'), 3000)
          return
        }

        if (data.session) {
          console.log('Auth callback success:', data.session.user.email)
          setStatus('success')
          setMessage('Đăng nhập thành công! Đang chuyển hướng...')
          setTimeout(() => router.replace('/'), 1000)
        } else {
          setMessage('Đang trao đổi mã xác thực...')
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(window.location.search)
          
          if (sessionError) {
            console.error('Session exchange error:', sessionError)
            setStatus('error')
            setMessage('Lỗi trao đổi phiên: ' + sessionError.message)
            setTimeout(() => router.replace('/auth'), 3000)
          } else if (sessionData.session) {
            console.log('Session exchange success:', sessionData.session.user.email)
            setStatus('success')
            setMessage('Đăng nhập thành công! Đang chuyển hướng...')
            setTimeout(() => router.replace('/'), 1000)
          } else {
            setStatus('error')
            setMessage('Không thể xác thực phiên đăng nhập')
            setTimeout(() => router.replace('/auth'), 3000)
          }
        }
      } catch (err) {
        console.error('Auth callback exception:', err)
        setStatus('error')
        setMessage('Lỗi không mong muốn: ' + (err as Error).message)
        setTimeout(() => router.replace('/auth'), 3000)
      }
    }

    handleAuthCallback()
  }, [router])

  if (!supabase) {
    const missing: string[] = []
    if (!supabaseConfig.url) missing.push('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
    if (!supabaseConfig.anonKey)
      missing.push(
        'NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY',
      )

    return (
      <div className="auth-cb-page">
        <div className="auth-cb-bg" />
        <div className="auth-cb-center">
          <div className="auth-cb-card">
            <p className="auth-cb-error-title">Không thể kết nối Supabase</p>
            <p className="auth-cb-desc">Vui lòng kiểm tra biến môi trường.</p>
            {missing.length > 0 && (
              <div className="auth-cb-error-list">
                <p style={{ fontWeight: 600 }}>Biến thiếu:</p>
                <ul>
                  {missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <style>{cbStyles}</style>
      </div>
    )
  }

  return (
    <div className="auth-cb-page">
      <div className="auth-cb-bg" />
      <div className="auth-cb-center">
        <div className="auth-cb-card">
          {status === 'loading' && (
            <>
              <div className="auth-cb-icon-wrap auth-cb-icon-loading">
                <Loader2Icon className="auth-cb-icon auth-cb-spin" />
              </div>
              <p className="auth-cb-title">Đang xử lý</p>
              <p className="auth-cb-desc">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="auth-cb-icon-wrap auth-cb-icon-success">
                <CheckCircle2Icon className="auth-cb-icon" />
              </div>
              <p className="auth-cb-title">Thành công</p>
              <p className="auth-cb-desc">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="auth-cb-icon-wrap auth-cb-icon-error">
                <XCircleIcon className="auth-cb-icon" />
              </div>
              <p className="auth-cb-title">Lỗi</p>
              <p className="auth-cb-desc">{message}</p>
              <p className="auth-cb-redirect-hint">Sẽ chuyển hướng về trang đăng nhập...</p>
            </>
          )}
        </div>
      </div>
      <style>{cbStyles}</style>
    </div>
  )
}

const cbStyles = `
  .auth-cb-page {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-family: var(--font-open-sans, system-ui, sans-serif);
  }

  .auth-cb-bg {
    position: absolute;
    inset: 0;
    background: oklch(0.12 0.008 280);
    background-image:
      radial-gradient(at 20% 20%, oklch(0.18 0.04 150 / 40%) 0px, transparent 50%),
      radial-gradient(at 80% 80%, oklch(0.15 0.03 280 / 30%) 0px, transparent 50%);
  }

  .auth-cb-center {
    position: relative;
    z-index: 10;
    padding: 24px;
  }

  .auth-cb-card {
    max-width: 420px;
    background: oklch(0.16 0.005 280 / 80%);
    backdrop-filter: blur(40px) saturate(1.5);
    border: 1px solid oklch(1 0 0 / 8%);
    border-radius: 24px;
    padding: 40px 32px;
    text-align: center;
    box-shadow: 0 20px 60px -10px oklch(0 0 0 / 50%);
    animation: auth-cb-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes auth-cb-enter {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .auth-cb-icon-wrap {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .auth-cb-icon-loading {
    background: oklch(0.65 0.15 150 / 10%);
    color: oklch(0.65 0.15 150);
  }

  .auth-cb-icon-success {
    background: oklch(0.65 0.15 150 / 15%);
    color: oklch(0.65 0.15 150);
  }

  .auth-cb-icon-error {
    background: oklch(0.60 0.15 25 / 15%);
    color: oklch(0.75 0.15 25);
  }

  .auth-cb-icon {
    width: 32px;
    height: 32px;
  }

  .auth-cb-spin {
    animation: auth-cb-spin-anim 0.8s linear infinite;
  }

  @keyframes auth-cb-spin-anim {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .auth-cb-title {
    font-size: 18px;
    font-weight: 700;
    color: oklch(0.96 0.005 280);
    margin: 0 0 6px;
  }

  .auth-cb-desc {
    font-size: 14px;
    color: oklch(0.55 0.005 280);
    margin: 0;
  }

  .auth-cb-redirect-hint {
    font-size: 12px;
    color: oklch(0.40 0.005 280);
    margin-top: 12px;
  }

  .auth-cb-error-title {
    color: oklch(0.75 0.15 25);
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 8px;
  }

  .auth-cb-error-list {
    background: oklch(0.15 0.04 25 / 30%);
    border-radius: 12px;
    padding: 12px 16px;
    text-align: left;
    font-size: 13px;
    color: oklch(0.80 0.08 25);
    margin-top: 12px;
  }

  .auth-cb-error-list ul {
    margin: 6px 0 0;
    padding-left: 20px;
  }
`
