import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MatchFeed from '../components/Home/MatchFeed';
import RightSidebar from '../components/Home/RightSidebar';

export default function Home() {
  const [todaysMatches, setTodaysMatches] = useState([]);

  // Fetch today's matches for the sidebar
  useEffect(() => {
    const fetchTodaysMatches = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get(`http://127.0.0.1:5000/matches?date=${today}`);
        setTodaysMatches(response.data);
      } catch (err) {
        console.error("Error fetching today's matches for sidebar:", err);
      }
    };

    fetchTodaysMatches();

    // Refresh every 1 minute to keep sidebar data current
    const interval = setInterval(fetchTodaysMatches, 1 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-800 text-gray-900">
      <main className="flex-1 p-6 bg-slate-800">
        <MatchFeed />
      </main>
      <RightSidebar todaysMatches={todaysMatches} />
    </div>
  );
}
