package postgres

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Node struct {
	ID           string
	Name         string
	Region       string
	Address      string
	Status       string
	CPUCores     int32
	CPUFreePct   int32
	RAMBytes     int64
	RAMFree      int64
	DiskBytes    int64
	DiskFree     int64
	VMCount      int32
	LastSeen     time.Time
	RegisteredAt time.Time
}

type NodeStore struct {
	db *pgxpool.Pool
}

func NewNodeStore(db *pgxpool.Pool) *NodeStore {
	return &NodeStore{db: db}
}

func (s *NodeStore) Upsert(ctx context.Context, n *Node) (string, error) {
	var id string
	err := s.db.QueryRow(ctx, `
		INSERT INTO nodes (name, region, address, status, cpu_cores, ram_bytes, disk_bytes, last_seen, registered_at)
		VALUES ($1, $2, $3, 'healthy', $4, $5, $6, NOW(), NOW())
		ON CONFLICT (address) DO UPDATE
			SET name = EXCLUDED.name,
			    status = 'healthy',
			    last_seen = NOW()
		RETURNING id
	`, n.Name, n.Region, n.Address, n.CPUCores, n.RAMBytes, n.DiskBytes).Scan(&id)
	return id, err
}

func (s *NodeStore) UpdateHeartbeat(ctx context.Context, id string, cpuFree int32, ramFree, diskFree int64, vmCount int32) error {
	_, err := s.db.Exec(ctx, `
		UPDATE nodes
		SET cpu_free_pct = $2, ram_free = $3, disk_free = $4, vm_count = $5, last_seen = NOW(), status = 'healthy'
		WHERE id = $1
	`, id, cpuFree, ramFree, diskFree, vmCount)
	return err
}

func (s *NodeStore) MarkUnreachable(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `UPDATE nodes SET status = 'unreachable' WHERE id = $1`, id)
	return err
}

func (s *NodeStore) UpdateVMStatus(ctx context.Context, vmID, status, ip string) error {
	_, err := s.db.Exec(ctx, `
		UPDATE instances
		SET status     = $2,
		    ip_address = CASE WHEN $3 = '' THEN ip_address ELSE $3::inet END,
		    updated_at = NOW()
		WHERE id = $1
	`, vmID, status, ip)
	return err
}

func (s *NodeStore) List(ctx context.Context) ([]Node, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, name, region, address, status,
		       COALESCE(cpu_cores, 0), COALESCE(cpu_free_pct, 0),
		       COALESCE(ram_bytes, 0), COALESCE(ram_free, 0),
		       COALESCE(disk_bytes, 0), COALESCE(disk_free, 0),
		       COALESCE(vm_count, 0), last_seen, registered_at
		FROM nodes ORDER BY registered_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var nodes []Node
	for rows.Next() {
		var n Node
		if err := rows.Scan(
			&n.ID, &n.Name, &n.Region, &n.Address, &n.Status,
			&n.CPUCores, &n.CPUFreePct,
			&n.RAMBytes, &n.RAMFree,
			&n.DiskBytes, &n.DiskFree,
			&n.VMCount, &n.LastSeen, &n.RegisteredAt,
		); err != nil {
			return nil, err
		}
		nodes = append(nodes, n)
	}
	return nodes, rows.Err()
}

func (s *NodeStore) GetByID(ctx context.Context, id string) (*Node, error) {
	var n Node
	err := s.db.QueryRow(ctx, `
		SELECT id, name, region, address, status,
		       COALESCE(cpu_cores, 0), COALESCE(cpu_free_pct, 0),
		       COALESCE(ram_bytes, 0), COALESCE(ram_free, 0),
		       COALESCE(disk_bytes, 0), COALESCE(disk_free, 0),
		       COALESCE(vm_count, 0), last_seen, registered_at
		FROM nodes WHERE id = $1
	`, id).Scan(
		&n.ID, &n.Name, &n.Region, &n.Address, &n.Status,
		&n.CPUCores, &n.CPUFreePct,
		&n.RAMBytes, &n.RAMFree,
		&n.DiskBytes, &n.DiskFree,
		&n.VMCount, &n.LastSeen, &n.RegisteredAt,
	)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (s *NodeStore) Delete(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM nodes WHERE id = $1`, id)
	return err
}

func (s *NodeStore) GetHealthy(ctx context.Context) ([]Node, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, name, region, address, status,
		       COALESCE(cpu_cores, 0), COALESCE(cpu_free_pct, 0),
		       COALESCE(ram_bytes, 0), COALESCE(ram_free, 0),
		       COALESCE(disk_bytes, 0), COALESCE(disk_free, 0),
		       COALESCE(vm_count, 0), last_seen, registered_at
		FROM nodes
		WHERE status = 'healthy'
		  AND last_seen > NOW() - INTERVAL '30 seconds'
		ORDER BY ram_free DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var nodes []Node
	for rows.Next() {
		var n Node
		if err := rows.Scan(
			&n.ID, &n.Name, &n.Region, &n.Address, &n.Status,
			&n.CPUCores, &n.CPUFreePct,
			&n.RAMBytes, &n.RAMFree,
			&n.DiskBytes, &n.DiskFree,
			&n.VMCount, &n.LastSeen, &n.RegisteredAt,
		); err != nil {
			return nil, err
		}
		nodes = append(nodes, n)
	}
	return nodes, rows.Err()
}
