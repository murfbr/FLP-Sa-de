import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseAdminClient } from '../_shared/supabase-client.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { email, password, name, specialty, bio, avatar_url } =
      await req.json()

    if (!email || !password || !name) {
      throw new Error('Email, password and name are required.')
    }

    // 1. Create Auth User
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto confirm so they can login immediately
        user_metadata: { name },
      })

    if (authError) throw authError
    const userId = authData.user.id

    // 2. Create Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: userId, role: 'professional' })

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw profileError
    }

    // 3. Create Professional Entry
    const { data: professionalData, error: professionalError } =
      await supabaseAdmin
        .from('professionals')
        .insert({
          user_id: userId,
          name,
          specialty,
          bio,
          avatar_url,
        })
        .select()
        .single()

    if (professionalError) {
      // Cleanup auth user and profile if professional creation fails
      await supabaseAdmin.from('profiles').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw professionalError
    }

    return new Response(
      JSON.stringify({ success: true, data: professionalData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating professional:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
