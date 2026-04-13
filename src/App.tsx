import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AuthGuard, AdminGuard } from './components/ui/Guards'
import { useAuth } from './hooks/useAuth'
import { useGroups } from './hooks/useGroups'
import { Home } from './pages/Home'
import { Groups } from './pages/Groups'
import { GroupPage } from './pages/GroupPage'
import { PostDetail } from './pages/PostDetail'
import { Login } from './pages/Login'
import { AdminDashboard } from './pages/Admin/Dashboard'
import { AdminPosts } from './pages/Admin/Posts'
import { AdminGroups } from './pages/Admin/Groups'
import { AdminSettings } from './pages/Admin/Settings'

function AppProviders() {
  useAuth()
  useGroups()
  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppProviders />}>
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/gruplar" element={<Groups />} />
            <Route path="/grup/:slug" element={<GroupPage />} />
            <Route path="/post/:id" element={<PostDetail />} />

            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <Outlet />
                </AdminGuard>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="groups" element={<AdminGroups />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
