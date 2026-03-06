import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex max-w-5xl mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
