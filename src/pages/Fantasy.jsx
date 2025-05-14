import { useState } from "react";
import axios from "axios";
import './Fantasy.css';

export default function Fantasy() {
  const [teamId, setTeamId] = useState("");
  const [startingPlayers, setStartingPlayers] = useState([]);
  const [benchPlayers, setBenchPlayers] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0); // Dodano za skupne točke
  const [loading, setLoading] = useState(false);

  const getPlayersByPosition = (players, pos) =>
    players.filter((p) => p.position === pos && p.multiplier > 0);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://127.0.0.1:5000/api/fpl/team/${teamId}`);
      const data = res.data;

      if (data.starting_players && data.bench_players) {
        setStartingPlayers(data.starting_players);
        setBenchPlayers(data.bench_players);
        setTotalPoints(data.total_points); // Nastavi skupne točke
      } else {
        console.error("Unexpected API response structure:", data);
        setStartingPlayers([]);
        setBenchPlayers([]);
        setTotalPoints(0); // Ponastavi skupne točke
      }
    } catch (error) {
      console.error("Failed to load team:", error);
      setStartingPlayers([]);
      setBenchPlayers([]);
      setTotalPoints(0); // Ponastavi skupne točke
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      <main className="flex-1 p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel */}
          <div className="lg:w-1/3 w-full bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Fantasy FPL Team</h2>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter your FPL team ID"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                onClick={fetchTeam}
                className="w-full mt-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
              >
                Load My Team
              </button>
            </div>

            <h3 className="text-lg font-semibold mb-2">Suggested Players</h3>
            <ul className="space-y-2">
              {["Erling Haaland", "Bukayo Saka", "Jude Bellingham"].map((name, idx) => (
                <li
                  key={idx}
                  className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900 cursor-pointer transition"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Panel - Pitch */}
          <div className="lg:w-2/3 w-full bg-green-100 dark:bg-green-600 p-6 rounded-lg shadow">
            <div className="text-xl font-bold text-center mb-4 text-emerald-700 dark:text-emerald-300">
              Your Starting 11
            </div>

            {loading ? (
              <div className="text-center text-lg font-semibold">Loading team...</div>
            ) : startingPlayers.length === 0 ? (
              <div className="text-center text-gray-700 dark:text-gray-200">
                Enter your FPL team ID and press "Load My Team"
              </div>
            ) : (
              <div className="flex flex-col gap-4 items-center">
                {[1, 2, 3, 4].map((pos) => (
                  <div key={pos} className="flex justify-center gap-4 flex-wrap">
                    {getPlayersByPosition(startingPlayers, pos).map((p) => (
                      <div
                        key={p.id}
                        className={`bg-white dark:bg-gray-700 px-3 py-2 rounded-lg shadow text-sm text-center ${
                          p.is_captain
                            ? "border-2 border-yellow-500"
                            : p.is_vice_captain
                            ? "border-2 border-gray-400"
                            : ""
                        }`}
                      >
                        <div className="font-semibold">
                          {p.first_name[0]}. {p.second_name}
                        </div>
                        <div className="text-xs text-gray-500">Points: {p.points}</div> {/* Prikaz točk */}
                        {p.is_captain && <div className="text-xs text-yellow-600">Captain</div>}
                        {p.is_vice_captain && <div className="text-xs text-gray-300">Vice</div>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Total Points */}
            <div className="mt-8 text-center text-lg font-bold text-emerald-700 dark:text-emerald-300">
              Total Points: {totalPoints} {/* Prikaz skupnih točk */}
            </div>

            {/* Bench Players */}
            {benchPlayers.length > 0 && (
              <div className="mt-8">
                <div className="text-lg font-bold text-center text-emerald-700 dark:text-emerald-300 mb-2">
                  Bench Players
                </div>
                <div className="flex justify-center gap-4 flex-wrap">
                  {benchPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-gray-700 px-3 py-2 rounded-lg shadow text-sm text-center"
                    >
                      <div className="font-semibold">
                        {p.first_name[0]}. {p.second_name}
                      </div>
                      <div className="text-xs text-gray-500">Points: {p.points}</div> {/* Prikaz točk */}
                      <div className="text-xs text-gray-500">Bench</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}