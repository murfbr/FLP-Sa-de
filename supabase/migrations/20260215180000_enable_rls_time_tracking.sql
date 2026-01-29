-- Enable RLS on time_tracking table
ALTER TABLE time_tracking ENABLE ROW LEVEL SECURITY;

-- 1. Policy for Admins: Full access (SELECT, INSERT, UPDATE, DELETE)
-- Admins can do anything on time_tracking table
CREATE POLICY "Admins have full access to time_tracking"
ON time_tracking
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 2. Policy for Professionals: SELECT own records
-- Professionals can only view records where professional_id matches their linked professional record
CREATE POLICY "Professionals can view their own time_tracking"
ON time_tracking
FOR SELECT
TO authenticated
USING (
  professional_id IN (
    SELECT id FROM professionals
    WHERE user_id = auth.uid()
  )
);

-- 3. Policy for Professionals: INSERT own records
-- Professionals can only insert records for themselves
CREATE POLICY "Professionals can insert their own time_tracking"
ON time_tracking
FOR INSERT
TO authenticated
WITH CHECK (
  professional_id IN (
    SELECT id FROM professionals
    WHERE user_id = auth.uid()
  )
);

-- 4. Policy for Professionals: UPDATE own records
-- Professionals can only update records that belong to them
CREATE POLICY "Professionals can update their own time_tracking"
ON time_tracking
FOR UPDATE
TO authenticated
USING (
  professional_id IN (
    SELECT id FROM professionals
    WHERE user_id = auth.uid()
  )
);
