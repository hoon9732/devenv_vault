import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Alignment, Button, Classes } from '@blueprintjs/core';

// Pages
const HomePage = () => <div><h1>Home Page</h1><p>Welcome to the Blueprint.js Electron App!</p></div>;
const DataVisualizationPage = () => <div><h1>Data Visualization</h1><p>This is where your data visualizations will go.</p></div>;
const DataEditingPage = () => <div><h1>Data Editing</h1><p>This is where your data editing tools will go.</p></div>;

function App() {
  return (
    <Router>
      <Navbar className={Classes.DARK}>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>Blueprint GUI</Navbar.Heading>
          <Navbar.Divider />
          <Link to="/"><Button className={Classes.MINIMAL} icon="home" text="Home" /></Link>
          <Link to="/visualize"><Button className={Classes.MINIMAL} icon="chart" text="Visualize Data" /></Link>
          <Link to="/edit"><Button className={Classes.MINIMAL} icon="edit" text="Edit Data" /></Link>
        </Navbar.Group>
      </Navbar>
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/visualize" element={<DataVisualizationPage />} />
          <Route path="/edit" element={<DataEditingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;