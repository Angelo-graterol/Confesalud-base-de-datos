-- Datos de prueba — Citas 
-- Tablas: appointments, cancellations
-- Usa los ids 1, 2 y 3 de clients, doctors y staffs 
-- y las órdenes médicas 1, 2 y 3 
-- La auditoría se llena sola con el trigger, no lleva INSERT aquí.
 
INSERT INTO public.appointments
  (id, request_date, assignment_date, arrival_time, channel,
   appointment_status, observation, cet_id, dtr_id, stf_id, mor_id) VALUES
  (1, '2026-10-20 08:00', '2026-10-27 09:00', '2026-10-27 08:45', 'PRESENCIAL',
      'ATENDIDA',     'Control con especialista', 1, 1, 1, 1),
  (2, '2026-10-21 10:30', '2026-11-04 14:00', NULL,               'WEB',
      'PROGRAMADA',   'Toma de muestras',         2, 2, 1, 2),
  (3, '2026-10-22 15:00', '2026-11-05 10:20', NULL,               'TELEFONO',
      'CANCELADA',    NULL,                       3, 3, 2, NULL),
  (4, '2026-10-23 09:15', '2026-10-30 11:00', NULL,               'PRESENCIAL',
      'INASISTENCIA', 'Paciente no llegó',        1, 2, 2, NULL),
  (5, '2026-10-25 11:00', '2026-11-10 15:00', NULL,               'WEB',
      'PROGRAMADA',   'Consulta de seguimiento',  2, 1, 3, 1);
 
SELECT setval(pg_get_serial_sequence('public.appointments', 'id'), 5);
 
INSERT INTO public.cancellations
  (id, cancellation_date, reason, cancelled_by, apt_id, stf_id) VALUES
  (1, '2026-10-30 17:20', 'El paciente tiene un viaje', 'PACIENTE', 3, 2);
 
SELECT setval(pg_get_serial_sequence('public.cancellations', 'id'), 1);