import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AuditLog from './pages/Audit';
import Indents from './pages/Indents';
import Emergency from './pages/Emergency';
import Orders from './pages/Orders';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="indents" element={<Indents />} />
          <Route path="orders" element={<Orders />} />
          <Route path="emergency" element={<Emergency />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
