package storage

// Storage local — gerencia discos de VMs no próprio node (Fase A).
//
// Diretório base: /var/lib/rigstack/images/
//
// Por VM:
//   /var/lib/rigstack/images/{vmID}/
//     disk.qcow2        → disco principal da VM (qemu-img create -f qcow2)
//     cloudinit.iso     → ISO de configuração inicial (cloud-init)
//
// Operações:
//   AllocateDisk(vmID, sizeGB, baseImage) → cria qcow2 com backing file da imagem base
//   DeleteDisk(vmID)                      → remove o diretório inteiro
//   GetDiskUsage(vmID)                    → tamanho atual do qcow2 (virtual vs real)
//   ListImages()                          → imagens base disponíveis em /var/lib/rigstack/base/
//
// Fase B: adicionar ColdMigrate(vmID, targetNodeAddr)
//   → para a VM, copia o qcow2 via rsync/scp para o node destino, sobe lá.
