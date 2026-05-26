import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function ConnectivityCheck() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [session, setSession] = useState<any>(null)
  const [dbStatus, setDbStatus] = useState<string>('Checking...')

  useEffect(() => {
    async function checkConnection() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        setSession(session)

        // Try a simple query to check DB connectivity using the new profiles table
        const { error: dbError } = await supabase.from('profiles').select('id').limit(1)
        
        if (dbError) {
          // If it's a 42P01 error, the table doesn't exist yet
          if (dbError.code === '42P01') {
            setDbStatus('Table "profiles" not found. Check your migration.')
          } else {
            setDbStatus(`DB Error: ${dbError.message}`)
          }
        } else {
          setDbStatus('Connected to "profiles" table')
        }

        setStatus('connected')
      } catch (err: any) {
        console.error('Connection check failed:', err)
        setStatus('error')
      }
    }

    checkConnection()
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: window.location.origin
      }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm max-w-md w-full">
      <h2 className="text-xl font-semibold mb-4">Backend Foundation Check</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Auth Status:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${status === 'connected' ? 'bg-green-100 text-green-700' : status === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
            {status.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>User:</span>
          <span className="text-sm truncate max-w-[200px]">
            {session ? session.user.email : 'Not logged in'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Database:</span>
          <span className="text-xs text-muted-foreground italic">
            {dbStatus}
          </span>
        </div>

        <div className="pt-4 flex gap-2">
          {!session ? (
            <Button onClick={handleLogin} className="w-full">
              Login with Google
            </Button>
          ) : (
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
