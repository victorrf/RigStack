package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type VPC struct {
	ID        string
	Name      string
	CIDR      string
	Status    string
	CreatedAt time.Time
}

type VPCStore struct {
	db *pgxpool.Pool
}

func NewVPCStore(db *pgxpool.Pool) *VPCStore {
	return &VPCStore{db: db}
}

func (s *VPCStore) Create(ctx context.Context, vpc *VPC) (string, error) {
	var id string
	err := s.db.QueryRow(ctx, `
		INSERT INTO vpcs (name, cidr, status)
		VALUES ($1, $2, 'active')
		RETURNING id
	`, vpc.Name, vpc.CIDR).Scan(&id)
	return id, err
}

func (s *VPCStore) List(ctx context.Context) ([]VPC, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, name, cidr::text, status, created_at FROM vpcs ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vpcs []VPC
	for rows.Next() {
		var v VPC
		if err := rows.Scan(&v.ID, &v.Name, &v.CIDR, &v.Status, &v.CreatedAt); err != nil {
			return nil, err
		}
		vpcs = append(vpcs, v)
	}
	return vpcs, rows.Err()
}

func (s *VPCStore) Get(ctx context.Context, id string) (*VPC, error) {
	var v VPC
	err := s.db.QueryRow(ctx, `
		SELECT id, name, cidr::text, status, created_at FROM vpcs WHERE id = $1
	`, id).Scan(&v.ID, &v.Name, &v.CIDR, &v.Status, &v.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("vpc %s: %w", id, err)
	}
	return &v, nil
}

func (s *VPCStore) UpdateStatus(ctx context.Context, id, status string) error {
	_, err := s.db.Exec(ctx, `UPDATE vpcs SET status = $2 WHERE id = $1`, id, status)
	return err
}

func (s *VPCStore) Delete(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM vpcs WHERE id = $1`, id)
	return err
}
