-- ============================================
-- POLÍTICAS RLS PARA BARBERÍA APP
-- Ejecutar en Supabase → SQL Editor
-- ============================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Allow public read services" ON services;
DROP POLICY IF EXISTS "Allow public read barbers" ON barbers;
DROP POLICY IF EXISTS "Allow public read clients" ON clients;
DROP POLICY IF EXISTS "Allow anonymous client creation" ON clients;
DROP POLICY IF EXISTS "Allow public read appointments" ON appointments;
DROP POLICY IF EXISTS "Allow anonymous appointment creation" ON appointments;
DROP POLICY IF EXISTS "Allow public read blocked_slots" ON blocked_slots;
DROP POLICY IF EXISTS "Allow public insert clients" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_insert_anon" ON clients;
DROP POLICY IF EXISTS "Allow public insert appointments" ON appointments;
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
DROP POLICY IF EXISTS "clients_allow_insert" ON clients;
DROP POLICY IF EXISTS "appointments_allow_insert" ON appointments;
DROP POLICY IF EXISTS "enable_insert_for_anon_2024" ON clients;
DROP POLICY IF EXISTS "Allow public read" ON barbers;
DROP POLICY IF EXISTS "Allow public read" ON services;
DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "Allow public select clients" ON clients;
DROP POLICY IF EXISTS "appointments_select" ON appointments;
DROP POLICY IF EXISTS "Allow public select appointments" ON appointments;

-- SERVICES: lectura pública
CREATE POLICY "services_select_public"
ON services FOR SELECT TO public
USING (true);

-- BARBERS: lectura pública
CREATE POLICY "barbers_select_public"
ON barbers FOR SELECT TO public
USING (true);

-- CLIENTS: lectura e inserción pública
CREATE POLICY "clients_select_public"
ON clients FOR SELECT TO public
USING (true);

CREATE POLICY "clients_insert_public"
ON clients FOR INSERT TO public
WITH CHECK (true);

-- APPOINTMENTS: lectura, inserción y actualización pública
CREATE POLICY "appointments_select_public"
ON appointments FOR SELECT TO public
USING (true);

CREATE POLICY "appointments_insert_public"
ON appointments FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "appointments_update_public"
ON appointments FOR UPDATE TO public
USING (true)
WITH CHECK (true);

-- BLOCKED_SLOTS: lectura pública
CREATE POLICY "blocked_slots_select_public"
ON blocked_slots FOR SELECT TO public
USING (true);

-- Habilitar RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Forzar recarga de PostgREST
NOTIFY pgrst, 'reload schema';
