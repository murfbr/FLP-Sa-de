-- Migration to update KPI functions with advanced filtering capabilities
-- Supports filtering by Professional, Service, and Partnership
-- Adds new metrics: Ticket Médio and Retention Rate

-- Drop existing functions to recreate them with new signatures
DROP FUNCTION IF EXISTS get_kpi_metrics(DATE, DATE);
DROP FUNCTION IF EXISTS get_service_performance(DATE, DATE);
DROP FUNCTION IF EXISTS get_partnership_performance(DATE, DATE);
DROP FUNCTION IF EXISTS get_annual_comparative();

-- Updated get_kpi_metrics with filters and new metrics
CREATE OR REPLACE FUNCTION get_kpi_metrics(
  start_date DATE,
  end_date DATE,
  p_professional_id UUID DEFAULT NULL,
  p_service_id UUID DEFAULT NULL,
  p_partnership_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_appointments BIGINT,
    completed_appointments BIGINT,
    cancelled_appointments BIGINT,
    cancellation_rate NUMERIC,
    total_revenue NUMERIC,
    average_ticket NUMERIC,
    retention_rate NUMERIC,
    prev_total_appointments BIGINT,
    prev_completed_appointments BIGINT,
    prev_cancelled_appointments BIGINT,
    prev_cancellation_rate NUMERIC,
    prev_total_revenue NUMERIC,
    prev_average_ticket NUMERIC,
    prev_retention_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    period_duration INT;
    prev_start_date DATE;
    prev_end_date DATE;
BEGIN
    period_duration := end_date - start_date;
    prev_start_date := start_date - (period_duration + 1) * interval '1 day';
    prev_end_date := end_date - (period_duration + 1) * interval '1 day';

    RETURN QUERY
    WITH current_period_data AS (
        SELECT
            a.id,
            a.status,
            a.client_id,
            COALESCE(fr.amount, 0) as amount
        FROM public.appointments a
        JOIN public.schedules sch ON a.schedule_id = sch.id
        LEFT JOIN public.financial_records fr ON a.id = fr.appointment_id AND a.status = 'completed'
        LEFT JOIN public.clients c ON a.client_id = c.id
        WHERE sch.start_time::date BETWEEN start_date AND end_date
        AND (p_professional_id IS NULL OR a.professional_id = p_professional_id)
        AND (p_service_id IS NULL OR a.service_id = p_service_id)
        AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
    ),
    current_aggregates AS (
        SELECT
            COUNT(*) AS total_appointments,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed_appointments,
            COUNT(*) FILTER (WHERE status IN ('cancelled', 'no_show')) AS cancelled_appointments,
            SUM(amount) AS total_revenue,
            COUNT(DISTINCT client_id) AS total_clients,
            COUNT(DISTINCT client_id) FILTER (
                WHERE client_id IN (
                    SELECT sub_a.client_id
                    FROM public.appointments sub_a
                    WHERE sub_a.status = 'completed'
                    GROUP BY sub_a.client_id
                    HAVING COUNT(*) > 1
                )
            ) as retained_clients
        FROM current_period_data
    ),
    previous_period_data AS (
        SELECT
            a.id,
            a.status,
            a.client_id,
            COALESCE(fr.amount, 0) as amount
        FROM public.appointments a
        JOIN public.schedules sch ON a.schedule_id = sch.id
        LEFT JOIN public.financial_records fr ON a.id = fr.appointment_id AND a.status = 'completed'
        LEFT JOIN public.clients c ON a.client_id = c.id
        WHERE sch.start_time::date BETWEEN prev_start_date AND prev_end_date
        AND (p_professional_id IS NULL OR a.professional_id = p_professional_id)
        AND (p_service_id IS NULL OR a.service_id = p_service_id)
        AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
    ),
    previous_aggregates AS (
        SELECT
            COUNT(*) AS prev_total_appointments,
            COUNT(*) FILTER (WHERE status = 'completed') AS prev_completed_appointments,
            COUNT(*) FILTER (WHERE status IN ('cancelled', 'no_show')) AS prev_cancelled_appointments,
            SUM(amount) AS prev_total_revenue,
            COUNT(DISTINCT client_id) AS prev_total_clients,
            COUNT(DISTINCT client_id) FILTER (
                WHERE client_id IN (
                    SELECT sub_a.client_id
                    FROM public.appointments sub_a
                    WHERE sub_a.status = 'completed'
                    GROUP BY sub_a.client_id
                    HAVING COUNT(*) > 1
                )
            ) as prev_retained_clients
        FROM previous_period_data
    )
    SELECT
        ca.total_appointments,
        ca.completed_appointments,
        ca.cancelled_appointments,
        CASE
            WHEN (ca.completed_appointments + ca.cancelled_appointments) > 0
            THEN (ca.cancelled_appointments::NUMERIC * 100.0 / (ca.completed_appointments + ca.cancelled_appointments))
            ELSE 0
        END AS cancellation_rate,
        ca.total_revenue,
        CASE
             WHEN ca.completed_appointments > 0 THEN ca.total_revenue / ca.completed_appointments
             ELSE 0
        END AS average_ticket,
        CASE
             WHEN ca.total_clients > 0 THEN (ca.retained_clients::NUMERIC * 100.0 / ca.total_clients)
             ELSE 0
        END AS retention_rate,

        pa.prev_total_appointments,
        pa.prev_completed_appointments,
        pa.prev_cancelled_appointments,
        CASE
            WHEN (pa.prev_completed_appointments + pa.prev_cancelled_appointments) > 0
            THEN (pa.prev_cancelled_appointments::NUMERIC * 100.0 / (pa.prev_completed_appointments + pa.prev_cancelled_appointments))
            ELSE 0
        END AS prev_cancellation_rate,
        pa.prev_total_revenue,
        CASE
             WHEN pa.prev_completed_appointments > 0 THEN pa.prev_total_revenue / pa.prev_completed_appointments
             ELSE 0
        END AS prev_average_ticket,
        CASE
             WHEN pa.prev_total_clients > 0 THEN (pa.prev_retained_clients::NUMERIC * 100.0 / pa.prev_total_clients)
             ELSE 0
        END AS prev_retention_rate
    FROM current_aggregates ca, previous_aggregates pa;
END;
$$;

-- Updated get_service_performance with filters
CREATE OR REPLACE FUNCTION get_service_performance(
  start_date DATE,
  end_date DATE,
  p_professional_id UUID DEFAULT NULL,
  p_service_id UUID DEFAULT NULL,
  p_partnership_id UUID DEFAULT NULL
)
RETURNS TABLE(service_name TEXT, count BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.name AS service_name,
        COUNT(a.id) AS count
    FROM public.appointments a
    JOIN public.services s ON a.service_id = s.id
    JOIN public.schedules sch ON a.schedule_id = sch.id
    LEFT JOIN public.clients c ON a.client_id = c.id
    WHERE a.status = 'completed'
      AND sch.start_time::date >= start_date
      AND sch.start_time::date <= end_date
      AND (p_professional_id IS NULL OR a.professional_id = p_professional_id)
      AND (p_service_id IS NULL OR a.service_id = p_service_id)
      AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
    GROUP BY s.name
    ORDER BY count DESC;
END;
$$;

-- Updated get_partnership_performance with filters
CREATE OR REPLACE FUNCTION get_partnership_performance(
  start_date DATE,
  end_date DATE,
  p_professional_id UUID DEFAULT NULL,
  p_service_id UUID DEFAULT NULL,
  p_partnership_id UUID DEFAULT NULL
)
RETURNS TABLE(partnership_name TEXT, client_count BIGINT, total_revenue NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.name AS partnership_name,
        COUNT(DISTINCT a.client_id) AS client_count,
        COALESCE(SUM(fr.amount), 0) AS total_revenue
    FROM public.appointments a
    JOIN public.clients c ON a.client_id = c.id
    JOIN public.partnerships p ON c.partnership_id = p.id
    JOIN public.schedules sch ON a.schedule_id = sch.id
    LEFT JOIN public.financial_records fr ON a.id = fr.appointment_id
    WHERE a.status = 'completed'
      AND sch.start_time::date >= start_date
      AND sch.start_time::date <= end_date
      AND (p_professional_id IS NULL OR a.professional_id = p_professional_id)
      AND (p_service_id IS NULL OR a.service_id = p_service_id)
      AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
    GROUP BY p.name
    ORDER BY total_revenue DESC;
END;
$$;

-- Updated get_annual_comparative with filters
CREATE OR REPLACE FUNCTION get_annual_comparative(
  p_professional_id UUID DEFAULT NULL,
  p_service_id UUID DEFAULT NULL,
  p_partnership_id UUID DEFAULT NULL
)
RETURNS TABLE(month TEXT, total_revenue NUMERIC, total_appointments BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH months AS (
        SELECT to_char(date_trunc('month', generate_series(
            date_trunc('month', NOW() - interval '11 months'),
            date_trunc('month', NOW()),
            '1 month'
        )), 'YYYY-MM') AS month
    ),
    filtered_appointments AS (
      SELECT a.id, sch.start_time
      FROM public.appointments a
      JOIN public.schedules sch ON a.schedule_id = sch.id
      LEFT JOIN public.clients c ON a.client_id = c.id
      WHERE a.status = 'completed'
      AND (p_professional_id IS NULL OR a.professional_id = p_professional_id)
      AND (p_service_id IS NULL OR a.service_id = p_service_id)
      AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
    )
    SELECT
        m.month,
        COALESCE(SUM(fr.amount), 0) AS total_revenue,
        COUNT(DISTINCT a.id) AS total_appointments
    FROM months m
    LEFT JOIN filtered_appointments a ON to_char(date_trunc('month', a.start_time), 'YYYY-MM') = m.month
    LEFT JOIN public.financial_records fr ON a.id = fr.appointment_id
    GROUP BY m.month
    ORDER BY m.month;
END;
$$;
