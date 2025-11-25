import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type Notification =
  Database['public']['Tables']['professional_notifications']['Row']

export async function getNotifications(professionalId: string) {
  const { data, error } = await supabase
    .from('professional_notifications')
    .select('*')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function getRecentUnreadNotifications(
  professionalId: string,
  limit = 3,
) {
  const { data, error } = await supabase
    .from('professional_notifications')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data, error }
}

export async function getUnreadNotificationCount(professionalId: string) {
  const { count, error } = await supabase
    .from('professional_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .eq('is_read', false)

  return { count, error }
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('professional_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  return { error }
}

export async function markAllNotificationsAsRead(professionalId: string) {
  const { error } = await supabase
    .from('professional_notifications')
    .update({ is_read: true })
    .eq('professional_id', professionalId)
    .eq('is_read', false)

  return { error }
}
