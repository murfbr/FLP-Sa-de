import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/AuthProvider'
import { getUnreadNotificationCount } from '@/services/notifications'
import { supabase } from '@/lib/supabase/client'

export const NotificationBell = () => {
  const { professionalId, user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!professionalId) return

    const fetchCount = async () => {
      const { count } = await getUnreadNotificationCount(professionalId)
      setUnreadCount(count || 0)
    }

    fetchCount()

    const channel = supabase
      .channel('professional-notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'professional_notifications',
          filter: `professional_id=eq.${professionalId}`,
        },
        () => {
          fetchCount()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [professionalId, user])

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link to="/profissional/notifications">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  )
}
