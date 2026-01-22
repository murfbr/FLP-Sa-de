CREATE OR REPLACE FUNCTION process_missing_notes_notifications()
RETURNS void AS $$
DECLARE
  appt RECORD;
BEGIN
  -- Iterate over appointments that are completed, have no notes, ended more than 24h ago
  -- and don't have a notification yet.
  FOR appt IN
    SELECT 
      a.id, 
      a.professional_id, 
      a.client_id,
      s.end_time
    FROM appointments a
    JOIN schedules s ON a.schedule_id = s.id
    WHERE a.status = 'completed'
      AND (a.notes IS NULL OR jsonb_array_length(a.notes::jsonb) = 0)
      AND s.end_time::timestamp < (now() - interval '24 hours')
      AND NOT EXISTS (
        SELECT 1 FROM professional_notifications pn
        WHERE pn.related_entity_id = a.id
          AND pn.type = 'missing_notes'
      )
  LOOP
    INSERT INTO professional_notifications (
      professional_id,
      message,
      type,
      link,
      related_entity_id,
      is_read
    ) VALUES (
      appt.professional_id,
      'Atenção: O agendamento finalizado há mais de 24h está sem anotações de prontuário.',
      'missing_notes',
      '/profissional/pacientes/' || appt.client_id,
      appt.id,
      false
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
