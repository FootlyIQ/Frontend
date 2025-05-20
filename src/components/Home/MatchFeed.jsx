import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function MatchFeed() {
  const [matchesData, setMatchesData] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/matches');
        setMatchesData(response.data);
      } catch (err) {
        console.error('Napaka pri pridobivanju tekem:', err);
        setError('Napaka pri nalaganju tekem.');
      }
    };

    fetchMatches();
  }, []);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4 text-gray-800">Današnje tekme</h2>
      {error && <p className="text-red-500">{error}</p>}
      {matchesData.length > 0 ? (
        matchesData.map((countryData, countryIdx) => (
          <div key={countryIdx} className="mb-10">
            {/* država + zastava */}
            <div className="flex items-center gap-2 mb-3">
              {countryData.flag && (
                <img
                  src={countryData.flag}
                  alt={`${countryData.country} flag`}
                  className="w-8 h-5 object-contain"
                />
              )}
              <h2 className="text-2xl font-bold text-blue-900">{countryData.country}</h2>
            </div>

            {/* lige */}
            {countryData.leagues.map((leagueData, leagueIdx) => (
              <div key={leagueIdx} className="mb-6 ml-6">
                <div className="flex items-center gap-2 mb-2">
                  {leagueData.emblem && (
                    <img
                      src={leagueData.emblem}
                      alt={`${leagueData.league} emblem`}
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{leagueData.league}</h3>
                </div>

                <div className="space-y-2">
                  {leagueData.matches.map((match, matchIdx) => {
                    return (
                      <div
                        key={matchIdx}
                        onClick={() => navigate(`/match/${match.match_id}`)}
                        className="p-4 rounded-xl shadow-md hover:shadow-xl transition border border-gray-300 bg-white cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-2">
                          {match.home_crest && (
                            <img
                              src={match.home_crest}
                              alt={match.home_team}
                              className="w-8 h-8 object-contain"
                            />
                          )}
                          <span className="font-semibold">{match.home_team}</span>
                        </div>

                        <span className="text-gray-700 font-semibold mx-4">vs</span>

                        <div className="flex items-center gap-2">
                          {match.away_crest && (
                            <img
                              src={match.away_crest}
                              alt={match.away_team}
                              className="w-8 h-8 object-contain"
                            />
                          )}
                          <span className="font-semibold">{match.away_team}</span>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-600 font-semibold">{match.status}</p>
                          {(match.status === 'LIVE' ||
                            match.status === 'Half Time' ||
                            match.status === 'Finished') && (
                            <p className="text-lg font-bold">{match.score}</p>
                          )}
                          {match.status === 'Scheduled' && (
                            <p className="text-sm text-gray-700">{match.date}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>Loading matches...</p>
      )}
    </section>
  );
}
