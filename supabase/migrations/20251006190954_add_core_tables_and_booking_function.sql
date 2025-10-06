-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create packages table
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  session_count INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create client_packages join table
CREATE TABLE public.client_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sessions_remaining INT NOT NULL
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  schedule_id UUID UNIQUE NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  client_package_id UUID REFERENCES public.client_packages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- e.g., scheduled, completed, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create financial_records table
CREATE TABLE public.financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_package_id UUID REFERENCES public.client_packages(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX ON public.appointments (client_id);
CREATE INDEX ON public.appointments (professional_id);
CREATE INDEX ON public.schedules (professional_id, start_time);

-- Seed data for new tables
INSERT INTO public.clients (id, name, email, phone) VALUES
('8a3c6d2e-4b5f-4c6d-8e9f-0a1b2c3d4e5f', 'Carlos Pereira', 'carlos.p@example.com', '11987654321'),
('b94d7e3f-5c6a-4d7e-9f0a-1b2c3d4e5f6a', 'Mariana Costa', 'mariana.c@example.com', '21912345678');

-- Create a function to book an appointment atomically
CREATE OR REPLACE FUNCTION book_appointment(
  p_schedule_id UUID,
  p_client_id UUID,
  p_service_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_professional_id UUID;
  v_appointment_id UUID;
BEGIN
  -- Check if the slot is available and get professional_id
  SELECT professional_id INTO v_professional_id
  FROM public.schedules
  WHERE id = p_schedule_id AND is_booked = FALSE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Horário não disponível ou inexistente.';
  END IF;

  -- Mark the schedule as booked
  UPDATE public.schedules
  SET is_booked = TRUE
  WHERE id = p_schedule_id;

  -- Create the appointment
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id)
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;
