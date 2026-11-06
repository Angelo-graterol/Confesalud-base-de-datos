-- ============================================
-- Migración: reglas_citas
-- Depende de: citas, citas_sin_cruce
-- ============================================
 
-- Un paciente, un hueco
CREATE UNIQUE INDEX uq_appointments_client_slot
    ON public.appointments (cet_id, assignment_date)
    WHERE appointment_status <> 'CANCELADA';
 
-- Hora de llegada solo en citas atendidas
ALTER TABLE public.appointments
    ADD CONSTRAINT ck_appointments_arrival_status
        CHECK (arrival_time IS NULL OR appointment_status = 'ATENDIDA');
 
--  Una orden médica, una cita activa 
CREATE UNIQUE INDEX uq_appointments_medical_order
    ON public.appointments (mor_id)
    WHERE mor_id IS NOT NULL AND appointment_status <> 'CANCELADA';
 
--Lunes (1) a viernes (5)
ALTER TABLE public.appointments
    ADD CONSTRAINT ck_appointments_weekday
        CHECK (EXTRACT(ISODOW FROM assignment_date) BETWEEN 1 AND 5);

-- Solo se revisan al crear la cita o al cambiar médico, paciente, orden o fecha.
-- Así, marcar como ATENDIDA una cita de un médico que después salió a
-- vacaciones no da error.
CREATE OR REPLACE FUNCTION public.fn_validate_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_doctor_status VARCHAR(15);
    v_affiliation   VARCHAR(15);
    v_order         public.medical_orders%ROWTYPE;
    v_cambio        BOOLEAN;
BEGIN
    v_cambio := TG_OP = 'INSERT'
             OR NEW.dtr_id          IS DISTINCT FROM OLD.dtr_id
             OR NEW.cet_id          IS DISTINCT FROM OLD.cet_id
             OR NEW.mor_id          IS DISTINCT FROM OLD.mor_id
             OR NEW.assignment_date IS DISTINCT FROM OLD.assignment_date;
 
    IF NOT v_cambio THEN
        RETURN NEW;
    END IF;
 
    --Médico activo
    SELECT doctor_status INTO v_doctor_status
    FROM public.doctors WHERE id = NEW.dtr_id;
 
    IF v_doctor_status IS DISTINCT FROM 'ACTIVO' THEN
        RAISE EXCEPTION 'El médico % no está activo (estado: %)', NEW.dtr_id, v_doctor_status
            USING ERRCODE = 'check_violation';
    END IF;
 
    --Paciente con afiliación activa
    SELECT affiliation_status INTO v_affiliation
    FROM public.clients WHERE id = NEW.cet_id;
 
    IF v_affiliation IS DISTINCT FROM 'ACTIVO' THEN
        RAISE EXCEPTION 'El paciente % no tiene afiliación activa (estado: %)', NEW.cet_id, v_affiliation
            USING ERRCODE = 'check_violation';
    END IF;
 
    --Orden médica no anulada y vigente el día de la cita
    IF NEW.mor_id IS NOT NULL THEN
        SELECT * INTO v_order FROM public.medical_orders WHERE id = NEW.mor_id;
 
        IF v_order.order_status = 'ANULADA' THEN
            RAISE EXCEPTION 'La orden médica % está anulada', v_order.order_number
                USING ERRCODE = 'check_violation';
        END IF;
 
        IF NEW.assignment_date::date NOT BETWEEN v_order.issue_date AND v_order.expiration_date THEN
            RAISE EXCEPTION 'La orden médica % solo es válida del % al %',
                v_order.order_number, v_order.issue_date, v_order.expiration_date
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
 
    RETURN NEW;
END;
$$;
 
CREATE TRIGGER trg_validate_appointment
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_appointment();
 
--al registrar una cancelación
CREATE OR REPLACE FUNCTION public.fn_cancel_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_status VARCHAR(15);
BEGIN
    SELECT appointment_status INTO v_status
    FROM public.appointments WHERE id = NEW.apt_id;
 
    --Solo se cancelan citas programadas
    -- (CANCELADA también se acepta para poder cargar históricos ya cancelados)
    IF v_status NOT IN ('PROGRAMADA', 'CANCELADA') THEN
        RAISE EXCEPTION 'No se puede cancelar la cita % porque está en estado %', NEW.apt_id, v_status
            USING ERRCODE = 'check_violation';
    END IF;
 
    --La cita queda CANCELADA y su hueco libre
    UPDATE public.appointments
    SET appointment_status = 'CANCELADA'
    WHERE id = NEW.apt_id AND appointment_status <> 'CANCELADA';
 
    RETURN NEW;
END;
$$;
 
CREATE TRIGGER trg_cancel_appointment
BEFORE INSERT ON public.cancellations
FOR EACH ROW
EXECUTE FUNCTION public.fn_cancel_appointment();