-- Function to get service performance (how many times each service was completed)
CREATE OR REPLACE FUNCTION get_service_performance(start_date DATE, end_date DATE)
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
    WHERE a.status = 'completed'
      AND sch.start_time::date >= start_date
      AND sch.start_time::date <= end_date
    GROUP BY s.name
    ORDER BY count DESC;
END;
$$;

-- Function to get partnership performance (client count and revenue)
CREATE OR REPLACE FUNCTION get_partnership_performance(start_date DATE, end_date DATE)
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
    GROUP BY p.name
    ORDER BY total_revenue DESC;
END;
$$;

-- Function to get annual comparative data (revenue and appointments per month)
CREATE OR REPLACE FUNCTION get_annual_comparative()
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
    )
    SELECT
        m.month,
        COALESCE(SUM(fr.amount), 0) AS total_revenue,
        COUNT(DISTINCT a.id) AS total_appointments
    FROM months m
    LEFT JOIN public.appointments a ON to_char(date_trunc('month', (SELECT start_time FROM public.schedules WHERE id = a.schedule_id)), 'YYYY-MM') = m.month AND a.status = 'completed'
    LEFT JOIN public.financial_records fr ON a.id = fr.appointment_id
    GROUP BY m.month
    ORDER BY m.month;
END;
$$;

-- Function to get core KPI metrics with previous period comparison
CREATE OR REPLACE FUNCTION get_kpi_metrics(start_date DATE, end_date DATE)
RETURNS TABLE(
    total_appointments BIGINT,
    completed_appointments BIGINT,
    cancelled_appointments BIGINT,
    cancellation_rate NUMERIC,
    total_revenue NUMERIC,
    prev_total_appointments BIGINT,
    prev_completed_appointments BIGINT,
    prev_cancelled_appointments BIGINT,
    prev_cancellation_rate NUMERIC,
    prev_total_revenue NUMERIC
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
    WITH current_period AS (
        SELECT
            COUNT(*) AS total_appointments,
            COUNT(*) FILTER (WHERE a.status = 'completed') AS completed_appointments,
            COUNT(*) FILTER (WHERE a.status IN ('cancelled', 'no_show')) AS cancelled_appointments,
            COALESCE(SUM(fr.amount), 0) AS total_revenue
        FROM public.appointments a
        JOIN public.schedules sch ON a.schedule_id = sch.id
        LEFT JOIN public.financial_records fr ON a.id = fr.appointment_id AND a.status = 'completed'
        WHERE sch.start_time::date BETWEEN start_date AND end_date
    ),
    previous_period AS (
        SELECT
            COUNT(*) AS prev_total_appointments,
            COUNT(*) FILTER (WHERE a.status = 'completed') AS prev_completed_appointments,
            COUNT(*) FILTER (WHERE a.status IN ('cancelled', 'no_show')) AS prev_cancelled_appointments,
            COALESCE(SUM(fr.amount), 0) AS prev_total_revenue
        FROM public.appointments a
        JOIN public.schedules sch ON a.schedule_id = sch.id
        LEFT JOIN public.financial_records fr ON a.id = fr.appointment_id AND a.status = 'completed'
        WHERE sch.start_time::date BETWEEN prev_start_date AND prev_end_date
    )
    SELECT
        cp.total_appointments,
        cp.completed_appointments,
        cp.cancelled_appointments,
        CASE
            WHEN (cp.completed_appointments + cp.cancelled_appointments) > 0
            THEN (cp.cancelled_appointments::NUMERIC * 100 / (cp.completed_appointments + cp.cancelled_appointments))
            ELSE 0
        END AS cancellation_rate,
        cp.total_revenue,
        pp.prev_total_appointments,
        pp.prev_completed_appointments,
        pp.prev_cancelled_appointments,
        CASE
            WHEN (pp.prev_completed_appointments + pp.prev_cancelled_appointments) > 0
            THEN (pp.prev_cancelled_appointments::NUMERIC * 100 / (pp.prev_completed_appointments + pp.prev_cancelled_appointments))
            ELSE 0
        END AS prev_cancellation_rate,
        pp.prev_total_revenue
    FROM current_period cp, previous_period pp;
END;
$$;
