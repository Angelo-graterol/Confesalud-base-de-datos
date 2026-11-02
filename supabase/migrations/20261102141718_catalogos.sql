-- ============================================
-- Migración: catalogos
-- Responsable: Persona A
-- Tablas: states, cities, eps, order_types, specialties, medical_orders
-- Depende de: nada
-- ============================================


-- 1. Tabla de departamentos
CREATE TABLE public.states (
    id INTEGER PRIMARY KEY,
    state_name VARCHAR(50) NOT NULL
);

-- 2. Tabla de ciudades
CREATE TABLE public.cities (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    city_name VARCHAR(60) NOT NULL,
    state_id INTEGER NOT NULL,

    CONSTRAINT fk_cities_states
        FOREIGN KEY (state_id)
        REFERENCES public.states(id),

    CONSTRAINT uq_cities_name_state
        UNIQUE (city_name, state_id)
);

-- 3. Tabla de eps
CREATE TABLE public.eps (
    id INTEGER PRIMARY KEY,
    eps_name VARCHAR(100) NOT NULL,
    nit VARCHAR(15) NOT NULL UNIQUE,
    phone VARCHAR(15),
    email VARCHAR(100)
);
