-- Add new notification types
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_appointment';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'rescheduled_appointment';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'cancelled_appointment';

-- Function for New Appointment Notification
CREATE OR REPLACE FUNCTION public.handle_new_appointment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_name TEXT;
  service_name TEXT;
  appointment_time TIMESTAMPTZ;
BEGIN
  SELECT c.name, s.name, sch.start_time
  INTO client_name, service_name, appointment_time
  FROM public.clients c
  JOIN public.services s ON s.id = NEW.service_id
  JOIN public.schedules sch ON sch.id = NEW.schedule_id
  WHERE c.id = NEW.client_id;

  INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
  VALUES (
    NEW.professional_id,
    'new_appointment',
    'Novo agendamento: ' || client_name || ' - ' || service_name || ' em ' || to_char(appointment_time, 'DD/MM/YYYY "às" HH24:MI'),
    NEW.id,
    '/profissional/pacientes/' || NEW.client_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_new_appointment_notification ON public.appointments;
CREATE TRIGGER trigger_new_appointment_notification
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_appointment_notification();

-- Function for Rescheduled Appointment Notification
CREATE OR REPLACE FUNCTION public.handle_rescheduled_appointment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_name TEXT;
  old_time TIMESTAMPTZ;
  new_time TIMESTAMPTZ;
BEGIN
  -- Check if schedule_id changed
  IF NEW.schedule_id <> OLD.schedule_id THEN
    SELECT name INTO client_name FROM public.clients WHERE id = NEW.client_id;
    SELECT start_time INTO old_time FROM public.schedules WHERE id = OLD.schedule_id;
    SELECT start_time INTO new_time FROM public.schedules WHERE id = NEW.schedule_id;

    INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
    VALUES (
      NEW.professional_id,
      'rescheduled_appointment',
      'Agendamento remarcado: ' || client_name || ' de ' || to_char(old_time, 'DD/MM/YYYY HH24:MI') || ' para ' || to_char(new_time, 'DD/MM/YYYY HH24:MI'),
      NEW.id,
      '/profissional/pacientes/' || NEW.client_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_rescheduled_appointment_notification ON public.appointments;
CREATE TRIGGER trigger_rescheduled_appointment_notification
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.handle_rescheduled_appointment_notification();

-- Update Cancellation Notification to include Service Name and use 'cancelled_appointment' type
CREATE OR REPLACE FUNCTION public.handle_cancellation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_name TEXT;
  service_name TEXT;
  appointment_time TIMESTAMPTZ;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    SELECT c.name, s.name, sch.start_time
    INTO client_name, service_name, appointment_time
    FROM public.clients c
    JOIN public.services s ON s.id = NEW.service_id
    JOIN public.schedules sch ON sch.id = NEW.schedule_id
    WHERE c.id = NEW.client_id;

    INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
    VALUES (
      NEW.professional_id,
      'cancelled_appointment',
      'Agendamento cancelado: ' || client_name || ' (' || service_name || ') em ' || to_char(appointment_time, 'DD/MM/YYYY "às" HH24:MI'),
      NEW.id,
      '/profissional'
    );
  END IF;
  RETURN NEW;
END;
$$;
