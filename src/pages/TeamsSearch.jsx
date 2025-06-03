import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TeamsSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Advanced filters
  const [filters, setFilters] = useState({
    league: 'all',
    sortBy: 'relevance',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // Available leagues from our search
  const leagues = [
    { value: 'all', label: 'All Leagues' },
    { value: 'Premier League', label: 'Premier League', apiName: 'Premier League' },
    { value: 'Primera División', label: 'La Liga', apiName: 'Primera División' },
    { value: 'Bundesliga', label: 'Bundesliga', apiName: 'Bundesliga' },
    { value: 'Serie A', label: 'Serie A', apiName: 'Serie A' },
    { value: 'Ligue 1', label: 'Ligue 1', apiName: 'Ligue 1' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'name', label: 'Team Name (A-Z)' },
    { value: 'league', label: 'League' },
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentTeamSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = (term) => {
    if (!term.trim()) return;

    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentTeamSearches', JSON.stringify(updated));
  };

  // Apply filters and sorting to teams
  useEffect(() => {
    let filtered = [...teams];

    // Filter by league
    if (filters.league !== 'all') {
      filtered = filtered.filter((team) => {
        const competition = (team.competition || '').toLowerCase();
        const filterLeague = filters.league.toLowerCase();

        // Direct match
        if (competition.includes(filterLeague.toLowerCase())) {
          return true;
        }

        // Special handling for La Liga / Primera División
        if (filters.league === 'Primera División') {
          const isLaLiga =
            competition.includes('primera') ||
            competition.includes('la liga') ||
            competition.includes('laliga') ||
            competition === 'pd';
          if (isLaLiga) {
            return true;
          }
        }

        // Special handling for other leagues
        if (filters.league === 'Premier League' && competition.includes('premier')) return true;
        if (filters.league === 'Bundesliga' && competition.includes('bundesliga')) return true;
        if (filters.league === 'Serie A' && competition.includes('serie')) return true;
        if (filters.league === 'Ligue 1' && competition.includes('ligue')) return true;

        return false;
      });
    }

    // Sort teams
    switch (filters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'league':
        filtered.sort((a, b) => (a.competition || '').localeCompare(b.competition || ''));
        break;
      case 'relevance':
      default:
        // Keep original relevance-based order from API
        break;
    }

    setFilteredTeams(filtered);
  }, [teams, filters]);

  // Restore search state from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    const league = urlParams.get('league');
    const sortBy = urlParams.get('sort');

    if (query) {
      setSearchTerm(query);
      performSearch(query);
    }

    if (league || sortBy) {
      setFilters((prev) => ({
        ...prev,
        ...(league && { league }),
        ...(sortBy && { sortBy }),
      }));
    }
  }, [location.search]);

  const performSearch = async (query) => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/search/teams?q=${encodeURIComponent(query.trim())}`
      );
      const data = await response.json();

      if (response.ok) {
        setTeams(data.teams || []);
        saveToRecentSearches(query.trim());
      } else {
        setError(data.error || 'Failed to search teams');
        setTeams([]);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Update URL with search parameter and filters
    const params = new URLSearchParams();
    params.set('q', searchTerm.trim());
    if (filters.league !== 'all') params.set('league', filters.league);
    if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);

    const newUrl = `${location.pathname}?${params.toString()}`;
    window.history.pushState(null, '', newUrl);

    await performSearch(searchTerm);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    // Update URL with new filters
    if (hasSearched) {
      const params = new URLSearchParams(location.search);
      if (key === 'league' && value !== 'all') {
        params.set('league', value);
      } else if (key === 'league' && value === 'all') {
        params.delete('league');
      }

      if (key === 'sortBy' && value !== 'relevance') {
        params.set('sort', value);
      } else if (key === 'sortBy' && value === 'relevance') {
        params.delete('sort');
      }

      const newUrl = `${location.pathname}?${params.toString()}`;
      window.history.pushState(null, '', newUrl);
    }
  };

  const handleRecentSearchClick = (term) => {
    setSearchTerm(term);
    performSearch(term);

    const params = new URLSearchParams();
    params.set('q', term);
    const newUrl = `${location.pathname}?${params.toString()}`;
    window.history.pushState(null, '', newUrl);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentTeamSearches');
  };

  const handleTeamClick = (teamId) => {
    navigate(`/team/${teamId}`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏟️ Teams Search</h1>
        <p className="text-gray-600">Search for football clubs from major European leagues</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4 max-w-4xl">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search teams... (e.g., Arsenal, Real Madrid, Bayern)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              disabled={loading}
            />

            {/* Recent Searches Dropdown */}
            {recentSearches.length > 0 && !hasSearched && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Recent Searches</span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleRecentSearchClick(term)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {term}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg transition-colors flex items-center gap-2 ${
              showFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
            {(filters.league !== 'all' || filters.sortBy !== 'relevance') && (
              <span className="bg-blue-500 text-white text-xs rounded-full w-2 h-2"></span>
            )}
          </button>

          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </div>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* League Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">League</label>
              <select
                value={filters.league}
                onChange={(e) => handleFilterChange('league', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {leagues.map((league) => (
                  <option key={league.value} value={league.value}>
                    {league.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {hasSearched && !loading && !error && (
        <div className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-gray-600">
              {filteredTeams.length > 0 ? (
                <>
                  Found <span className="font-semibold">{filteredTeams.length}</span>
                  {teams.length !== filteredTeams.length && (
                    <span className="text-gray-500"> of {teams.length}</span>
                  )}{' '}
                  teams matching "<span className="font-semibold">{searchTerm}</span>"
                </>
              ) : teams.length > 0 ? (
                <>
                  No teams found with current filters for "
                  <span className="font-semibold">{searchTerm}</span>". Try adjusting your filters.
                </>
              ) : (
                <>
                  No teams found for "<span className="font-semibold">{searchTerm}</span>". Try a
                  different search term.
                </>
              )}
            </p>

            {/* Active Filters Display */}
            {(filters.league !== 'all' || filters.sortBy !== 'relevance') && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Filters:</span>
                {filters.league !== 'all' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {leagues.find((l) => l.value === filters.league)?.label}
                  </span>
                )}
                {filters.sortBy !== 'relevance' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    {sortOptions.find((s) => s.value === filters.sortBy)?.label}
                  </span>
                )}
                <button
                  onClick={() => setFilters({ league: 'all', sortBy: 'relevance' })}
                  className="text-gray-400 hover:text-gray-600 ml-1"
                  title="Clear filters"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teams Grid */}
      {filteredTeams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              onClick={() => handleTeamClick(team.id)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
            >
              {/* Team Header */}
              <div className="flex items-center gap-4 mb-4">
                {team.crest && (
                  <img
                    src={team.crest}
                    alt={`${team.name} logo`}
                    className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {team.name}
                  </h3>
                  {team.shortName && team.shortName !== team.name && (
                    <p className="text-sm text-gray-500">{team.shortName}</p>
                  )}
                </div>
              </div>

              {/* Team Info */}
              <div className="space-y-2 text-sm">
                {team.area && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>
                      {typeof team.area === 'string' ? team.area : team.area?.name || 'Unknown'}
                    </span>
                  </div>
                )}
                {team.competition && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>
                      {typeof team.competition === 'string'
                        ? team.competition
                        : team.competition?.name || 'Unknown'}
                    </span>
                  </div>
                )}
                {team.tla && (
                  <div className="inline-block bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700">
                    {team.tla}
                  </div>
                )}
              </div>

              {/* Click hint */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                  Click to view team details →
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Searching teams...</p>
          </div>
        </div>
      )}

      {/* Empty State (when no search performed yet) */}
      {!hasSearched && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏟️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Search for Football Teams</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Find your favorite football teams from major European leagues. Search by name, and
            discover teams from Premier League, La Liga, Bundesliga, Serie A, and Ligue 1.
          </p>

          {/* Popular Search Suggestions */}
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-gray-400 mb-3">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Manchester United',
                'Real Madrid',
                'Barcelona',
                'Bayern Munich',
                'Arsenal',
                'Chelsea',
                'Liverpool',
                'PSG',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setSearchTerm(suggestion);
                    performSearch(suggestion);
                    const params = new URLSearchParams();
                    params.set('q', suggestion);
                    const newUrl = `${location.pathname}?${params.toString()}`;
                    window.history.pushState(null, '', newUrl);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-400">
            <p>💡 Tip: Use filters to narrow down your search by league or sort results</p>
          </div>
        </div>
      )}
    </div>
  );
}
