import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useStore } from '../../store/index'

export function AuthGuard({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user)
  if (user === null) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user)
  if (user === null) return <Navigate to="/login" replace />
  if (!user.isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}
