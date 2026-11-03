-- Datos de prueba — Catálogos 
-- Tablas: states, cities, eps, order_types, medical_orders, specialties

-- Departamentos (código DANE como id)
INSERT INTO public.states (id, state_name) VALUES
  (5,  'Antioquia'),
  (11, 'Bogotá D.C.'),
  (20, 'Cesar'),
  (54, 'Norte de Santander'),
  (68, 'Santander');

-- Ciudades
INSERT INTO public.cities (city_name, state_id) VALUES
  ('Ocaña',         54),
  ('Cúcuta',        54),
  ('Pamplona',      54),
  ('Bucaramanga',   68),
  ('Floridablanca', 68),
  ('Aguachica',     20),
  ('Valledupar',    20),
  ('Medellín',      5),
  ('Bogotá',        11);

-- EPS (teléfonos y correos)
INSERT INTO public.eps (id, eps_name, nit, phone, email) VALUES
  (1, 'NUEVA EPS',   '900156264-2', '6015550101', 'contacto@nuevaeps.ejemplo.com'),
  (2, 'SANITAS',     '800251440-6', '6015550102', 'contacto@sanitas.ejemplo.com'),
  (3, 'SURA',        '800088702-2', '6045550103', 'contacto@sura.ejemplo.com'),
  (4, 'COOSALUD',    '900226715-3', '6055550104', 'contacto@coosalud.ejemplo.com'),
  (5, 'SALUD TOTAL', '800130907-4', '6015550105', 'contacto@saludtotal.ejemplo.com'),
  (6, 'FAMISANAR',   '830003564-7', '6015550106', 'contacto@famisanar.ejemplo.com');



INSERT INTO public.order_types (id, type_name, description) VALUES
  (1, 'CONSULTA ESPECIALISTA', 'Remisión a consulta con especialista'),
  (2, 'LABORATORIO',           'Exámenes de laboratorio clínico'),
  (3, 'IMAGENES DIAGNOSTICAS', 'Rayos X, ecografías, resonancias');

INSERT INTO public.medical_orders
  (id, order_number, issue_date, expiration_date, order_status, ote_id) VALUES
  (1, 'OM-0001', '2026-10-01', '2026-12-31', 'VIGENTE', 1),
  (2, 'OM-0002', '2026-10-05', '2026-11-05', 'VIGENTE', 2),
  (3, 'OM-0003', '2026-09-01', '2026-10-01', 'VENCIDA', 3);

SELECT setval(pg_get_serial_sequence('public.medical_orders', 'id'), 3);

INSERT INTO public.specialties (id, specialty_name, specialty_status) VALUES
  (1, 'MEDICINA GENERAL', 'ACTIVA'),
  (2, 'PEDIATRIA',        'ACTIVA'),
  (3, 'CARDIOLOGIA',      'ACTIVA'),
  (4, 'DERMATOLOGIA',     'INACTIVA');

