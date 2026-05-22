import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Instances } from './pages/Instances'
import { ObjectStorage } from './pages/ObjectStorage'
import { Containers } from './pages/Containers'
import { Kubernetes } from './pages/Kubernetes'
import { Databases } from './pages/Databases'
import { Network } from './pages/Network'
import { LoadBalancer } from './pages/LoadBalancer'
import { Images } from './pages/Images'
import { IAM } from './pages/IAM'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/instances" element={<Instances />} />
          <Route path="/storage" element={<ObjectStorage />} />
          <Route path="/containers" element={<Containers />} />
          <Route path="/kubernetes" element={<Kubernetes />} />
          <Route path="/databases" element={<Databases />} />
          <Route path="/network" element={<Network />} />
          <Route path="/loadbalancer" element={<LoadBalancer />} />
          <Route path="/images" element={<Images />} />
          <Route path="/iam" element={<IAM />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
