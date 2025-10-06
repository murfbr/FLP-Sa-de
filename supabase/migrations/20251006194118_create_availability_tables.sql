-- Table for recurring weekly availability
CREATE TABLE public.professional_recurring_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT professional_recurring_availability_day_check CHECK (day_of_week >= 0 AND day_of_week <= 6),
  UNIQUE(professional_id, day_of_week, start_time, end_time)
);

-- Table for specific date overrides or one-off availability
CREATE TABLE public.professional_availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE for available, FALSE for unavailable/blocked
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(professional_id, override_date, start_time, end_time)
);

-- Add indexes for performance
CREATE INDEX ON public.professional_recurring_availability (professional_id);
CREATE INDEX ON public.professional_availability_overrides (professional_id, override_date);

-- SEED DATA for Dr. Lucas Mendes ('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f')
-- Monday to Friday, 9am to 5pm, with a lunch break from 12pm to 1pm.
INSERT INTO public.professional_recurring_availability (professional_id, day_of_week, start_time, end_time) VALUES
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 1, '09:00:00', '12:00:00'), -- Monday Morning
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 1, '13:00:00', '17:00:00'), -- Monday Afternoon
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 2, '09:00:00', '12:00:00'), -- Tuesday Morning
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 2, '13:00:00', '17:00:00'), -- Tuesday Afternoon
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 3, '09:00:00', '12:00:00'), -- Wednesday Morning
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 3, '13:00:00', '17:00:00'), -- Wednesday Afternoon
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 4, '09:00:00', '12:00:00'), -- Thursday Morning
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 4, '13:00:00', '17:00:00'), -- Thursday Afternoon
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 5, '09:00:00', '12:00:00'); -- Friday Morning

-- Example override: Dr. Lucas is unavailable next Monday morning
INSERT INTO public.professional_availability_overrides (professional_id, override_date, start_time, end_time, is_available)
SELECT 'c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', (CURRENT_DATE + ( (8 - EXTRACT(ISODOW FROM CURRENT_DATE))::int % 7 ) * interval '1 day')::date, '09:00:00', '12:00:00', FALSE;

-- Example override: Dr. Lucas is available next Saturday for a special event
INSERT INTO public.professional_availability_overrides (professional_id, override_date, start_time, end_time, is_available)
SELECT 'c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', (CURRENT_DATE + ( (13 - EXTRACT(ISODOW FROM CURRENT_DATE))::int % 7 ) * interval '1 day')::date, '10:00:00', '14:00:00', TRUE;
