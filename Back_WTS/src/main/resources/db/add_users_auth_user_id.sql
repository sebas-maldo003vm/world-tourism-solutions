-- Vinculo opcional entre la cuenta de dominio y Supabase Auth.
-- public.users.id (bigint) sigue siendo la clave primaria.
-- auth_user_id es nullable: las cuentas ya existentes no quedan obligadas a tener sesion Auth.
-- La restriccion unica admite varios NULL en PostgreSQL.

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- SPLIT

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_users_auth_user_id'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT uq_users_auth_user_id UNIQUE (auth_user_id);
    END IF;
END $$;

-- SPLIT

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_users_auth_user_id'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT fk_users_auth_user_id
            FOREIGN KEY (auth_user_id)
            REFERENCES auth.users (id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- SPLIT

-- Cuentas creadas antes del alta hibrida: enlaza por correo si ya existen en Auth.
UPDATE public.users AS local_user
SET auth_user_id = auth_user.id
FROM auth.users AS auth_user
WHERE local_user.auth_user_id IS NULL
  AND lower(local_user.email) = lower(auth_user.email);
