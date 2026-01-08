import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import Indents from './pages/Indents';

function App() {
  const [items, setItems] = useState([]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Billing items={items} setItems={setItems} />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/indents" element={<Indents />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
