import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MatchFeed() {
  const [matchesData, setMatchesData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/matches');
        setMatchesData(response.data); // ← tvoji podatki (liga + tekme)
      } catch (err) {
        console.error('Napaka pri pridobivanju tekem:', err);
        setError('Napaka pri nalaganju tekem.');
      }
    };

    fetchMatches();
  }, []);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4 text-gray-800">Today's matches</h2>

      {error && <p className="text-red-500">{error}</p>}

      {matchesData.length > 0 ? (
        matchesData.map((league, leagueIdx) => (
          <div key={leagueIdx} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-left text-gray-900">{league.league}</h3>
            <div className="space-y-2">
              {league.matches.map((match, matchIdx) => {
                const isLive = match.status === 'LIVE';
                return (
                  <div
                    key={matchIdx}
                    className={`p-4 rounded-xl shadow-md hover:shadow-xl transition border-2 ${
                      isLive ? 'border-red-500 bg-yellow-200' : 'border-emerald-300 bg-stone-200'
                    } flex items-center justify-between gap-4`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={match.home_crest}
                        alt={match.home_team}
                        className="w-8 h-8 object-contain"
                      />
                      <span className="font-semibold">{match.home_team}</span>
                    </div>

                    <span className="text-gray-700 font-semibold mx-4">vs</span>

                    <div className="flex items-center gap-2">
                      <img
                        src={match.away_crest}
                        alt={match.away_team}
                        className="w-8 h-8 object-contain"
                      />
                      <span className="font-semibold">{match.away_team}</span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {match.score === 'LIVE' ? 'LIVE' : match.score}
                      </p>
                      <p className="text-sm text-gray-500">{match.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <p>Loading matches...</p>
      )}
    </section>
  );
}
