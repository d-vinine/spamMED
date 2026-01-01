import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';

function App() {
  const [items, setItems] = useState([]);

  return (
    <Router>
      <div className="dashboard">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Billing items={items} setItems={setItems} />} />
          <Route path="/inventory" element={<Inventory />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
