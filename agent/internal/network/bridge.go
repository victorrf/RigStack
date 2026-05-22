package network

import "fmt"

func createBridge(vpcID, gatewayIP string, prefix int) error {
	name := BridgeName(vpcID)
	for _, cmd := range [][]string{
		{"ip", "link", "add", name, "type", "bridge"},
		{"ip", "link", "set", name, "up"},
		{"ip", "addr", "add", fmt.Sprintf("%s/%d", gatewayIP, prefix), "dev", name},
	} {
		if err := run(cmd...); err != nil {
			return err
		}
	}
	return nil
}

func deleteBridge(vpcID string) error {
	name := BridgeName(vpcID)
	_ = run("ip", "link", "set", name, "down")
	return run("ip", "link", "del", name)
}

// AttachToBridge liga uma interface de VM (vnet/tap gerada pelo libvirt) à bridge da VPC.
func AttachToBridge(vpcID, iface string) error {
	return run("ip", "link", "set", iface, "master", BridgeName(vpcID))
}
