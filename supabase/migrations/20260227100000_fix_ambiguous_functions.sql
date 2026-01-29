-- Migration to resolve PGRST203 error by removing overloaded function signatures
-- and establishing a single, clear definition for get_available_dates_dynamic

-- Drop all known variations of the function to clear ambiguity and ensure clean slate
DROP FUNCTION IF EXISTS public.get_available_dates_dynamic(uuid, uuid, date, date);
DROP FUNCTION IF EXISTS public.get_available_dates_dynamic(uuid, uuid, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_available_dates_dynamic(uuid, uuid, text, text);

-- Recreate the function with explicit TIMESTAMPTZ parameters to match frontend usage (ISO strings)
-- This eliminates ambiguity for PostgREST when resolving the function call
CREATE OR REPLACE FUNCTION public.get_available_dates_dynamic(
    p_professional_id UUID,
    p_service_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(available_date DATE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_timezone TEXT := 'America/Sao_Paulo';
BEGIN
    -- Calls the slot generation function (which already handles availability logic)
    -- and extracts distinct dates from the available slots
    RETURN QUERY
    SELECT DISTINCT (start_time AT TIME ZONE v_timezone)::date
    FROM public.get_available_slots_dynamic(
        p_professional_id, 
        p_service_id, 
        p_start_date, 
        p_end_date
    )
    ORDER BY 1;
END;
$$;
