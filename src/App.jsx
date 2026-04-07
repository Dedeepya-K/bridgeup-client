import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import ParentDashboard from './pages/ParentDashboard'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  if (!session) return <Login supabase={supabase} />
  if (!profile) return <div className="flex items-center justify-center h-screen text-gray-500">Loading profile...</div>
  if (profile.role === 'teacher') return <TeacherDashboard supabase={supabase} profile={profile} />
  return <ParentDashboard supabase={supabase} profile={profile} />
}