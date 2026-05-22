package libvirt

// Manager — interface com libvirt/KVM para gerenciamento de VMs.
//
// Usa a biblioteca go-libvirt (github.com/digitalocean/go-libvirt)
// que se conecta ao socket UNIX do libvirtd: /var/run/libvirt/libvirt-sock
//
// Operações planejadas:
//   CreateVM(spec)    → gera XML de domínio libvirt, chama DomainDefineXML + DomainCreate
//   StartVM(name)     → DomainCreate (se já definido mas parado)
//   StopVM(name)      → DomainShutdown (gracioso) ou DomainDestroy (forçado)
//   DeleteVM(name)    → DomainUndefine + remove disco de /var/lib/libvirt/images/
//   GetVMStatus(name) → DomainGetState → mapeia para (running|stopped|error)
//   ListVMs()         → ConnectListAllDomains
//   GetNodeStats()    → NodeGetInfo (CPU, RAM total/livre para o heartbeat)
