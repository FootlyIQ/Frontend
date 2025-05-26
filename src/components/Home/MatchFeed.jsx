import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function MatchFeed() {
  const [matchesData, setMatchesData] = useState([]);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `http://127.0.0.1:5000/matches${selectedDate ? `?date=${selectedDate}` : ''}`
        );
        setMatchesData(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError('Error loading matches.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [selectedDate]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  // Get unique countries for the dropdown
  const countries = ['all', ...new Set(matchesData.map((country) => country.country))];

  // Get leagues for the selected country
  const leagues =
    selectedCountry === 'all'
      ? [
          'all',
          ...new Set(
            matchesData.flatMap((country) => country.leagues.map((league) => league.league))
          ),
        ]
      : [
          'all',
          ...new Set(
            matchesData
              .find((country) => country.country === selectedCountry)
              ?.leagues.map((league) => league.league) || []
          ),
        ];

  // Filter matches based on selection
  const filteredMatches = matchesData
    .filter((country) => selectedCountry === 'all' || country.country === selectedCountry)
    .map((country) => ({
      ...country,
      leagues: country.leagues.filter(
        (league) => selectedLeague === 'all' || league.league === selectedLeague
      ),
    }))
    .filter((country) => country.leagues.length > 0);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      {[1, 2, 3].map((country) => (
        <div key={country} className="mb-6">
          <div className="flex items-center gap-2 mb-3 bg-gray-50 p-3 rounded-lg">
            <div className="w-8 h-5 bg-gray-200 rounded"></div>
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
          </div>

          {[1, 2].map((league) => (
            <div key={league} className="mb-6 ml-6">
              <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-lg">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="h-6 w-36 bg-gray-200 rounded"></div>
              </div>

              {[1, 2, 3].map((match) => (
                <div key={match} className="p-4 mb-2 rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-8 bg-gray-200 rounded"></div>
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <section>
      <div className="flex flex-col gap-4 mb-6">
        {/* Date and Filters Row */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-800">
            {selectedDate === new Date().toISOString().split('T')[0]
              ? "Today's Matches"
              : 'Selected Matches'}
          </h2>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <label htmlFor="date-picker" className="text-gray-700">
                Choose date:
              </label>
              <input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Country Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="country-select" className="text-gray-700">
                Country:
              </label>
              <select
                id="country-select"
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedLeague('all'); // Reset league when country changes
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country === 'all' ? 'All Countries' : country}
                  </option>
                ))}
              </select>
            </div>

            {/* League Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="league-select" className="text-gray-700">
                League:
              </label>
              <select
                id="league-select"
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {leagues.map((league) => (
                  <option key={league} value={league}>
                    {league === 'all' ? 'All Leagues' : league}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredMatches.length > 0 ? (
        filteredMatches.map((countryData, countryIdx) => (
          <div key={countryIdx} className="mb-6">
            {/* Show country header only if viewing all countries */}
            {selectedCountry === 'all' && (
              <div className="flex items-center gap-2 mb-3 bg-gray-50 p-3 rounded-lg">
                {countryData.flag && (
                  <img
                    src={countryData.flag}
                    alt={`${countryData.country} flag`}
                    className="w-8 h-5 object-contain"
                  />
                )}
                <h2 className="text-xl font-bold text-blue-900">{countryData.country}</h2>
              </div>
            )}

            {/* Leagues */}
            {countryData.leagues.map((leagueData, leagueIdx) => (
              <div key={leagueIdx} className="mb-6 ml-6">
                {/* Show league header only if viewing all leagues */}
                {selectedLeague === 'all' && (
                  <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-lg">
                    {leagueData.emblem && (
                      <img
                        src={leagueData.emblem}
                        alt={`${leagueData.league} emblem`}
                        className="w-6 h-6 object-contain"
                      />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{leagueData.league}</h3>
                  </div>
                )}

                <div className="space-y-2">
                  {leagueData.matches.map((match, matchIdx) => (
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p className="text-gray-600">No matches found for the selected date.</p>
      )}
    </section>
  );
}
