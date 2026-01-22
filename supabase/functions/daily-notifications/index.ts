import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Check birthdays
    const { error: birthdayError } = await supabase.rpc('check_daily_birthdays')
    if (birthdayError)
      console.error('Error processing birthdays:', birthdayError)

    // 2. Check missing notes (New Feature)
    const { error: notesError } = await supabase.rpc(
      'process_missing_notes_notifications',
    )
    if (notesError) console.error('Error processing missing notes:', notesError)

    if (birthdayError || notesError) {
      throw new Error('Some notifications failed to process.')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily notifications processed (Birthdays & Missing Notes).',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Error processing daily notifications:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
