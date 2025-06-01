import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useFavorites } from '../../hooks/useFavorites';

export default function MatchFeed() {
  const [matchesData, setMatchesData] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMatchFavorited, toggleMatchFavorite, loading: favoritesLoading } = useFavorites();

  // Get initial values from URL params or use defaults
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  );
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'all');
  const [selectedLeague, setSelectedLeague] = useState(searchParams.get('league') || 'all');

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

  // Separate useEffect for auto-refresh to avoid infinite loops
  useEffect(() => {
    if (!matchesData.length) return; // Don't set up refresh until we have initial data

    // Determine if we have any live matches for smart refresh
    const hasLiveMatches = () => {
      return matchesData.some((country) =>
        country.leagues.some((league) =>
          league.matches.some((match) => match.status === 'IN_PLAY' || match.status === 'PAUSED')
        )
      );
    };

    // Check if selected date is today
    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    // Set refresh interval based on match status
    const getRefreshInterval = () => {
      if (hasLiveMatches()) {
        return 30000; // 30 seconds when there are live matches
      }
      if (isToday) {
        return 2 * 60 * 1000; // 2 minutes for today's matches (in case matches start)
      }
      return 5 * 60 * 1000; // 5 minutes for other dates
    };

    // Only set up auto-refresh if we need it
    const needsRefresh = hasLiveMatches() || isToday;

    if (!needsRefresh) {
      return; // No refresh needed for old dates without live matches
    }

    const fetchUpdates = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:5000/matches${selectedDate ? `?date=${selectedDate}` : ''}`
        );

        setMatchesData(response.data);
        setError('');
      } catch (err) {
        console.error('Error updating matches:', err);
      }
    };

    // Set up the interval
    const interval = setInterval(fetchUpdates, getRefreshInterval());

    // Clean up interval on unmount or when dependencies change
    return () => clearInterval(interval);
  }, [matchesData, selectedDate]);

  // Update URL params whenever filters change
  useEffect(() => {
    const params = new URLSearchParams();

    // Only add non-default values to keep URL clean
    if (selectedDate !== new Date().toISOString().split('T')[0]) {
      params.set('date', selectedDate);
    }
    if (selectedCountry !== 'all') {
      params.set('country', selectedCountry);
    }
    if (selectedLeague !== 'all') {
      params.set('league', selectedLeague);
    }

    // Update URL without causing a page reload
    setSearchParams(params, { replace: true });
  }, [selectedDate, selectedCountry, selectedLeague, setSearchParams]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
    setSelectedLeague('all'); // Reset league when country changes
  };

  const handleLeagueChange = (event) => {
    setSelectedLeague(event.target.value);
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
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
    <div className="animate-pulse space-y-6">
      {[1, 2, 3].map((country) => (
        <div key={country} className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-5 bg-gray-200 rounded"></div>
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4">
            {[1, 2].map((league) => (
              <div key={league} className="ml-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="h-5 w-36 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  {[1, 2].map((match) => (
                    <div key={match} className="h-16 bg-gray-100 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state component
  const EmptyState = () => {
    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Matches Found</h3>
        <p className="text-gray-500 mb-6">
          {isToday
            ? 'There are no matches scheduled for today.'
            : 'There are no matches scheduled for the selected date.'}
        </p>
        {!isToday && (
          <button
            onClick={handleTodayClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Today's Matches
          </button>
        )}
      </div>
    );
  };

  // Handle favorite toggle for matches
  const handleMatchFavorite = async (e, match, leagueInfo) => {
    e.preventDefault();
    e.stopPropagation();

    const matchData = {
      id: match.match_id,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      homeCrest: match.home_crest,
      awayCrest: match.away_crest,
      date: match.date,
      status: match.status,
      score: match.score,
      competition: leagueInfo ? leagueInfo.league : 'Competition TBD',
    };

    await toggleMatchFavorite(matchData);
  };

  return (
    <section className="max-w-7xl mx-auto">
      {/* Filters Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedDate === new Date().toISOString().split('T')[0]
                ? "Today's Matches"
                : 'Match Schedule'}
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleTodayClick}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Today
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="country-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Country
              </label>
              <select
                id="country-select"
                value={selectedCountry}
                onChange={handleCountryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country === 'all' ? 'All Countries' : country}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="league-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                League
              </label>
              <select
                id="league-select"
                value={selectedLeague}
                onChange={handleLeagueChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : filteredMatches.length > 0 ? (
        <div className="space-y-6">
          {filteredMatches.map((countryData, countryIdx) => (
            <div key={countryIdx} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Country Header */}
              {selectedCountry === 'all' && (
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {countryData.flag && (
                      <img
                        src={countryData.flag}
                        alt={`${countryData.country} flag`}
                        className="w-8 h-5 object-contain"
                      />
                    )}
                    <h2 className="text-xl font-semibold text-gray-900">{countryData.country}</h2>
                  </div>
                </div>
              )}

              {/* Leagues */}
              <div className="divide-y divide-gray-100">
                {countryData.leagues.map((leagueData, leagueIdx) => (
                  <div key={leagueIdx} className="p-6">
                    {/* League Header */}
                    {selectedLeague === 'all' && (
                      <div
                        onClick={() => {
                          if (leagueData.code) {
                            navigate(`/competition/${leagueData.code}`);
                          }
                        }}
                        className={`flex items-center gap-3 mb-4 ${
                          leagueData.code ? 'cursor-pointer hover:text-blue-600' : ''
                        }`}
                      >
                        {leagueData.emblem && (
                          <img
                            src={leagueData.emblem}
                            alt={`${leagueData.league} emblem`}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <h3 className="text-lg font-semibold">{leagueData.league}</h3>
                      </div>
                    )}

                    {/* Matches */}
                    <div className="space-y-3">
                      {leagueData.matches.map((match, matchIdx) => (
                        <div
                          key={matchIdx}
                          onClick={() => navigate(`/match/${match.match_id}`)}
                          className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-4 cursor-pointer transition-all duration-200 relative"
                        >
                          {/* Favorite Star */}
                          <button
                            onClick={(e) => handleMatchFavorite(e, match, leagueData)}
                            disabled={favoritesLoading}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors z-10"
                            title={
                              isMatchFavorited(match.match_id)
                                ? 'Remove from favorites'
                                : 'Add to favorites'
                            }
                          >
                            <svg
                              className={`w-5 h-5 ${
                                isMatchFavorited(match.match_id)
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                              fill={isMatchFavorited(match.match_id) ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                          </button>

                          <div className="grid grid-cols-7 items-center gap-4 pr-8">
                            {/* Home Team */}
                            <div className="col-span-3 flex items-center justify-end gap-3">
                              <span className="font-medium text-right">{match.home_team}</span>
                              <img
                                src={match.home_crest}
                                alt={match.home_team}
                                className="w-8 h-8 object-contain"
                              />
                            </div>

                            {/* Score/Time */}
                            <div className="col-span-1">
                              <div className="flex flex-col items-center">
                                <span
                                  className={`font-bold ${
                                    match.status === 'LIVE'
                                      ? 'text-green-600'
                                      : match.status === 'Finished'
                                      ? 'text-gray-900'
                                      : 'text-blue-600'
                                  }`}
                                >
                                  {match.status === 'Scheduled' ? '-:-' : match.score}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {match.status === 'Scheduled'
                                    ? match.date.split(' at ')[1]
                                    : match.status}
                                </span>
                              </div>
                            </div>

                            {/* Away Team */}
                            <div className="col-span-3 flex items-center gap-3">
                              <img
                                src={match.away_crest}
                                alt={match.away_team}
                                className="w-8 h-8 object-contain"
                              />
                              <span className="font-medium">{match.away_team}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
