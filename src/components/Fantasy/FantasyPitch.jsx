import { useState, useEffect } from "react";
import axios from "axios";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import './FantasyPitch.css';

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
  const [gameweek, setGameweek] = useState(36);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User ID:", user.uid);
        fetchTeamIdFromFirestore(user.uid); // Posreduj user.uid
      } else {
        console.log("No user is signed in.");
      }
    });

    return () => unsubscribe(); // Počisti poslušalca ob unmountu
  }, []);

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

  const fetchTeam = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://127.0.0.1:5000/api/fpl/team/${id}`);
      const data = res.data;

      setStartingPlayers(data.starting_players || []);
      setBenchPlayers(data.bench_players || []);
      setTotalPoints(data.total_points || 0);
      setGameweek(data.gameweek || 36);
    } catch (err) {
      console.error("Failed to fetch team", err);
      setStartingPlayers([]);
      setBenchPlayers([]);
      setTotalPoints(0);
    } finally {
      setLoading(false);
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
          <div key={p.id} className="player-card" title={`${p.first_name} ${p.second_name}\nPoints: ${p.points}`}>
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
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Gameweek: {gameweek}
          </p>
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
    </div>
  );
}