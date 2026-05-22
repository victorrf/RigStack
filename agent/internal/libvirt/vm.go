package libvirt

// Geração do XML de domínio libvirt e operações por VM.
//
// Exemplo de spec que vira XML:
//   Name:    "web-01"
//   vCPUs:   2
//   RAM:     4096 MB
//   Disk:    /var/lib/libvirt/images/web-01.qcow2  (40 GB)
//   OS:      ubuntu-24.04 (boot via cloud-init ISO)
//   Network: bridge rs-br-{vpcID}, IP 10.0.1.10
//
// Cloud-init:
//   Cada VM recebe um ISO de cloud-init com:
//     - hostname
//     - chave SSH pública (da conta do usuário no RigStack)
//     - network config (IP estático dentro da subnet)
//   Gerado em /var/lib/rigstack/cloudinit/{vmID}/
