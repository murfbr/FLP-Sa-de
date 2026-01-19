CREATE OR REPLACE FUNCTION book_recurring_appointment_series(
  p_professional_id UUID,
  p_client_id UUID,
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_client_package_id UUID DEFAULT NULL,
  p_occurrences INT DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_i INT;
  v_current_start_time TIMESTAMPTZ;
BEGIN
  IF p_occurrences < 1 THEN
    RAISE EXCEPTION 'O número de ocorrências deve ser pelo menos 1.';
  END IF;

  IF p_occurrences > 52 THEN
    RAISE EXCEPTION 'O número máximo de ocorrências é 52 (1 ano).';
  END IF;

  FOR v_i IN 0..(p_occurrences - 1) LOOP
    v_current_start_time := p_start_time + (v_i * interval '1 week');

    -- We wrap the call in a block to catch errors and add context (e.g. which date failed)
    BEGIN
      -- Call the existing dynamic booking function
      -- This handles schedule creation, availability check, and insertion
      PERFORM book_appointment_dynamic(
        p_professional_id := p_professional_id,
        p_client_id := p_client_id,
        p_service_id := p_service_id,
        p_start_time := v_current_start_time,
        p_client_package_id := p_client_package_id,
        p_is_recurring := TRUE
      );
    EXCEPTION WHEN OTHERS THEN
       -- Re-raise with date context
       -- SQLERRM contains the original error message
       RAISE EXCEPTION 'Erro ao agendar para %: %', v_current_start_time::date, SQLERRM;
    END;
    
  END LOOP;
END;
$$;
