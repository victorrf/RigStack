-- Migração inicial do RigStack Controller

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE nodes (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT NOT NULL,
    region        TEXT NOT NULL,
    address       TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'healthy',  -- healthy | unreachable
    cpu_cores     INT,
    cpu_free_pct  INT,
    ram_bytes     BIGINT,
    ram_free      BIGINT,
    disk_bytes    BIGINT,
    disk_free     BIGINT,
    last_seen     TIMESTAMPTZ,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vpcs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT NOT NULL,
    cidr       CIDR NOT NULL,
    status     TEXT NOT NULL DEFAULT 'provisioning',  -- provisioning | active | deleting
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subnets (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vpc_id     UUID NOT NULL REFERENCES vpcs(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    cidr       CIDR NOT NULL,
    is_public  BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE nat_gateways (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vpc_id       UUID NOT NULL REFERENCES vpcs(id) ON DELETE CASCADE UNIQUE,
    node_id      UUID NOT NULL REFERENCES nodes(id),
    netns_name   TEXT NOT NULL,
    bridge_name  TEXT NOT NULL,
    internal_ip  INET NOT NULL,
    status       TEXT NOT NULL DEFAULT 'provisioning',  -- provisioning | active | error
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE instances (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',  -- pending | running | stopped | error
    node_id     UUID REFERENCES nodes(id),
    vpc_id      UUID REFERENCES vpcs(id),
    subnet_id   UUID REFERENCES subnets(id),
    vcpus       INT NOT NULL,
    ram_mb      INT NOT NULL,
    disk_gb     INT NOT NULL,
    ip_address  INET,
    os_image    TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'viewer',  -- admin | developer | viewer
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_access TIMESTAMPTZ
);
