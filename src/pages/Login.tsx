import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../services/auth'
import { useStore } from '../store'

export function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const user = useStore((s) => s.user)

  if (user) {
    navigate('/')
    return null
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (e) {
      setError('Giriş yapılamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-sky-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm text-center">
        <img src="/icons/icon.svg" alt="50 Medya" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow" />
        <h1 className="text-2xl font-bold text-slate-800 mb-1">50 Medya</h1>
        <p className="text-sm text-slate-500 mb-8">Sosyal medya içeriklerini keşfet ve paylaş</p>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-4">{error}</p>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          )}
          Google ile Giriş Yap
        </button>

        <p className="text-xs text-slate-400 mt-6">
          Giriş yaparak kullanım koşullarını kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  )
}
