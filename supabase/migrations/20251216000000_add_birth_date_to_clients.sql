ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birth_date DATE;

CREATE OR REPLACE FUNCTION get_clients_with_birthday_this_week(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
  id UUID,
  name TEXT,
  birth_date DATE,
  email TEXT,
  phone TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF to_char(p_start_date, 'MM-DD') > to_char(p_end_date, 'MM-DD') THEN
        -- Period wraps around the year (e.g. Dec to Jan)
        RETURN QUERY
        SELECT c.id, c.name, c.birth_date, c.email, c.phone
        FROM clients c
        WHERE c.birth_date IS NOT NULL
        AND (
            to_char(c.birth_date, 'MM-DD') >= to_char(p_start_date, 'MM-DD')
            OR
            to_char(c.birth_date, 'MM-DD') <= to_char(p_end_date, 'MM-DD')
        )
        ORDER BY to_char(c.birth_date, 'MM-DD');
    ELSE
        -- Standard period within the same year
        RETURN QUERY
        SELECT c.id, c.name, c.birth_date, c.email, c.phone
        FROM clients c
        WHERE c.birth_date IS NOT NULL
        AND to_char(c.birth_date, 'MM-DD') BETWEEN to_char(p_start_date, 'MM-DD') AND to_char(p_end_date, 'MM-DD')
        ORDER BY to_char(c.birth_date, 'MM-DD');
    END IF;
END;
$$;
