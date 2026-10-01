-- Estado de propuestas informativas de un día.
-- NULL conserva itinerarios que no son propuestas.
-- Hibernate valida el esquema (ddl-auto=validate) y no altera esta columna al arrancar.

ALTER TABLE public.itineraries
    ADD COLUMN IF NOT EXISTS proposal_status character varying(20);

-- SPLIT

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_itineraries_proposal_status'
          AND conrelid = 'public.itineraries'::regclass
    ) THEN
        ALTER TABLE public.itineraries
            ADD CONSTRAINT ck_itineraries_proposal_status
            CHECK (
                proposal_status IS NULL
                OR proposal_status IN ('PROPOSED', 'ACCEPTED', 'CANCELLED')
            );
    END IF;
END $$;
