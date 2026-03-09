import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useStore } from '../../store/index'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <img src="/icons/icon.svg" alt="50 Medya" className="w-16 h-16 rounded-2xl animate-pulse" />
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user)
  const authLoading = useStore((s) => s.authLoading)

  if (authLoading) return <Spinner />
  if (user === null) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user)
  const authLoading = useStore((s) => s.authLoading)

  if (authLoading) return <Spinner />
  if (user === null) return <Navigate to="/login" replace />
  if (!user.isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}
