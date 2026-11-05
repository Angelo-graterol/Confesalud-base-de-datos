-- ============================================
-- Migración: citas_sin_cruce
-- Reglas de negocio:
--   * La agenda está dividida en huecos fijos de 20 minutos, de corrido,
--     desde las 7:00 a.m. hasta las 4:00 p.m.:
--     7:00, 7:20, 7:40, 8:00 ... 15:20, 15:40 (27 huecos por día).
--     La cita solo puede empezar al inicio de un hueco (no 7:10 ni 7:30).
--   * Un médico no puede tener dos citas en el mismo hueco.
-- Depende de: citas
-- ============================================
 
-- 1. La cita debe caer exactamente en un hueco válido.
ALTER TABLE public.appointments
    ADD CONSTRAINT ck_appointments_slot
        CHECK (
            assignment_date::time BETWEEN TIME '07:00' AND TIME '15:40'
            AND EXTRACT(MINUTE FROM assignment_date) IN (0, 20, 40)
            AND EXTRACT(SECOND FROM assignment_date) = 0
        );
 
-- 2. Un médico no puede tener dos citas en el mismo hueco.
-- Las citas CANCELADAS no ocupan el hueco, por eso quedan por fuera del índice
-- (si se cancela una cita, otro paciente puede tomar ese hueco).
CREATE UNIQUE INDEX uq_appointments_doctor_slot
    ON public.appointments (dtr_id, assignment_date)
    WHERE appointment_status <> 'CANCELADA';