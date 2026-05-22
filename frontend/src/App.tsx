import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ComingSoon } from './components/ComingSoon'

// Mock pages (live demo)
import { Dashboard } from './pages/Dashboard'
import { Instances } from './pages/Instances'
import { ObjectStorage } from './pages/ObjectStorage'
import { BucketDetail } from './pages/BucketDetail'
import { Containers } from './pages/Containers'
import { Kubernetes } from './pages/Kubernetes'
import { Databases } from './pages/Databases'
import { Network } from './pages/Network'
import { LoadBalancer } from './pages/LoadBalancer'
import { Images } from './pages/Images'
import { IAM } from './pages/IAM'

// Real pages (connected to API)
import { RealDashboard } from './pages/real/Dashboard'
import { RealInstances } from './pages/real/Instances'
import { RealNetwork } from './pages/real/Network'
import { RealNodes } from './pages/real/Nodes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Real API routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<RealDashboard />} />
          <Route path="/instances" element={<RealInstances />} />
          <Route path="/nodes" element={<RealNodes />} />
          <Route path="/network" element={<RealNetwork />} />
          <Route path="/storage" element={<ComingSoon feature="Object Storage" />} />
          <Route path="/containers" element={<ComingSoon feature="Containers" />} />
          <Route path="/kubernetes" element={<ComingSoon feature="Kubernetes" />} />
          <Route path="/databases" element={<ComingSoon feature="Databases" />} />
          <Route path="/loadbalancer" element={<ComingSoon feature="Load Balancer" />} />
          <Route path="/images" element={<ComingSoon feature="Images" />} />
          <Route path="/iam" element={<ComingSoon feature="IAM" />} />
        </Route>

        {/* Live Demo routes (mock data, no API) */}
        <Route path="/live-demo" element={<Layout basePath="/live-demo" />}>
          <Route index element={<Dashboard />} />
          <Route path="instances" element={<Instances />} />
          <Route path="storage" element={<ObjectStorage />} />
          <Route path="storage/bucket/:id" element={<BucketDetail />} />
          <Route path="containers" element={<Containers />} />
          <Route path="kubernetes" element={<Kubernetes />} />
          <Route path="databases" element={<Databases />} />
          <Route path="network" element={<Network />} />
          <Route path="loadbalancer" element={<LoadBalancer />} />
          <Route path="images" element={<Images />} />
          <Route path="iam" element={<IAM />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
