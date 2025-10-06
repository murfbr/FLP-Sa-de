-- Drop existing tables and functions in reverse order of creation to avoid dependency issues
DROP FUNCTION IF EXISTS public.book_appointment(uuid, uuid, uuid);
DROP TABLE IF EXISTS public.financial_records;
DROP TABLE IF EXISTS public.appointments;
DROP TABLE IF EXISTS public.client_packages;
DROP TABLE IF EXISTS public.packages;
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS public.schedules;
DROP TABLE IF EXISTS public.professional_services;
DROP TABLE IF EXISTS public.professionals;
DROP TABLE IF EXISTS public.services;
DROP TABLE IF EXISTS public.profiles;
DROP TYPE IF EXISTS public.user_role;

-- Create user_role enum type
CREATE TYPE public.user_role AS ENUM ('client', 'professional');

-- Create a profiles table to link auth.users with app-specific roles and profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create professionals table
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  specialty TEXT,
  bio TEXT,
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
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
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
CREATE INDEX ON public.financial_records (client_id);
CREATE INDEX ON public.financial_records (professional_id);

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
  v_service_price NUMERIC;
BEGIN
  -- Check if the slot is available and get professional_id
  SELECT professional_id INTO v_professional_id
  FROM public.schedules
  WHERE id = p_schedule_id AND is_booked = FALSE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Horário não disponível ou inexistente.';
  END IF;

  -- Get service price
  SELECT price INTO v_service_price
  FROM public.services
  WHERE id = p_service_id;

  -- Mark the schedule as booked
  UPDATE public.schedules
  SET is_booked = TRUE
  WHERE id = p_schedule_id;

  -- Create the appointment
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id)
  RETURNING id INTO v_appointment_id;

  -- Create a financial record for the appointment
  INSERT INTO public.financial_records (client_id, professional_id, appointment_id, amount, description, payment_method)
  VALUES (p_client_id, v_professional_id, v_appointment_id, v_service_price, 'Pagamento por agendamento de serviço', 'Pendente');

  RETURN v_appointment_id;
END;
$$;

-- SEED DATA --

-- Services (10 entries with corrected UUIDs)
INSERT INTO public.services (id, name, description, duration_minutes, price) VALUES
('f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a', 'Fisioterapia Ortopédica', 'Sessões de fisioterapia para reabilitação de lesões musculoesqueléticas e pós-operatório.', 50, 150.00),
('a2c4e6b8-1d2c-3b4a-5e6f-7a8b9c0d1e2f', 'Pilates Clínico', 'Aulas de Pilates com foco terapêutico para fortalecimento, flexibilidade e consciência corporal.', 60, 120.00),
('b3d5f7c9-2e3d-4c5b-6f7a-8b9c0d1e2f3a', 'Sessão de Recovery', 'Sessões de recuperação muscular com botas de compressão, massagem e outros recursos.', 45, 180.00),
('4e6a8b0f-25c6-4e8f-9b0c-1d2e3f4a5b6c', 'Fisioterapia Esportiva', 'Tratamento e prevenção de lesões relacionadas à prática de esportes.', 60, 170.00),
('5f7b9c1a-36d7-4f9a-0c1d-2e3f4a5b6c7d', 'RPG (Reeducação Postural Global)', 'Técnica para corrigir problemas de postura através de alongamentos globais.', 50, 160.00),
('6a8c0d2b-47e8-40ab-1d2e-3f4a5b6c7d8e', 'Acupuntura', 'Técnica milenar chinesa para alívio de dores e tratamento de diversas condições.', 45, 130.00),
('7b9d1e3c-58f9-41bc-2e3f-4a5b6c7d8e9f', 'Ventosaterapia', 'Terapia com ventosas para alívio de dores musculares e melhora da circulação.', 30, 90.00),
('8c0e2f4d-690a-42cd-3f4a-5b6c7d8e9f0a', 'Liberação Miofascial', 'Técnica de massagem que aplica pressão em pontos específicos do corpo para relaxar a musculatura.', 40, 110.00),
('9d1f3a5e-7a1b-43de-4a5b-6c7d8e9f0a1b', 'Avaliação Fisioterapêutica', 'Consulta inicial para diagnóstico e plano de tratamento.', 60, 200.00),
('0e2a4b6f-8b2c-44ef-5b6c-7d8e9f0a1b2c', 'Drenagem Linfática', 'Massagem para reduzir o inchaço e eliminar toxinas do corpo.', 50, 140.00);

-- Professionals (10 entries with corrected UUIDs)
INSERT INTO public.professionals (id, user_id, name, specialty, bio, avatar_url) VALUES
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', null, 'Dr. Lucas Mendes', 'Fisioterapeuta Ortopédico', 'Especialista em reabilitação de joelho e ombro, com mais de 10 anos de experiência.', 'https://img.usecurling.com/ppl/medium?gender=male&seed=1'),
('d5f7a9e1-4b5c-6d7e-8f9b-0c1d2e3f4a5b', null, 'Dra. Ana Clara', 'Fisioterapeuta Esportiva', 'Focada em atletas de alto rendimento, com especialização em terapia manual.', 'https://img.usecurling.com/ppl/medium?gender=female&seed=2'),
('e6a8b0f2-5c6d-7e8f-9b0c-1d2e3f4a5b6c', null, 'Prof. Sofia Lima', 'Instrutora de Pilates', 'Instrutora certificada com paixão por ajudar pessoas a encontrarem o equilíbrio corporal.', 'https://img.usecurling.com/ppl/medium?gender=female&seed=3'),
('a1b2c3d4-5e6f-4a8b-9c0d-e1f2b3c4d5e6', null, 'Dr. Ricardo Alves', 'Especialista em RPG', 'Vasta experiência em correção postural e tratamento de dores crônicas na coluna.', 'https://img.usecurling.com/ppl/medium?gender=male&seed=4'),
('b2c3d4e5-6f7a-4b9c-0d1e-f2b3c4d5e6a7', null, 'Dra. Beatriz Santos', 'Acupunturista', 'Formada em Medicina Tradicional Chinesa, utiliza a acupuntura para promover o bem-estar.', 'https://img.usecurling.com/ppl/medium?gender=female&seed=5'),
('c3d4e5f6-7a8b-4c0d-1e2f-b3c4d5e6a7b8', null, 'Dr. Fernando Costa', 'Fisioterapeuta', 'Especialista em terapias manuais como liberação miofascial e ventosaterapia.', 'https://img.usecurling.com/ppl/medium?gender=male&seed=6'),
('d4e5f6a7-8b9c-4d1e-2f3b-c4d5e6a7b8c9', null, 'Dra. Júlia Martins', 'Fisioterapeuta Pélvica', 'Atua na saúde da mulher, com foco em gestantes e pós-parto.', 'https://img.usecurling.com/ppl/medium?gender=female&seed=7'),
('e5f6a7b8-9c0d-4e2f-3b4c-d5e6a7b8c9d0', null, 'Dr. Marcos Oliveira', 'Fisioterapeuta Neurológico', 'Experiência com pacientes com AVC, Parkinson e outras condições neurológicas.', 'https://img.usecurling.com/ppl/medium?gender=male&seed=8'),
('f6a7b8c9-0d1e-4f3b-4c5d-e6a7b8c9d0e1', null, 'Dra. Patrícia Rocha', 'Especialista em Drenagem', 'Fisioterapeuta dermatofuncional com foco em pós-operatório e estética.', 'https://img.usecurling.com/ppl/medium?gender=female&seed=9'),
('a7b8c9d0-1e2f-4b4c-5d6e-a7b8c9d0e1f2', null, 'Prof. Tiago Nunes', 'Instrutor de Pilates', 'Instrutor com abordagem contemporânea do Pilates, focado em condicionamento físico.', 'https://img.usecurling.com/ppl/medium?gender=male&seed=10');

-- Link professionals to services (with corrected UUIDs)
INSERT INTO public.professional_services (professional_id, service_id) VALUES
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 'f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a'), -- Dr. Lucas -> Fisioterapia Ortopédica
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 'b3d5f7c9-2e3d-4c5b-6f7a-8b9c0d1e2f3a'), -- Dr. Lucas -> Recovery
('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', '9d1f3a5e-7a1b-43de-4a5b-6c7d8e9f0a1b'), -- Dr. Lucas -> Avaliação
('d5f7a9e1-4b5c-6d7e-8f9b-0c1d2e3f4a5b', '4e6a8b0f-25c6-4e8f-9b0c-1d2e3f4a5b6c'), -- Dra. Ana -> Fisioterapia Esportiva
('d5f7a9e1-4b5c-6d7e-8f9b-0c1d2e3f4a5b', '8c0e2f4d-690a-42cd-3f4a-5b6c7d8e9f0a'), -- Dra. Ana -> Liberação Miofascial
('e6a8b0f2-5c6d-7e8f-9b0c-1d2e3f4a5b6c', 'a2c4e6b8-1d2c-3b4a-5e6f-7a8b9c0d1e2f'), -- Prof. Sofia -> Pilates Clínico
('a1b2c3d4-5e6f-4a8b-9c0d-e1f2b3c4d5e6', '5f7b9c1a-36d7-4f9a-0c1d-2e3f4a5b6c7d'), -- Dr. Ricardo -> RPG
('b2c3d4e5-6f7a-4b9c-0d1e-f2b3c4d5e6a7', '6a8c0d2b-47e8-40ab-1d2e-3f4a5b6c7d8e'), -- Dra. Beatriz -> Acupuntura
('c3d4e5f6-7a8b-4c0d-1e2f-b3c4d5e6a7b8', '7b9d1e3c-58f9-41bc-2e3f-4a5b6c7d8e9f'), -- Dr. Fernando -> Ventosaterapia
('c3d4e5f6-7a8b-4c0d-1e2f-b3c4d5e6a7b8', '8c0e2f4d-690a-42cd-3f4a-5b6c7d8e9f0a'), -- Dr. Fernando -> Liberação Miofascial
('f6a7b8c9-0d1e-4f3b-4c5d-e6a7b8c9d0e1', '0e2a4b6f-8b2c-44ef-5b6c-7d8e9f0a1b2c'), -- Dra. Patrícia -> Drenagem Linfática
('a7b8c9d0-1e2f-4b4c-5d6e-a7b8c9d0e1f2', 'a2c4e6b8-1d2c-3b4a-5e6f-7a8b9c0d1e2f'); -- Prof. Tiago -> Pilates Clínico

-- Clients (10 entries with corrected UUIDs)
INSERT INTO public.clients (id, user_id, name, email, phone) VALUES
('8a3c6d2e-4b5f-4c6d-8e9f-0a1b2c3d4e5f', null, 'Carlos Pereira', 'carlos.p@example.com', '11987654321'),
('b94d7e3f-5c6a-4d7e-9f0a-1b2c3d4e5f6a', null, 'Mariana Costa', 'mariana.c@example.com', '21912345678'),
('c1d2e3f4-6a7b-5c8d-9e0f-1a2b3c4d5e6f', null, 'João Silva', 'joao.silva@example.com', '31998877665'),
('d2e3f4a5-7b8c-4d9e-8f1a-2b3c4d5e6f7a', null, 'Ana Souza', 'ana.souza@example.com', '41988776655'),
('e3f4a5b6-8c9d-4e0f-9a2b-3c4d5e6f7a8b', null, 'Pedro Almeida', 'pedro.a@example.com', '51977665544'),
('f4a5b6c7-9d0e-4f1a-0b3c-4d5e6f7a8b9c', null, 'Larissa Ferreira', 'larissa.f@example.com', '61966554433'),
('a5b6c7d8-0e1f-4a2b-1c4d-5e6f7a8b9c0d', null, 'Bruno Gomes', 'bruno.g@example.com', '71955443322'),
('b6c7d8e9-1f2a-4b3c-2d5e-6f7a8b9c0d1e', null, 'Camila Dias', 'camila.d@example.com', '81944332211'),
('c7d8e9f0-2a3b-4c4d-3e6f-7a8b9c0d1e2f', null, 'Rafael Lima', 'rafael.l@example.com', '91933221100'),
('d8e9f0a1-3b4c-4d5e-4f7a-8b9c0d1e2f3a', null, 'Fernanda Martins', 'fernanda.m@example.com', '11922110099');

-- Schedules (generating a lot of slots for the next 7 days for multiple professionals)
INSERT INTO public.schedules (professional_id, start_time, end_time)
SELECT
  p.id,
  (CURRENT_DATE + d.day_offset * interval '1 day' + h.hour * interval '1 hour'),
  (CURRENT_DATE + d.day_offset * interval '1 day' + (h.hour + 1) * interval '1 hour')
FROM
  public.professionals p,
  generate_series(1, 7) AS d(day_offset),
  generate_series(8, 17) AS h(hour)
WHERE
  p.id IN ('c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 'd5f7a9e1-4b5c-6d7e-8f9b-0c1d2e3f4a5b', 'e6a8b0f2-5c6d-7e8f-9b0c-1d2e3f4a5b6c')
  AND h.hour NOT IN (12, 13); -- Lunch break

-- Packages (10 entries with corrected UUIDs)
INSERT INTO public.packages (id, name, description, service_id, session_count, price) VALUES
('1a2b3c4d-5e6f-7a8b-9c0d-e1f2b3c4d5e6', 'Pacote Fisioterapia Essencial', '5 sessões de Fisioterapia Ortopédica com desconto.', 'f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a', 5, 675.00),
('2b3c4d5e-6f7a-8b9c-0d1e-f2b3c4d5e6a7', 'Pacote Fisioterapia Completo', '10 sessões de Fisioterapia Ortopédica para um tratamento contínuo.', 'f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a', 10, 1300.00),
('3c4d5e6f-7a8b-9c0d-1e2f-b3c4d5e6a7b8', 'Pacote Pilates Mensal', '8 aulas de Pilates Clínico para fazer 2x por semana.', 'a2c4e6b8-1d2c-3b4a-5e6f-7a8b9c0d1e2f', 8, 880.00),
('4d5e6f7a-8b9c-0d1e-2f3b-c4d5e6a7b8c9', 'Pacote Pilates Trimestral', '24 aulas de Pilates Clínico com o melhor custo-benefício.', 'a2c4e6b8-1d2c-3b4a-5e6f-7a8b9c0d1e2f', 24, 2400.00),
('5e6f7a8b-9c0d-1e2f-3b4c-d5e6a7b8c9d0', 'Pacote Atleta Recovery', '4 sessões de Recovery para otimizar sua recuperação.', 'b3d5f7c9-2e3d-4c5b-6f7a-8b9c0d1e2f3a', 4, 650.00),
('6f7a8b9c-0d1e-2f3b-4c5d-e6a7b8c9d0e1', 'Pacote Postura Ideal', '10 sessões de RPG para uma reeducação postural completa.', '5f7b9c1a-36d7-4f9a-0c1d-2e3f4a5b6c7d', 10, 1450.00),
('7a8b9c0d-1e2f-3b4c-5d6e-a7b8c9d0e1f2', 'Pacote Alívio Imediato', '4 sessões combinando Acupuntura e Ventosaterapia.', '6a8c0d2b-47e8-40ab-1d2e-3f4a5b6c7d8e', 4, 480.00),
('8b9c0d1e-2f3b-4c5d-6e7a-b8c9d0e1f2a3', 'Pacote Relaxamento Profundo', '5 sessões de Liberação Miofascial.', '8c0e2f4d-690a-42cd-3f4a-5b6c7d8e9f0a', 5, 500.00),
('9c0d1e2f-3b4c-5d6e-7a8b-c9d0e1f2a3b4', 'Pacote Pós-Operatório', '10 sessões de Drenagem Linfática para acelerar sua recuperação.', '0e2a4b6f-8b2c-44ef-5b6c-7d8e9f0a1b2c', 10, 1250.00),
('0d1e2f3b-4c5d-6e7a-8b9c-d0e1f2a3b4c5', 'Pacote Bem-Estar Total', 'Inclui 2 Fisioterapias, 2 Pilates e 1 Recovery.', null, 5, 750.00);
