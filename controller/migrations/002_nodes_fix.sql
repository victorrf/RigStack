-- Adiciona coluna vm_count e unique constraint em nodes.address
-- (referenciados pelo código mas ausentes na migração inicial)

ALTER TABLE nodes ADD COLUMN IF NOT EXISTS vm_count INT NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'nodes_address_key' AND conrelid = 'nodes'::regclass
    ) THEN
        ALTER TABLE nodes ADD CONSTRAINT nodes_address_key UNIQUE (address);
    END IF;
END $$;
