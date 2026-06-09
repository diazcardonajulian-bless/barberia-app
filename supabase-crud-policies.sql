-- ============================================
-- POLÍTICAS RLS PARA CRUD DE BARBEROS Y SERVICIOS
-- Ejecutar en Supabase → SQL Editor
-- ============================================

-- BARBERS: agregar UPDATE y DELETE
CREATE POLICY "barbers_update_public"
ON barbers FOR UPDATE TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "barbers_delete_public"
ON barbers FOR DELETE TO public
USING (true);

CREATE POLICY "barbers_insert_public"
ON barbers FOR INSERT TO public
WITH CHECK (true);

-- SERVICES: agregar UPDATE, DELETE e INSERT
CREATE POLICY "services_update_public"
ON services FOR UPDATE TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "services_delete_public"
ON services FOR DELETE TO public
USING (true);

CREATE POLICY "services_insert_public"
ON services FOR INSERT TO public
WITH CHECK (true);

-- Forzar recarga
NOTIFY pgrst, 'reload schema';
