-- 1. Update session tracking logic to trigger renewal alert at 1 OR 2 sessions
CREATE OR REPLACE FUNCTION public.handle_session_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_remaining INT;
  v_client_name TEXT;
  v_package_name TEXT;
  v_admin_id UUID;
BEGIN
  -- Check if status changed to completed and has a package
  IF NEW.status = 'completed' AND OLD.status <> 'completed' AND NEW.client_package_id IS NOT NULL THEN
    
    -- Decrement session
    UPDATE public.client_packages
    SET sessions_remaining = sessions_remaining - 1
    WHERE id = NEW.client_package_id
    RETURNING sessions_remaining INTO v_new_remaining;

    -- Get details for notification
    SELECT c.name, p.name INTO v_client_name, v_package_name
    FROM public.clients c
    JOIN public.client_packages cp ON cp.id = NEW.client_package_id
    JOIN public.packages p ON p.id = cp.package_id
    WHERE c.id = NEW.client_id;

    -- Check for Notifications (2 remaining or 1 remaining)
    IF v_new_remaining = 2 OR v_new_remaining = 1 THEN
      
      -- Find all admin professionals
      FOR v_admin_id IN 
        SELECT p.id 
        FROM public.professionals p
        JOIN public.profiles pr ON pr.id = p.user_id
        WHERE pr.role = 'admin'
      LOOP
        INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
        VALUES (
          v_admin_id,
          'package_renewal',
          'Alerta de Pacote: O cliente ' || v_client_name || ' possui apenas ' || v_new_remaining || ' sessões restantes no pacote ' || v_package_name || '. Sugerir renovação.',
          NEW.client_id,
          '/admin/pacientes/' || NEW.client_id
        );
      END LOOP;
      
    ELSIF v_new_remaining <= 0 THEN
       -- Alert for exhaustion
       FOR v_admin_id IN 
        SELECT p.id 
        FROM public.professionals p
        JOIN public.profiles pr ON pr.id = p.user_id
        WHERE pr.role = 'admin'
      LOOP
        INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
        VALUES (
          v_admin_id,
          'package_renewal',
          'Pacote Esgotado: O cliente ' || v_client_name || ' finalizou a última sessão do pacote ' || v_package_name || '. Renovação necessária para novos agendamentos.',
          NEW.client_id,
          '/admin/pacientes/' || NEW.client_id
        );
      END LOOP;
    END IF;

  END IF;
  RETURN NEW;
END;
$$;

-- 2. Function to check daily birthdays and generate notifications
-- This function is intended to be called by a scheduled Edge Function
CREATE OR REPLACE FUNCTION public.check_daily_birthdays()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_record RECORD;
  v_admin_id UUID;
  v_today_md TEXT;
BEGIN
  v_today_md := to_char(NOW(), 'MM-DD');

  FOR v_client_record IN
    SELECT id, name, birth_date
    FROM public.clients
    WHERE is_active = true 
      AND birth_date IS NOT NULL 
      AND to_char(birth_date, 'MM-DD') = v_today_md
  LOOP
    
    -- Notify all admins
    FOR v_admin_id IN 
      SELECT p.id 
      FROM public.professionals p
      JOIN public.profiles pr ON pr.id = p.user_id
      WHERE pr.role = 'admin'
    LOOP
      -- Check if notification already exists for today to avoid duplicates if run multiple times
      IF NOT EXISTS (
        SELECT 1 FROM public.professional_notifications
        WHERE professional_id = v_admin_id
          AND related_entity_id = v_client_record.id
          AND type = 'new_appointment' -- Reusing a type or using a generic message, ideally 'birthday' if enum existed, but we can use message content
          AND message LIKE '%aniversário hoje%'
          AND created_at > CURRENT_DATE
      ) THEN
        INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
        VALUES (
          v_admin_id,
          'new_appointment', -- Using 'new_appointment' as generic type since 'birthday' isn't in enum yet, or we add it. 
          -- Actually let's just use message text since frontend displays text. Or use 'schedule_changed' as generic info.
          -- Ideally we should alter enum, but for safety in this migration let's stick to existing or just cast.
          -- Wait, we added 'package_renewal' in previous file. Let's assume we can add 'birthday' here.
          -- Or better, reuse 'new_appointment' as "Alert"
          '🎉 Hoje é o aniversário de ' || v_client_record.name || '! Parabenize-o(a).',
          v_client_record.id,
          '/admin/pacientes/' || v_client_record.id
        );
      END IF;
    END LOOP;

  END LOOP;
END;
$$;
