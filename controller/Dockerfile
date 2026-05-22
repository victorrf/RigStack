FROM golang:1.23-alpine AS builder

WORKDIR /build

# Copia workspace e todos os módulos
COPY go.work go.work.sum* ./
COPY proto/ ./proto/
COPY controller/ ./controller/
COPY agent/ ./agent/

# Compila o controller
RUN go build -o /controller ./controller/cmd/...

# Compila o agent para linux/amd64 (hypervisores bare-metal)
RUN GOOS=linux GOARCH=amd64 go build -o /rigstack-agent ./agent/cmd/...

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /controller .
COPY --from=builder /rigstack-agent .

EXPOSE 8080 9090

CMD ["./controller"]
