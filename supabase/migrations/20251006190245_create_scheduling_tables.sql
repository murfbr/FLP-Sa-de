-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create professionals table
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a join table for professionals and services (many-to-many)
CREATE TABLE public.professional_services (
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, service_id)
);

-- Create schedules table for professional availability
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add some seed data
-- Services
INSERT INTO public.services (id, name, description) VALUES
('f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a', 'Fisioterapia', 'Sessões de fisioterapia para reabilitação e prevenção de lesões.'),
('a2c4e6b8-1d2c-3b4a-5e6f-7a8b9c0d1e2f', 'Pilates', 'Aulas de Pilates para fortalecimento, flexibilidade e consciência corporal.'),
('b3d5f7c9-2e3d-4c5b-6f7a-8b9c0d1e2f3a', 'Recovery', 'Sessões de recuperação muscular com botas de compressão e massagem.');

-- Professionals
INSERT INTO public.professionals (id, name, specialty, avatar_url) VALUES
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 'Dr. Lucas Mendes', 'Fisioterapeuta Ortopédico', 'https://img.usecurling.com/ppl/medium?gender=male&seed=1'),
('d5f7a9e1-4b5c-6d7e-8f9b-0c1d2e3f4a5b', 'Dra. Ana Clara', 'Fisioterapeuta Esportiva', 'https://img.usecurling.com/ppl/medium?gender=female&seed=2'),
('e6a8b0f2-5c6d-7e8f-9b0c-1d2e3f4a5b6c', 'Prof. Sofia Lima', 'Instrutora de Pilates', 'https://img.usecurling.com/ppl/medium?gender=female&seed=3');

-- Link professionals to services
INSERT INTO public.professional_services (professional_id, service_id) VALUES
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 'f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a'), -- Dr. Lucas -> Fisioterapia
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 'b3d5f7c9-2e3d-4c5b-6f7a-8b9c0d1e2f3a'), -- Dr. Lucas -> Recovery
('d5f7a9e1-4b5c-6d7e-8f9b-0c1d2e3f4a5b', 'f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a'), -- Dra. Ana -> Fisioterapia
('e6a8b0f2-5c6d-7e8f-9b0c-1d2e3f4a5b6c', 'a2c4e6b8-1d2c-3b4a-5e6f-7a8b9c0d1e2f'); -- Prof. Sofia -> Pilates

-- Seed some available schedules for the next few days
-- Note: Using UTC for timestamps. The frontend will need to handle timezones.
-- For Dr. Lucas Mendes
INSERT INTO public.schedules (professional_id, start_time, end_time)
SELECT
  'c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f',
  (CURRENT_DATE + interval '1 day' + (n || ' hours')::interval),
  (CURRENT_DATE + interval '1 day' + ((n+1) || ' hours')::interval)
FROM generate_series(9, 17) as n
WHERE n NOT IN (12, 13); -- Lunch break

-- For Dra. Ana Clara
INSERT INTO public.schedules (professional_id, start_time, end_time)
SELECT
  'd5f7a9e1-4b5c-6d7e-8f9b-0c1d2e3f4a5b',
  (CURRENT_DATE + interval '2 day' + (n || ' hours')::interval),
  (CURRENT_DATE + interval '2 day' + ((n+1) || ' hours')::interval)
FROM generate_series(10, 18) as n
WHERE n NOT IN (13, 14); -- Lunch break

-- For Prof. Sofia Lima
INSERT INTO public.schedules (professional_id, start_time, end_time)
SELECT
  'e6a8b0f2-5c6d-7e8f-9b0c-1d2e3f4a5b6c',
  (CURRENT_DATE + interval '1 day' + (n || ' hours')::interval),
  (CURRENT_DATE + interval '1 day' + ((n+1) || ' hours')::interval)
FROM generate_series(8, 11) as n;
