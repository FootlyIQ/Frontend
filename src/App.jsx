import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Fantasy from './pages/Fantasy';
import ClubPage from './pages/ClubPage';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import MatchDetail from './components/Home/MatchDetail';
import AnalysisHub from './pages/AnalysisHub';
import PlayerPage from './pages/PlayerPage';
import CompetitionDetails from './pages/CompetitionDetails';
import TeamsSearch from './pages/TeamsSearch';
import PlayersSearch from './pages/PlayersSearch';
import { useMatchNotifications } from './hooks/useMatchNotifications';
import BettingPage from './pages/BettingPage';

function App() {
  // Initialize match notifications monitoring
  const { isMonitoring } = useMatchNotifications();

  return (
    <Router>
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="flex-1">
          {/* Monitoring indicator (optional, can be removed for production) */}
          {isMonitoring && (
            <div className="fixed bottom-4 left-4 z-50 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Monitoring favorites
            </div>
          )}

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fantasy" element={<Fantasy />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/match/:matchId" element={<MatchDetail />} />
            <Route path="/team/:teamId" element={<ClubPage />} />
            <Route path="/teams" element={<TeamsSearch />} />
            <Route path="/players" element={<PlayersSearch />} />
            <Route path="/analysis" element={<AnalysisHub />} />
            <Route path="/betting" element={<BettingPage />} />
            <Route path="/player/:playerId" element={<PlayerPage />} />
            <Route path="/competition/:code" element={<CompetitionDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
