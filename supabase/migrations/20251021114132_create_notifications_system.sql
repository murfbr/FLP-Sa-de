-- 1. Create ENUM type for notification types
CREATE TYPE public.notification_type AS ENUM (
    'missing_notes',
    'schedule_changed',
    'admin_override',
    'new_service'
);

-- 2. Create the professional_notifications table
CREATE TABLE public.professional_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    message TEXT NOT NULL,
    related_entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster querying
CREATE INDEX ON public.professional_notifications (professional_id);

-- Enable Realtime on the new table
ALTER TABLE public.professional_notifications REPLICA IDENTITY FULL;
GRANT SELECT ON TABLE public.professional_notifications TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.professional_notifications;


-- 3. Trigger for Missing Notes on Completed Appointments
CREATE OR REPLACE FUNCTION public.handle_missing_notes_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_name TEXT;
  appointment_time TIMESTAMPTZ;
BEGIN
  -- Check if the appointment is completed and notes are missing
  IF NEW.status = 'completed' AND OLD.status <> 'completed' AND NEW.notes IS NULL THEN
    -- Get client name and appointment time
    SELECT c.name, s.start_time INTO client_name, appointment_time
    FROM public.clients c
    JOIN public.schedules s ON s.id = NEW.schedule_id
    WHERE c.id = NEW.client_id;

    -- Insert notification
    INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
    VALUES (
      NEW.professional_id,
      'missing_notes',
      'A consulta com ' || COALESCE(client_name, 'Cliente desconhecido') || ' em ' || to_char(appointment_time, 'DD/MM/YYYY "às" HH24:MI') || ' foi concluída e ainda não possui anotações.',
      NEW.id,
      '/profissional/pacientes/' || NEW.client_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_missing_notes_notification
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.handle_missing_notes_notification();


-- 4. Trigger for Schedule Changes (Cancellation)
CREATE OR REPLACE FUNCTION public.handle_cancellation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_name TEXT;
  appointment_time TIMESTAMPTZ;
BEGIN
  -- Check if the appointment was cancelled
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    -- Get client name and appointment time
    SELECT c.name, s.start_time INTO client_name, appointment_time
    FROM public.clients c
    JOIN public.schedules s ON s.id = NEW.schedule_id
    WHERE c.id = NEW.client_id;

    -- Insert notification
    INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
    VALUES (
      NEW.professional_id,
      'schedule_changed',
      'A consulta com ' || COALESCE(client_name, 'Cliente desconhecido') || ' que estava agendada para ' || to_char(appointment_time, 'DD/MM/YYYY "às" HH24:MI') || ' foi cancelada.',
      NEW.id,
      '/profissional'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cancellation_notification
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.handle_cancellation_notification();


-- 5. Trigger for Admin-initiated Availability Changes
CREATE OR REPLACE FUNCTION public.handle_availability_change_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_data RECORD;
  message_text TEXT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    record_data := OLD;
    message_text := 'Um horário de disponibilidade recorrente foi removido pelo administrador.';
  ELSE
    record_data := NEW;
    IF (TG_OP = 'INSERT') THEN
      message_text := 'Um novo horário de disponibilidade recorrente foi adicionado pelo administrador.';
    ELSE -- UPDATE
      message_text := 'Um horário de disponibilidade recorrente foi alterado pelo administrador.';
    END IF;
  END IF;

  INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
  VALUES (
    record_data.professional_id,
    'admin_override',
    message_text,
    record_data.id,
    '/profissional'
  );

  RETURN record_data;
END;
$$;

CREATE TRIGGER trigger_recurring_availability_change
AFTER INSERT OR UPDATE OR DELETE ON public.professional_recurring_availability
FOR EACH ROW
EXECUTE FUNCTION public.handle_availability_change_notification();

CREATE OR REPLACE FUNCTION public.handle_override_change_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_data RECORD;
  message_text TEXT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    record_data := OLD;
    message_text := 'Uma exceção de disponibilidade para ' || to_char(record_data.override_date, 'DD/MM/YYYY') || ' foi removida pelo administrador.';
  ELSE
    record_data := NEW;
    IF (TG_OP = 'INSERT') THEN
      IF record_data.is_available THEN
        message_text := 'Um novo horário de disponibilidade foi adicionado para ' || to_char(record_data.override_date, 'DD/MM/YYYY') || ' pelo administrador.';
      ELSE
        message_text := 'A data ' || to_char(record_data.override_date, 'DD/MM/YYYY') || ' foi bloqueada pelo administrador.';
      END IF;
    ELSE -- UPDATE
      message_text := 'Uma exceção de disponibilidade para ' || to_char(record_data.override_date, 'DD/MM/YYYY') || ' foi alterada pelo administrador.';
    END IF;
  END IF;

  INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
  VALUES (
    record_data.professional_id,
    'admin_override',
    message_text,
    record_data.id,
    '/profissional'
  );

  RETURN record_data;
END;
$$;

CREATE TRIGGER trigger_override_availability_change
AFTER INSERT OR UPDATE OR DELETE ON public.professional_availability_overrides
FOR EACH ROW
EXECUTE FUNCTION public.handle_override_change_notification();


-- 6. Trigger for New Service Assignment
CREATE OR REPLACE FUNCTION public.handle_new_service_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_name TEXT;
BEGIN
  SELECT name INTO service_name FROM public.services WHERE id = NEW.service_id;

  INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
  VALUES (
    NEW.professional_id,
    'new_service',
    'Você foi cadastrado para oferecer o novo serviço: ' || service_name || '.',
    NEW.service_id,
    '/profissional'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_new_service_notification
AFTER INSERT ON public.professional_services
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_service_notification();
