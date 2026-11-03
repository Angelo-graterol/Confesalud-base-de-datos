-- Datos de prueba 
-- Tablas: doctors, staffs, doctor_specialties, clients
-- Nombres y documentos inventados, solo para pruebas.
-- Usa: specialties 1-4, eps 1-6 y cities 1-9 (seed 01_a.sql).
 
INSERT INTO public.doctors
  (id, first_name, second_name, last_name, second_last_name,
   document_type, document_number, medical_registration, doctor_status) VALUES
  (1, 'Carlos',  'Andrés',  'Pérez',    'Quintero', 'CC', '1091000001', 'RM-54001', 'ACTIVO'),
  (2, 'Laura',   NULL,      'Gómez',    'Rincón',   'CC', '1091000002', 'RM-54002', 'ACTIVO'),
  (3, 'Andrea',  'Marcela', 'Sánchez',  NULL,       'CC', '1091000003', 'RM-68003', 'ACTIVO'),
  (4, 'Jorge',   'Luis',    'Navarro',  'Ortega',   'CE', 'E-0004521',  'RM-20004', 'VACACIONES');
 
SELECT setval(pg_get_serial_sequence('public.doctors', 'id'), 4);
 
INSERT INTO public.staffs
  (id, first_name, second_name, last_name, second_last_name,
   document_number, staff_role, staff_status) VALUES
  (1, 'Diana',   'Patricia', 'Torres',   'Mora',    '1091100001', 'RECEPCIONISTA', 'ACTIVO'),
  (2, 'Miguel',  NULL,       'Carrascal','Pacheco', '1091100002', 'AUXILIAR',      'ACTIVO'),
  (3, 'Sandra',  'Milena',   'Ascanio',  NULL,      '1091100003', 'COORDINADOR',   'ACTIVO');
 
SELECT setval(pg_get_serial_sequence('public.staffs', 'id'), 3);
 
-- Médico 1: medicina general y cardiología | 2: medicina general
-- 3: pediatría | 4: dermatología
INSERT INTO public.doctor_specialties (dtr_id, scy_id, start_date) VALUES
  (1, 1, '2020-02-01'),
  (1, 3, '2023-07-15'),
  (2, 1, '2021-05-10'),
  (3, 2, '2019-09-01'),
  (4, 4, '2022-01-20');
 
-- city_id: 1 Ocaña | 2 Cúcuta | 4 Bucaramanga | 6 Aguachica
INSERT INTO public.clients
  (id, first_name, second_name, last_name, second_last_name,
   document_type, document_number, gender, birth_date, phone, email,
   address, zone, regime, affiliation_status, occupation, education_level,
   eps_id, city_id) VALUES
  (1, 'María',   'José',    'Álvarez',  'Bayona',  'CC', '1091200001', 'F', '1985-03-14',
      '3001110001', 'maria.alvarez@ejemplo.com', 'Calle 10 # 12-30', 'URBANA',
      'CONTRIBUTIVO', 'ACTIVO', 'Docente', 'PROFESIONAL', 1, 1),
  (2, 'Pedro',   NULL,      'Jaime',    'Durán',   'CC', '1091200002', 'M', '1972-11-02',
      '3001110002', 'pedro.jaime@ejemplo.com',   'Vereda El Llano', 'RURAL',
      'SUBSIDIADO', 'ACTIVO', 'Agricultor', 'PRIMARIA', 4, 1),
  (3, 'Valentina', NULL,    'Rojas',    'Clavijo', 'TI', '1091200003', 'F', '2012-06-25',
      '3001110003', NULL,                         'Av. 0 # 5-40', 'URBANA',
      'CONTRIBUTIVO', 'ACTIVO', 'Estudiante', 'SECUNDARIA', 2, 2),
  (4, 'Luis',    'Fernando','Quintero', 'Salazar', 'CC', '1091200004', 'M', '1990-01-30',
      '3001110004', 'luis.quintero@ejemplo.com', 'Carrera 27 # 45-12', 'URBANA',
      'CONTRIBUTIVO', 'ACTIVO', 'Contador', 'PROFESIONAL', 3, 4),
  (5, 'Rosa',    'Elena',   'Manosalva', NULL,     'CC', '1091200005', 'F', '1958-08-19',
      '3001110005', NULL,                         'Barrio Primero de Mayo', 'URBANA',
      'SUBSIDIADO', 'SUSPENDIDO', 'Ama de casa', 'PRIMARIA', 4, 6);
 
SELECT setval(pg_get_serial_sequence('public.clients', 'id'), 5);