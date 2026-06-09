-- Verificar configuración de Realtime

-- 1. Ver publicaciones existentes
SELECT * FROM pg_publication;

-- 2. Ver tablas en la publicación supabase_realtime
SELECT p.pubname, pt.schemaname, pt.tablename
FROM pg_publication p
JOIN pg_publication_tables pt ON p.pubname = pt.pubname
WHERE p.pubname = 'supabase_realtime';

-- 3. Si no existe la publicación, crearla
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
  END IF;
END $$;

-- 4. Agregar appointments a la publicación (si no está)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  END IF;
END $$;

-- 5. Verificar que appointments tiene replica identity
SELECT relname, relreplident 
FROM pg_class 
WHERE relname = 'appointments';

-- 6. Si no tiene replica identity full, configurarlo
ALTER TABLE appointments REPLICA IDENTITY FULL;

-- 7. Verificar configuración final
SELECT p.pubname, pt.schemaname, pt.tablename
FROM pg_publication p
JOIN pg_publication_tables pt ON p.pubname = pt.pubname
WHERE p.pubname = 'supabase_realtime';
