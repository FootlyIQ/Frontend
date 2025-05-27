import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import './FantasyPitch.css';
import PlayerDetailCard from "./PlayerDetailCard";

const positionMap = {
  1: "goalkeeper",
  2: "defender",
  3: "midfielder",
  4: "forward"
};

export default function FantasyPitch() {
  const [teamId, setTeamId] = useState("");
  const [startingPlayers, setStartingPlayers] = useState([]);
  const [benchPlayers, setBenchPlayers] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gameweek, setGameweek] = useState(38);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedGameweek, setSelectedGameweek] = useState(38); // Default gameweek
  const [currentGameweek, setCurrentGameweek] = useState(38); // Default current gameweek
  const [suggestions, setSuggestions] = useState(null);
  const [captaincyLoading, setCaptaincyLoading] = useState(false);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [captaincySuggestions, setCaptaincySuggestions] = useState(null);
  const [transferSuggestions, setTransferSuggestions] = useState(null);
  const [showCaptaincyBox, setShowCaptaincyBox] = useState(false);
  const [showTransferBox, setShowTransferBox] = useState(false);
  const onClosePlayerCard = () => setSelectedPlayer(null);
  const navigate = useNavigate();
  const captaincyBoxRef = useRef(null);
  const transferBoxRef = useRef(null);

  useEffect(() => {
    const fetchCurrentGameweek = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/api/fpl/current-gameweek");
        const gw = res.data.current_gameweek;
        setCurrentGameweek(gw);
        setSelectedGameweek(gw);
        setGameweek(gw);
      } catch (err) {
        console.error("Failed to fetch current gameweek", err);
      }
    };
    fetchCurrentGameweek();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchTeamIdFromFirestore(user.uid);
      } else {
        navigate("/login"); // Preusmeri na stran za prijavo
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchTeamIdFromFirestore = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid)); // Uporabi user.uid
      if (userDoc.exists()) {
        const data = userDoc.data();
        setTeamId(data.teamId || "");
        if (data.teamId) {
          fetchTeam(data.teamId); // Samodejno naloži ekipo
        }
      } else {
        console.warn("No user document found in Firestore.");
      }
    } catch (err) {
      console.error("Failed to fetch team ID from Firestore:", err);
    }
  };

  const fetchTeam = async (id, gw = selectedGameweek) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://127.0.0.1:5000/api/fpl/team/${id}?gameweek=${gw}`);
      const data = res.data;

      setStartingPlayers(data.starting_players || []);
      setBenchPlayers(data.bench_players || []);
      setTotalPoints(data.total_points || 0);
      setGameweek(gw);
    } catch (err) {
      console.error("Failed to fetch team", err);
      setStartingPlayers([]);
      setBenchPlayers([]);
      setTotalPoints(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerClick = async (player) => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/fpl/player-details/${player.id}?gameweek=${gameweek}&is_captain=${player.is_captain}`);
      setSelectedPlayer({ ...player, stats: res.data });
    } catch (err) {
      console.error("Failed to fetch player stats", err);
    }
  };

  const handleGameweekChange = (e) => {
    setSelectedGameweek(Number(e.target.value));
    if (teamId) {
      fetchTeam(teamId, Number(e.target.value));
    }
    setShowCaptaincyBox(false);
    setShowTransferBox(false);
    setCaptaincySuggestions(null);
    setTransferSuggestions(null);
  }

  // Handler for captaincy suggestions
  const handleGetCaptaincy = async () => {
    setCaptaincyLoading(true);
    setCaptaincySuggestions(null);
    setShowCaptaincyBox(false);
    try {
      const res = await axios.get(
        `http://127.0.0.1:5000/api/fpl/captaincy/${teamId}?gameweek=${selectedGameweek}`
      );
      setCaptaincySuggestions(res.data);
      setShowCaptaincyBox(true);
      setTimeout(() => {
        captaincyBoxRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setCaptaincySuggestions({ error: "Failed to fetch captaincy suggestions" });
      setShowCaptaincyBox(true)
    } finally {
      setCaptaincyLoading(false);
    }
  };

  // Handler for transfer suggestions
  const handleGetTransfers = async () => {
    setTransfersLoading(true);
    setTransferSuggestions(null);
    setShowTransferBox(false);
    try {
      const res = await axios.get(
        `http://127.0.0.1:5000/api/fpl/transfers/${teamId}?gameweek=${selectedGameweek}`
      );
      setTransferSuggestions(res.data);
      setShowTransferBox(true);
      setTimeout(() => {
        transferBoxRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setTransferSuggestions({ error: "Failed to fetch transfer suggestions" });
      setShowTransferBox(true);
    } finally {
      setTransfersLoading(false);
    }
  };

  const getPositionGroup = (position) => {
    return startingPlayers.filter((player) => player.position === position);
  };

  const teamIdToShirtNumber = {
    1: 3,    // Arsenal 1
    2: 7,    // Aston Villa 1
    3: 91,   // Bournemouth 1
    4: 94,   // Brentford 1
    5: 36,   // Brighton 1
    6: 8,    // Chelsea 1
    7: 31,   // Crystal Palace 1
    8: 11,   // Everton 1
    9: 54,   // Fulham 1
    10: 40,  // Ipswich 1
    11: 13,  // Leicester 1
    12: 14,  // Liverpool 1
    13: 43,  // Man City 1
    14: 1,   // Man Utd 1
    15: 4,   // Newcastle 1
    16: 17,  // Nottingham Forest 1
    17: 20,  // Southampton 1
    18: 6,   // Spurs 1
    19: 21,  // West Ham 1
    20: 39   // Wolves 1
  };

  const renderPlayers = (players, lineClass) => (
    <div className={`line ${lineClass}`}>
      {players.map((p) => {
        const shirtNumber = teamIdToShirtNumber[p.team] || 1;
        const shirtUrl = p.position === 1
          ? `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${shirtNumber}_1-110.webp`
          : `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${shirtNumber}-110.webp`;

        return (
          <div
            key={p.id}
            className={`player-card cursor-pointer ${selectedPlayer?.id === p.id ? "ring-2 ring-emerald-500" : ""}`}
            onClick={() => handlePlayerClick(p)}
            title={`${p.first_name} ${p.second_name}\nPoints: ${p.points}`}
          >
            {/* Top-left C/VC */}
            {(p.is_captain || p.is_vice_captain) && (
              <div className="captain-marker">
                {p.is_captain ? "C" : "V"}
              </div>
            )}

            {/* Shirt */}
            <div className="kit-container">
              <img src={shirtUrl} alt="shirt" className="shirt-image" />
            </div>

            {/* Player name */}
            <div className="player-name">
              {p.second_name}
            </div>

            {/* Points */}
            <div className="player-points">
              {p.points || 0}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      <main className="flex-1 p-6">
        {/* Gameweek and Total Points Section */}
        <div className="gameweek-info text-center mb-6">
          <h2 className="text-3xl font-bold text-emerald-600">Total Points: {totalPoints}</h2>
          <div className="flex justify-center items-center gap-2 mt-4">
            <select
              value={selectedGameweek}
              onChange={handleGameweekChange}
              className="border rounded px-2 py-1 text-base"
            >
              {Array.from({ length: currentGameweek }, (_, i) => (
                <option key={i + 1} value={i + 1} className="bg-white text-gray-900 dark:bg-slate-800 dark:text-gray-100">
                  Gameweek {i + 1}
                </option>
              ))}
            </select>
          </div>
          {/* Suggestion Buttons */}
          {selectedGameweek < currentGameweek && (
            <div className="flex gap-4 justify-center my-6">
              <button
                onClick={handleGetCaptaincy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1 rounded"
                disabled={captaincyLoading}
              >
                {captaincyLoading ? "Loading..." : `Get Captaincy Suggestions for GW ${selectedGameweek + 1}`}
              </button>
              <button
                onClick={handleGetTransfers}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
                disabled={transfersLoading}
              >
                {transfersLoading ? "Loading..." : `Get Transfer Suggestions for GW ${selectedGameweek + 1}`}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Right Panel - Pitch */}
          <div className="lg:w-2/3 w-full pitch-container rounded-lg shadow">
            <div className="pitch">
              <img
                src="https://fantasy.premierleague.com/static/media/pitch-default.dab51b01.svg"
                alt="pitch"
                className="pitch-background"
              />

              {loading ? (
                <div className="text-center text-lg font-semibold">Loading team...</div>
              ) : (
                <>
                  {renderPlayers(getPositionGroup(1), "goalkeepers")}
                  {renderPlayers(getPositionGroup(2), "defenders")}
                  {renderPlayers(getPositionGroup(3), "midfielders")}
                  {renderPlayers(getPositionGroup(4), "forwards")}
                </>
              )}

              {/* Bench Section */}
              <div className="bench-container">
                <h3 className="bench-title">Bench</h3>
                {renderPlayers(benchPlayers, "bench")}
              </div>
            </div>
            {/* Results under the pitch */}
            <div className="flex flex-col gap-6 justify-center mt-8">
              {showCaptaincyBox && (
                <div
                  ref={captaincyBoxRef}
                  className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-4 w-full mx-auto"
                >
                  <h3 className="font-bold mb-4 text-xl text-emerald-700 flex items-center gap-2">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#059669" /><text x="12" y="17" textAnchor="middle" fontSize="14" fill="#fff" fontWeight="bold">C</text></svg>
                    Top 6 Captaincy Choices
                  </h3>
                  {captaincyLoading ? (
                    <div className="text-center text-lg font-semibold">Loading...</div>
                  ) : captaincySuggestions && Array.isArray(captaincySuggestions.suggested_captains) && captaincySuggestions.suggested_captains.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {captaincySuggestions.suggested_captains.map((cap, idx) => {
                        const shirtNumber = teamIdToShirtNumber[cap.team_id] || 1;
                        const shirtUrl = cap.position === 1
                          ? `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${shirtNumber}_1-110.webp`
                          : `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${shirtNumber}-110.webp`;
                        const posLabel = positionMap[cap.position] || "";

                        // Badge for top 3
                        let badge = null;
                        if (idx === 0) {
                          badge = (
                            <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow">Best</span>
                          );
                        } else if (idx === 1) {
                          badge = (
                            <span className="absolute -top-2 -right-2 bg-gray-300 text-gray-800 text-xs px-2 py-0.5 rounded-full font-bold shadow">Silver</span>
                          );
                        } else if (idx === 2) {
                          badge = (
                            <span className="absolute -top-2 -right-2" style={{
                              background: 'linear-gradient(90deg, #cd7f32 0%, #b87333 100%)',
                              color: '#fff',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}>Bronze</span>
                          );
                        }

                        return (
                          <div
                            key={cap.id}
                            className={`flex items-center gap-4 bg-emerald-50 dark:bg-slate-900 rounded-lg shadow-sm p-3 border-2 ${idx === 0 ? "border-emerald-600" : idx === 1 ? "border-gray-400" : idx === 2 ? "border-yellow-700" : "border-transparent"}`}
                            style={{ minWidth: 0 }}
                          >
                            {/* Ranking Number */}
                            <div className="flex flex-col items-center mr-2">
                              <span className={`text-2xl font-bold ${idx === 0 ? "text-emerald-600" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-yellow-700" : "text-gray-400"}`}>
                                {idx + 1}
                              </span>
                            </div>
                            <div className="relative">
                              <img
                                src={shirtUrl}
                                alt="kit"
                                className="w-14 h-14 object-contain"
                                style={{ filter: idx === 0 ? "drop-shadow(0 0 8px #05966988)" : undefined }}
                              />
                              {badge}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg truncate">{cap.first_name} {cap.second_name}</span>
                                <span className="text-xs bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded">{posLabel}</span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-semibold text-emerald-700">Score:</span>{" "}
                                <span className={`font-bold ${idx === 0 ? "text-emerald-600" : ""}`}>{cap.score.toFixed(2)}</span>
                                {" | "}
                                <span className="font-semibold">Avg pts:</span> {cap.avg_points.toFixed(2)}
                                {" | "}
                                <span className="font-semibold">Form:</span> {cap.form}
                              </div>
                              <div className="text-xs mt-1">
                                <span className="font-semibold">Next:</span>{" "}
                                <span>
                                  {cap.next_fixture.opponent} ({cap.next_fixture.is_home ? "Home" : "Away"}, FDR: {cap.next_fixture.fdr})
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center">No captaincy suggestions</div>
                  )}
                </div>
              )}

              {/* Transfer Suggestions */}
              {showTransferBox && transferSuggestions && (
                <div
                  ref={transferBoxRef}
                  className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-4 w-full mx-auto"
                >
                  <h3 className="font-bold mb-4 text-xl text-blue-700 flex items-center gap-2">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="#2563eb" />
                      <text x="12" y="17" textAnchor="middle" fontSize="14" fill="#fff" fontWeight="bold">T</text>
                    </svg>
                    Transfer Suggestions
                  </h3>
                  {/* Show free transfers and budget */}
                  <div className="flex flex-wrap gap-6 mb-6 justify-center">
                    <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg shadow">
                      <span className="font-semibold">Free Transfers:</span>
                      <span className="font-bold text-lg">{transferSuggestions.free_transfers ?? "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-4 py-2 rounded-lg shadow">
                      <span className="font-semibold">Budget:</span>
                      <span className="font-bold text-lg">£{transferSuggestions.budget?.toFixed(1) ?? "-"}</span>
                      <span className="text-xs text-gray-500">m</span>
                    </div>
                  </div>
                  {transfersLoading ? (
                    <div className="text-center text-lg font-semibold">Loading...</div>
                  ) : Array.isArray(transferSuggestions.top_transfers) && transferSuggestions.top_transfers.length > 0 ? (
                    <div>
                      {transferSuggestions.top_transfers.map((transfer, idx) => {
                        const out = transfer.out;
                        const inn = transfer.in;
                        const outShirtNumber = teamIdToShirtNumber[out.team_id || out.team] || 1;
                        const outShirtUrl = out.position === 1
                          ? `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${outShirtNumber}_1-110.webp`
                          : `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${outShirtNumber}-110.webp`;
                        const inShirtNumber = teamIdToShirtNumber[inn.team_id || inn.team] || 1;
                        const inShirtUrl = inn.position === 1
                          ? `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${inShirtNumber}_1-110.webp`
                          : `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${inShirtNumber}-110.webp`;
                        const outPosLabel = positionMap[out.position || out.element_type] || "";
                        const inPosLabel = positionMap[inn.position || inn.element_type] || "";
              
                        // Shared card classes for both out and in cards
                        const cardClass =
                          "flex items-center gap-4 bg-slate-900 dark:bg-slate-900 rounded-lg shadow-sm p-3 border-2 min-w-[270px] max-w-[320px] relative flex-1";
              
                        return (
                          <div key={out.id + "-" + inn.id}
                            className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-6"
                          >
                            {/* OUT card */}
                            <div
                              className={`${cardClass} border-red-600`}
                              style={{ minWidth: 0, minHeight: "120px" }}
                            >
                              <div className="relative">
                                <img
                                  src={outShirtUrl}
                                  alt="kit"
                                  className="w-14 h-14 object-contain"
                                />
                                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow">Out</span>
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-between" style={{ minHeight: "72px" }}>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg truncate">{out.first_name} {out.second_name}</span>
                                    <span className="text-xs bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded">{outPosLabel}</span>
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    <span className="font-semibold">Price:</span> £{out.now_cost?.toFixed(1) ?? "-"}
                                    {" | "}
                                    <span className="font-semibold">Form:</span> {out.form}
                                  </div>
                                </div>
                                {/* Add empty lines for spacing to match IN card */}
                                <div className="text-sm text-transparent select-none">Score: ----</div>
                                <div className="text-xs mt-1 text-transparent select-none">Next: ----</div>
                              </div>
                            </div>
                            {/* Swap Icon */}
                            <div className="flex flex-col items-center justify-center mx-2">
                              <svg width="36" height="36" fill="none" viewBox="0 0 36 36">
                                <g>
                                  {/* Right arrow */}
                                  <path d="M10 18h16" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                                  <path d="M22 14l4 4-4 4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </g>
                              </svg>
                              <span className="text-xs text-gray-400 mt-1">Swap</span>
                            </div>
                            {/* IN card */}
                            <div
                              className={`${cardClass} border-green-600`}
                              style={{ minWidth: 0, minHeight: "120px" }}
                            >
                              <div className="relative">
                                <img
                                  src={inShirtUrl}
                                  alt="kit"
                                  className="w-14 h-14 object-contain"
                                />
                                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow">In</span>
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-between" style={{ minHeight: "72px" }}>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg truncate">{inn.first_name} {inn.second_name}</span>
                                    <span className="text-xs bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded">{inPosLabel}</span>
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    <span className="font-semibold">Price:</span> £{inn.now_cost?.toFixed(1) ?? "-"}
                                    {" | "}
                                    <span className="font-semibold">Form:</span> {inn.form}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-300">
                                  <span className="font-semibold text-emerald-700">Score:</span>{" "}
                                  <span className="font-bold text-emerald-700">{inn.score?.toFixed(2) ?? "-"}</span>
                                </div>
                                <div className="text-xs mt-1 text-gray-400">
                                  <span className="font-semibold">Next:</span>{" "}
                                  <span>
                                    {inn.next_fixture?.opponent} ({inn.next_fixture?.is_home ? "Home" : "Away"}, FDR: {inn.next_fixture?.fdr})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center">No transfer suggestions</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* Modal Overlay */}
      {selectedPlayer?.stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-slate-900/70">
          <PlayerDetailCard
            player={selectedPlayer}
            stats={selectedPlayer.stats}
            onClose={onClosePlayerCard}
          />
        </div>
      )}
      {suggestions && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-4 max-w-xl mx-auto">
          <h3 className="font-bold mb-2 text-lg text-emerald-700">Suggestions for Next Gameweek</h3>
          <div className="mb-4">
            <strong>Top 5 Captaincy Choices:</strong>
            {Array.isArray(suggestions.suggested_captains) && suggestions.suggested_captains.length > 0 ? (
              <ol className="list-decimal ml-6 mt-2">
                {suggestions.suggested_captains.map((cap) => (
                  <li key={cap.id} className="mb-2">
                    <span className="font-semibold">{cap.first_name} {cap.second_name}</span>
                    {" | Avg pts: "}
                    <span className="text-emerald-600">{cap.avg_points.toFixed(2)}</span>
                    {" | Form: "}
                    <span>{cap.form}</span>
                    {" | Score: "}
                    <span className="font-mono">{cap.score.toFixed(2)}</span>
                    {" | Next: "}
                    <span>
                      {cap.next_fixture.opponent} ({cap.next_fixture.is_home ? "Home" : "Away"}, FDR: {cap.next_fixture.fdr})
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div>No captaincy suggestions</div>
            )}
          </div>
          <div>
            <strong>Transfer Out:</strong>{" "}
            {Array.isArray(suggestions.suggested_transfers_out) && suggestions.suggested_transfers_out.length > 0
              ? suggestions.suggested_transfers_out.map((out) =>
                `${out.first_name} ${out.second_name} (Form: ${out.form})`
              ).join(", ")
              : "No suggestion"}
          </div>
          <div>
            <strong>Transfer In:</strong>{" "}
            {Array.isArray(suggestions.suggested_transfers_in) && suggestions.suggested_transfers_in.length > 0
              ? suggestions.suggested_transfers_in.map((inn) =>
                `${inn.first_name} ${inn.second_name} (Form: ${inn.form})`
              ).join(", ")
              : "No suggestion"}
          </div>
        </div>
      )}
    </div>
  );
}