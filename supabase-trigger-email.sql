-- ============================================
-- CONFIGURACIÓN DE NOTIFICACIONES POR EMAIL
-- Ejecutar en Supabase → SQL Editor
-- ============================================

-- PASO 1: Verificar si barbers tiene columna email
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'barbers' 
ORDER BY ordinal_position;

-- PASO 2: Si no tiene email, agregarla (descomentar si es necesario)
-- ALTER TABLE barbers ADD COLUMN email TEXT;

-- PASO 3: Habilitar la extensión pg_net (necesaria para hacer HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- PASO 4: Crear función que invoca la Edge Function
CREATE OR REPLACE FUNCTION notify_barber_on_appointment()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Obtener las variables de entorno de Supabase
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.supabase_service_role_key', true);
  
  -- Si no están configuradas, usar valores por defecto
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://mejlnsgzhufnngxgzqrs.supabase.co';
  END IF;
  
  -- Invocar la Edge Function
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/notify-barber',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('record', NEW)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Crear el trigger
DROP TRIGGER IF EXISTS on_appointment_created ON appointments;
CREATE TRIGGER on_appointment_created
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_barber_on_appointment();

-- PASO 6: Verificar que todo esté configurado
SELECT 'Trigger creado exitosamente' as status;
