import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase/client';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const verifySession = async (currentSession: Session | null) => {
      if (!currentSession) {
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
        return;
      }

      try {
        // Verify against the database that the user and profile actually exist
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', currentSession.user.id)
          .single();

        if (error || !profile) {
          // If no profile exists, the user data is invalid or deleted. Force logout.
          await supabase.auth.signOut();
          if (mounted) {
            setSession(null);
            currentUserIdRef.current = undefined;
          }
        } else {
          if (mounted) {
            setSession(currentSession);
            currentUserIdRef.current = currentSession.user.id;
          }
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        if (mounted) {
          setSession(null);
          currentUserIdRef.current = undefined;
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      verifySession(session);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, newSession: Session | null) => {
      // We don't want to show loading screen again for token refreshes, 
      // but we do want to verify new sign-ins or handle sign-outs.
      if (!newSession) {
        if (mounted) {
          setSession(null);
          currentUserIdRef.current = undefined;
        }
      } else if (newSession.user.id !== currentUserIdRef.current) {
        // Only re-verify if it's a completely new user ID signing in to avoid infinite loops
        verifySession(newSession);
      } else {
        // Just token refresh or metadata update, update session silently
        if (mounted) setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar',
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { session, loading, login, logout };
}
