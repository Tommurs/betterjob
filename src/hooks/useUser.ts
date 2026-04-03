'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useSupabase } from './useSupabase'

export function useUser() {
  const supabase = useSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase])

  return { user, loading }
}
