-- ============================================
-- POLÍTICAS RLS PARA BARBERÍA APP
-- Ejecutar en Supabase → SQL Editor
-- ============================================

-- SERVICES: lectura pública
CREATE POLICY "Allow public read services"
ON services FOR SELECT TO anon
USING (true);

-- BARBERS: lectura pública
CREATE POLICY "Allow public read barbers"
ON barbers FOR SELECT TO anon
USING (true);

-- CLIENTS: lectura e inserción anónima
CREATE POLICY "Allow public read clients"
ON clients FOR SELECT TO anon
USING (true);

CREATE POLICY "Allow anonymous client creation"
ON clients FOR INSERT TO anon
WITH CHECK (true);

-- APPOINTMENTS: lectura e inserción anónima
CREATE POLICY "Allow public read appointments"
ON appointments FOR SELECT TO anon
USING (true);

CREATE POLICY "Allow anonymous appointment creation"
ON appointments FOR INSERT TO anon
WITH CHECK (true);

-- BLOCKED_SLOTS: lectura pública
CREATE POLICY "Allow public read blocked_slots"
ON blocked_slots FOR SELECT TO anon
USING (true);
