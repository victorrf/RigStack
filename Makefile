PROTO_DIR  := proto
PROTO_OUT  := proto/gen

.PHONY: proto build-controller build-agent run-dev

# Gera o código Go a partir dos .proto
proto:
	protoc \
		--go_out=$(PROTO_OUT) --go_opt=paths=source_relative \
		--go-grpc_out=$(PROTO_OUT) --go-grpc_opt=paths=source_relative \
		$(PROTO_DIR)/*.proto

# Builda os binários
build-controller:
	cd controller && go build -o ../bin/controller ./cmd

build-agent:
	cd agent && go build -o ../bin/agent ./cmd

build: build-controller build-agent

# Dev local: só controller + postgres (agent roda direto na máquina com KVM)
run-dev:
	docker compose up postgres controller
