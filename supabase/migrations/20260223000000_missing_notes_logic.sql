-- Function to process missing notes notifications
CREATE OR REPLACE FUNCTION process_missing_notes_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_appt RECORD;
BEGIN
  -- Select completed appointments older than 24h with no notes
  FOR v_appt IN
    SELECT 
      a.id, 
      a.professional_id, 
      a.client_id,
      c.name as client_name, 
      s.name as service_name
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    JOIN services s ON a.service_id = s.id
    JOIN schedules sch ON a.schedule_id = sch.id
    WHERE a.status = 'completed'
      AND (a.notes IS NULL OR jsonb_array_length(a.notes) = 0)
      AND sch.end_time::timestamp < (now() - interval '24 hours')
      AND NOT EXISTS (
        SELECT 1 FROM professional_notifications pn
        WHERE pn.related_entity_id = a.id
          AND pn.type = 'missing_notes'
      )
  LOOP
    -- Insert notification
    INSERT INTO professional_notifications (
      professional_id,
      message,
      type,
      link,
      related_entity_id,
      is_read
    ) VALUES (
      v_appt.professional_id,
      format('O atendimento de %s (%s) está sem anotações há mais de 24h.', v_appt.client_name, v_appt.service_name),
      'missing_notes',
      format('/profissional/pacientes/%s', v_appt.client_id),
      v_appt.id,
      false
    );
  END LOOP;
END;
$$;
