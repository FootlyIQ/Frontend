import { useState, useEffect, use } from "react";
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
  const onClosePlayerCard = () => setSelectedPlayer(null);
  const navigate = useNavigate();

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
  }

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
    </div>
  );
}