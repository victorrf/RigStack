package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Instance struct {
	ID        string
	Name      string
	Status    string
	NodeID    string
	VPCID     string
	SubnetID  string
	VCPUs     int
	RAMMB     int
	DiskGB    int
	IPAddress string
	OSImage   string
	Password  string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type InstanceStore struct {
	db *pgxpool.Pool
}

func NewInstanceStore(db *pgxpool.Pool) *InstanceStore {
	return &InstanceStore{db: db}
}

func (s *InstanceStore) Create(ctx context.Context, inst *Instance) (string, error) {
	var id string
	err := s.db.QueryRow(ctx, `
		INSERT INTO instances (name, status, node_id, vpc_id, vcpus, ram_mb, disk_gb, os_image, password)
		VALUES ($1, 'pending', NULLIF($2,'')::uuid, NULLIF($3,'')::uuid, $4, $5, $6, $7, $8)
		RETURNING id
	`, inst.Name, inst.NodeID, inst.VPCID, inst.VCPUs, inst.RAMMB, inst.DiskGB, inst.OSImage, inst.Password).Scan(&id)
	return id, err
}

func (s *InstanceStore) List(ctx context.Context) ([]Instance, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, name, status,
		       COALESCE(node_id::text, ''), COALESCE(vpc_id::text, ''),
		       COALESCE(subnet_id::text, ''),
		       vcpus, ram_mb, disk_gb,
		       COALESCE(ip_address::text, ''), os_image, COALESCE(password, ''),
		       created_at, updated_at
		FROM instances ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var instances []Instance
	for rows.Next() {
		var i Instance
		if err := rows.Scan(
			&i.ID, &i.Name, &i.Status,
			&i.NodeID, &i.VPCID, &i.SubnetID,
			&i.VCPUs, &i.RAMMB, &i.DiskGB,
			&i.IPAddress, &i.OSImage, &i.Password,
			&i.CreatedAt, &i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		instances = append(instances, i)
	}
	return instances, rows.Err()
}

func (s *InstanceStore) Get(ctx context.Context, id string) (*Instance, error) {
	var i Instance
	err := s.db.QueryRow(ctx, `
		SELECT id, name, status,
		       COALESCE(node_id::text, ''), COALESCE(vpc_id::text, ''),
		       COALESCE(subnet_id::text, ''),
		       vcpus, ram_mb, disk_gb,
		       COALESCE(ip_address::text, ''), os_image, COALESCE(password, ''),
		       created_at, updated_at
		FROM instances WHERE id = $1
	`, id).Scan(
		&i.ID, &i.Name, &i.Status,
		&i.NodeID, &i.VPCID, &i.SubnetID,
		&i.VCPUs, &i.RAMMB, &i.DiskGB,
		&i.IPAddress, &i.OSImage, &i.Password,
		&i.CreatedAt, &i.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("instance %s: %w", id, err)
	}
	return &i, nil
}

func (s *InstanceStore) UpdateStatus(ctx context.Context, id, status, ip string) error {
	_, err := s.db.Exec(ctx, `
		UPDATE instances SET status = $2, ip_address = NULLIF($3, '')::inet, updated_at = NOW()
		WHERE id = $1
	`, id, status, ip)
	return err
}

func (s *InstanceStore) Delete(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM instances WHERE id = $1`, id)
	return err
}

// CountByVPC retorna o número de instâncias numa VPC (para alocação de IP sequencial).
func (s *InstanceStore) CountByVPC(ctx context.Context, vpcID string) (int, error) {
	var count int
	err := s.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM instances WHERE vpc_id = $1::uuid`, vpcID,
	).Scan(&count)
	return count, err
}
