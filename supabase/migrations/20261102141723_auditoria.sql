-- ============================================
-- Migración: auditoria
-- Tablas: appointments_audit + función y trigger
-- Depende de: citas
-- ============================================
 
-- 1. Tabla de auditoría
CREATE TABLE public.appointments_audit (
    id         BIGINT      GENERATED ALWAYS AS IDENTITY,
    apt_id     INTEGER     NOT NULL,
    operation  VARCHAR(10) NOT NULL,
    old_data   JSONB,
    new_data   JSONB,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by TEXT        NOT NULL DEFAULT current_user,
 
    CONSTRAINT pk_appointments_audit PRIMARY KEY (id),
    CONSTRAINT ck_appointments_audit_operation
        CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);
 
CREATE INDEX ix_appointments_audit_apt_id ON public.appointments_audit (apt_id);
 
-- 2. Función que guarda cada cambio
CREATE OR REPLACE FUNCTION public.fn_audit_appointments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.appointments_audit (apt_id, operation, new_data)
        VALUES (NEW.id, TG_OP, to_jsonb(NEW));
        RETURN NEW;
 
    ELSIF TG_OP = 'UPDATE' THEN
        -- Si el UPDATE no cambió nada, no se registra
        IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
            INSERT INTO public.appointments_audit (apt_id, operation, old_data, new_data)
            VALUES (NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
        END IF;
        RETURN NEW;
 
    ELSE -- DELETE
        INSERT INTO public.appointments_audit (apt_id, operation, old_data)
        VALUES (OLD.id, TG_OP, to_jsonb(OLD));
        RETURN OLD;
    END IF;
END;
$$;
 
-- 3. Trigger: se dispara después de cada INSERT, UPDATE o DELETE en appointments.
-- También registra las citas borradas por la cascada de medical_orders.
CREATE TRIGGER trg_audit_appointments
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_appointments();