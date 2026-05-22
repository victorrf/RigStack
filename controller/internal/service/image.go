package service

import (
	"context"
	"encoding/json"
	"fmt"

	pb "github.com/rigstack/proto/gen"
	"github.com/rigstack/controller/internal/dispatcher"
	"github.com/rigstack/controller/internal/scheduler"
)

type Image struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	OS      string `json:"os"`
	Version string `json:"version"`
	URL     string `json:"url"`
	SizeGB  int    `json:"size_gb"`
}

// catalog é a lista de imagens suportadas pelo RigStack.
var catalog = []Image{
	{
		ID:      "ubuntu-24.04",
		Name:    "Ubuntu 24.04 LTS",
		OS:      "Ubuntu",
		Version: "24.04",
		URL:     "https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img",
		SizeGB:  4,
	},
	{
		ID:      "debian-13",
		Name:    "Debian 13 (Trixie)",
		OS:      "Debian",
		Version: "13",
		URL:     "https://cloud.debian.org/images/cloud/trixie/latest/debian-13-genericcloud-amd64.qcow2",
		SizeGB:  3,
	},
	{
		ID:      "debian-12",
		Name:    "Debian 12 (Bookworm)",
		OS:      "Debian",
		Version: "12",
		URL:     "https://cloud.debian.org/images/cloud/bookworm/latest/debian-12-genericcloud-amd64.qcow2",
		SizeGB:  3,
	},
}

type ImageService struct {
	scheduler  *scheduler.Scheduler
	dispatcher *dispatcher.Dispatcher
}

func NewImageService(sched *scheduler.Scheduler, disp *dispatcher.Dispatcher) *ImageService {
	return &ImageService{scheduler: sched, dispatcher: disp}
}

func (s *ImageService) List() []Image {
	return catalog
}

func (s *ImageService) Get(id string) (Image, error) {
	for _, img := range catalog {
		if img.ID == id {
			return img, nil
		}
	}
	return Image{}, fmt.Errorf("image %q not found", id)
}

// Deploy envia o comando download_image para todos os nodes healthy.
func (s *ImageService) Deploy(ctx context.Context, imageID string) ([]string, error) {
	img, err := s.Get(imageID)
	if err != nil {
		return nil, err
	}

	nodes, err := s.scheduler.HealthyNodes(ctx)
	if err != nil || len(nodes) == 0 {
		return nil, fmt.Errorf("no healthy nodes available")
	}

	payload, _ := json.Marshal(map[string]string{
		"name": img.ID,
		"url":  img.URL,
	})

	var queued []string
	for _, n := range nodes {
		s.dispatcher.Enqueue(n.ID, &pb.Command{Type: "download_image", Payload: string(payload)})
		queued = append(queued, n.Name)
	}
	return queued, nil
}
