-- 1. Insert missing services
-- Using ON CONFLICT to prevent errors on re-runs and to update existing entries if needed.
INSERT INTO public.services (id, name, description, duration_minutes, price, value_type) VALUES
('f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a', 'Fisioterapia', 'Sessões de fisioterapia para reabilitação de lesões musculoesqueléticas e pós-operatório.', 50, 150.00, 'session')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.services (id, name, description, duration_minutes, price, value_type) VALUES
('a2c4e6b8-1d2c-3b4a-5e6f-7a8b9c0d1e2f', 'Pilates', 'Aulas de Pilates com foco terapêutico para fortalecimento, flexibilidade e consciência corporal.', 60, 120.00, 'session')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.services (id, name, description, duration_minutes, price, value_type) VALUES
('b3d5f7c9-2e3d-4c5b-6f7a-8b9c0d1e2f3a', 'Recovery', 'Sessões de recuperação muscular com botas de compressão, massagem e outros recursos.', 45, 180.00, 'session')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.services (id, name, description, duration_minutes, price, value_type) VALUES
('11a11a11-1111-1111-1111-111111111111', 'Preventivo', 'Programa de prevenção de lesões focado em atletas e praticantes de atividade física.', 60, 160.00, 'session'),
('22b22b22-2222-2222-2222-222222222222', 'Avaliação do Esporte', 'Avaliação biomecânica e funcional para atletas.', 90, 250.00, 'session'),
('9d1f3a5e-7a1b-43de-4a5b-6c7d8e9f0a1b', 'Avaliação Fisioterapia', 'Consulta inicial para diagnóstico e plano de tratamento.', 60, 200.00, 'session')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;


-- 2. Insert new professionals
INSERT INTO public.professionals (id, name, specialty, bio) VALUES
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Estag. Karol', 'Estagiária de Fisioterapia', 'Estudante dedicada com foco em Pilates e reabilitação.'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Estag. David', 'Estagiário de Fisioterapia', 'Estudante com interesse em fisioterapia esportiva e recuperação muscular.'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Estag. Mayara', 'Estagiária de Fisioterapia', 'Estudante focada em atendimento clínico e terapia manual.'),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Fisio Fabio', 'Fisioterapeuta', 'Fisioterapeuta experiente com especialização em avaliações esportivas e tratamento de lesões complexas.');

-- 3. Link services to professionals
-- Estag. Karol
INSERT INTO public.professional_services (professional_id, service_id) VALUES
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'a2c4e6b8-1d2c-3b4a-5e6f-7a8b9c0d1e2f'), -- Pilates
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '11a11a11-1111-1111-1111-111111111111'), -- Preventivo
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b3d5f7c9-2e3d-4c5b-6f7a-8b9c0d1e2f3a'), -- Recovery
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a'); -- Fisioterapia

-- Estag. David
INSERT INTO public.professional_services (professional_id, service_id) VALUES
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'a2c4e6b8-1d2c-3b4a-5e6f-7a8b9c0d1e2f'), -- Pilates
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '11a11a11-1111-1111-1111-111111111111'), -- Preventivo
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'b3d5f7c9-2e3d-4c5b-6f7a-8b9c0d1e2f3a'), -- Recovery
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a'); -- Fisioterapia

-- Estag. Mayara
INSERT INTO public.professional_services (professional_id, service_id) VALUES
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a'), -- Fisioterapia
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'b3d5f7c9-2e3d-4c5b-6f7a-8b9c0d1e2f3a'), -- Recovery
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '11a11a11-1111-1111-1111-111111111111'), -- Preventivo
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'a2c4e6b8-1d2c-3b4a-5e6f-7a8b9c0d1e2f'); -- Pilates

-- Fisio Fabio
INSERT INTO public.professional_services (professional_id, service_id) VALUES
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'f1b5c6a8-3e4d-4b1a-8c9a-0b1c2d3e4f5a'), -- Fisioterapia
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'b3d5f7c9-2e3d-4c5b-6f7a-8b9c0d1e2f3a'), -- Recovery
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '22b22b22-2222-2222-2222-222222222222'), -- Avaliação do Esporte
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '9d1f3a5e-7a1b-43de-4a5b-6c7d8e9f0a1b'), -- Avaliação Fisioterapia
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '11a11a11-1111-1111-1111-111111111111'); -- Preventivo

-- 4. Set recurring availability
-- Estag. Karol: Monday and Wednesday, from 14h30 to 21h
INSERT INTO public.professional_recurring_availability (professional_id, day_of_week, start_time, end_time) VALUES
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 1, '14:30:00', '21:00:00'), -- Monday
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 3, '14:30:00', '21:00:00'); -- Wednesday

-- Estag. David: Monday and Wednesday, from 18h to 21h, and Friday, from 7h to 20h
INSERT INTO public.professional_recurring_availability (professional_id, day_of_week, start_time, end_time) VALUES
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 1, '18:00:00', '21:00:00'), -- Monday
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 3, '18:00:00', '21:00:00'), -- Wednesday
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 5, '07:00:00', '20:00:00'); -- Friday

-- Estag. Mayara: Mon, Tue, Wed, Fri from 7h to 13h30, and Thu from 7h to 21h
INSERT INTO public.professional_recurring_availability (professional_id, day_of_week, start_time, end_time) VALUES
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 1, '07:00:00', '13:30:00'), -- Monday
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 2, '07:00:00', '13:30:00'), -- Tuesday
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 3, '07:00:00', '13:30:00'), -- Wednesday
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 4, '07:00:00', '21:00:00'), -- Thursday
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 5, '07:00:00', '13:30:00'); -- Friday

-- Fisio Fabio: Mon from 12h30 to 21h, and Wed, Fri from 7h to 21h
INSERT INTO public.professional_recurring_availability (professional_id, day_of_week, start_time, end_time) VALUES
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 1, '12:30:00', '21:00:00'), -- Monday
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 3, '07:00:00', '21:00:00'), -- Wednesday
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 5, '07:00:00', '21:00:00'); -- Friday
