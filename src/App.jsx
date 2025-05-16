import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Fantasy from './pages/Fantasy';
import Navbar from './components/Navbar';
import MatchDetail from './components/Home/MatchDetail';

function App() {
  return (
    <Router>
      <div className="flex flex-col lg:flex-row min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Navbar />
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-800">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fantasy" element={<Fantasy />} />
            <Route path="/match/:matchId" element={<MatchDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
