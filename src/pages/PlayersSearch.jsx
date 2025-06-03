import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PlayersSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchMode, setSearchMode] = useState('players'); // 'players' or 'managers'

  // Advanced filters
  const [filters, setFilters] = useState({
    position: 'all',
    nationality: 'all',
    ageRange: 'all',
    sortBy: 'relevance',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // Available filter options (will be populated from search results)
  const [availableFilters, setAvailableFilters] = useState({
    positions: [],
    nationalities: [],
  });

  const ageRanges = [
    { value: 'all', label: 'All Ages' },
    { value: 'young', label: 'Under 25' },
    { value: 'prime', label: '25-30' },
    { value: 'experienced', label: '30+' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'name', label: 'Player Name (A-Z)' },
    { value: 'age', label: 'Age (Youngest First)' },
    { value: 'position', label: 'Position' },
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentPlayerSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = (term) => {
    if (!term.trim()) return;

    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentPlayerSearches', JSON.stringify(updated));
  };

  // Extract available filter options from search results
  useEffect(() => {
    const currentData = searchMode === 'players' ? players : managers;
    if (currentData.length > 0) {
      const positions = [...new Set(currentData.map((p) => p.position).filter(Boolean))].sort();
      const nationalities = [
        ...new Set(currentData.map((p) => p.nationality).filter(Boolean)),
      ].sort();

      setAvailableFilters({
        positions: positions.map((pos) => ({ value: pos, label: pos })),
        nationalities: nationalities.map((nat) => ({ value: nat, label: nat })),
      });
    }
  }, [players, managers, searchMode]);

  // Apply filters and sorting to players/managers
  useEffect(() => {
    const currentData = searchMode === 'players' ? players : managers;
    let filtered = [...currentData];

    // Filter by position
    if (filters.position !== 'all') {
      filtered = filtered.filter((person) => person.position === filters.position);
    }

    // Filter by nationality
    if (filters.nationality !== 'all') {
      filtered = filtered.filter((person) => person.nationality === filters.nationality);
    }

    // Filter by age range (only for players, managers might not have birth dates)
    if (filters.ageRange !== 'all') {
      filtered = filtered.filter((person) => {
        const age = calculateAge(person.dateOfBirth);
        if (!age) return false;

        switch (filters.ageRange) {
          case 'young':
            return age < 25;
          case 'prime':
            return age >= 25 && age <= 30;
          case 'experienced':
            return age > 30;
          default:
            return true;
        }
      });
    }

    // Sort
    switch (filters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'age':
        filtered.sort((a, b) => {
          const ageA = calculateAge(a.dateOfBirth) || 0;
          const ageB = calculateAge(b.dateOfBirth) || 0;
          return ageA - ageB;
        });
        break;
      case 'position':
        filtered.sort((a, b) => (a.position || '').localeCompare(b.position || ''));
        break;
      case 'relevance':
      default:
        break;
    }

    if (searchMode === 'players') {
      setFilteredPlayers(filtered);
    } else {
      setFilteredManagers(filtered);
    }
  }, [players, managers, filters, searchMode]);

  // Restore search state from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    const position = urlParams.get('position');
    const nationality = urlParams.get('nationality');
    const ageRange = urlParams.get('age');
    const sortBy = urlParams.get('sort');

    if (query) {
      setSearchTerm(query);
      performSearch(query);
    }

    if (position || nationality || ageRange || sortBy) {
      setFilters((prev) => ({
        ...prev,
        ...(position && { position }),
        ...(nationality && { nationality }),
        ...(ageRange && { ageRange }),
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
        `http://localhost:5000/api/search/players?q=${encodeURIComponent(query.trim())}`
      );
      const data = await response.json();

      if (response.ok) {
        setPlayers(data.players || []);
        setManagers(data.managers || []);
        saveToRecentSearches(query.trim());
      } else {
        setError(data.error || 'Failed to search players');
        setPlayers([]);
        setManagers([]);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setPlayers([]);
      setManagers([]);
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
    if (filters.position !== 'all') params.set('position', filters.position);
    if (filters.nationality !== 'all') params.set('nationality', filters.nationality);
    if (filters.ageRange !== 'all') params.set('age', filters.ageRange);
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
      const filterMap = {
        position: 'position',
        nationality: 'nationality',
        ageRange: 'age',
        sortBy: 'sort',
      };

      if (value !== 'all' && value !== 'relevance') {
        params.set(filterMap[key], value);
      } else {
        params.delete(filterMap[key]);
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
    localStorage.removeItem('recentPlayerSearches');
  };

  const handlePlayerClick = (playerId) => {
    navigate(`/player/${playerId}`);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getPositionColor = (position) => {
    if (!position) return 'bg-gray-100 text-gray-700';

    const pos = position.toLowerCase();
    if (pos.includes('goalkeeper')) return 'bg-yellow-100 text-yellow-800';
    if (pos.includes('defence') || pos.includes('back')) return 'bg-blue-100 text-blue-800';
    if (pos.includes('midfield')) return 'bg-green-100 text-green-800';
    if (pos.includes('offence') || pos.includes('forward') || pos.includes('winger'))
      return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">👤 Players & Managers Search</h1>
        <p className="text-gray-600">
          Search for football players and managers from major European leagues
        </p>

        {/* Search Mode Toggle */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setSearchMode('players')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              searchMode === 'players'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Players
          </button>
          <button
            onClick={() => setSearchMode('managers')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              searchMode === 'managers'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Managers
          </button>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4 max-w-4xl">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search players... (e.g., Messi, Haaland, Ronaldo)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              disabled={loading}
            />

            {/* Recent Searches Dropdown */}
            {recentSearches.length > 0 && !hasSearched && searchTerm === '' && (
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
            {(filters.position !== 'all' ||
              filters.nationality !== 'all' ||
              filters.ageRange !== 'all' ||
              filters.sortBy !== 'relevance') && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Position Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
              <select
                value={filters.position}
                onChange={(e) => handleFilterChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Positions</option>
                {availableFilters.positions.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nationality Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
              <select
                value={filters.nationality}
                onChange={(e) => handleFilterChange('nationality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Countries</option>
                {availableFilters.nationalities.map((nat) => (
                  <option key={nat.value} value={nat.value}>
                    {nat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
              <select
                value={filters.ageRange}
                onChange={(e) => handleFilterChange('ageRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {ageRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
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
              {searchMode === 'players' ? (
                filteredPlayers.length > 0 ? (
                  <>
                    Found <span className="font-semibold">{filteredPlayers.length}</span>
                    {players.length !== filteredPlayers.length && (
                      <span className="text-gray-500"> of {players.length}</span>
                    )}{' '}
                    players matching "<span className="font-semibold">{searchTerm}</span>"
                  </>
                ) : players.length > 0 ? (
                  <>
                    No players found with current filters for "
                    <span className="font-semibold">{searchTerm}</span>". Try adjusting your
                    filters.
                  </>
                ) : (
                  <>
                    No players found for "<span className="font-semibold">{searchTerm}</span>". Try
                    a different search term.
                  </>
                )
              ) : filteredManagers.length > 0 ? (
                <>
                  Found <span className="font-semibold">{filteredManagers.length}</span>
                  {managers.length !== filteredManagers.length && (
                    <span className="text-gray-500"> of {managers.length}</span>
                  )}{' '}
                  managers matching "<span className="font-semibold">{searchTerm}</span>"
                </>
              ) : managers.length > 0 ? (
                <>
                  No managers found with current filters for "
                  <span className="font-semibold">{searchTerm}</span>". Try adjusting your filters.
                </>
              ) : (
                <>
                  No managers found for "<span className="font-semibold">{searchTerm}</span>". Try a
                  different search term.
                </>
              )}
            </p>

            {/* Active Filters Display */}
            {(filters.position !== 'all' ||
              filters.nationality !== 'all' ||
              filters.ageRange !== 'all' ||
              filters.sortBy !== 'relevance') && (
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-gray-500">Filters:</span>
                {filters.position !== 'all' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {filters.position}
                  </span>
                )}
                {filters.nationality !== 'all' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    {filters.nationality}
                  </span>
                )}
                {filters.ageRange !== 'all' && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    {ageRanges.find((a) => a.value === filters.ageRange)?.label}
                  </span>
                )}
                {filters.sortBy !== 'relevance' && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    {sortOptions.find((s) => s.value === filters.sortBy)?.label}
                  </span>
                )}
                <button
                  onClick={() =>
                    setFilters({
                      position: 'all',
                      nationality: 'all',
                      ageRange: 'all',
                      sortBy: 'relevance',
                    })
                  }
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

      {/* Players/Managers Grid */}
      {((searchMode === 'players' && filteredPlayers.length > 0) ||
        (searchMode === 'managers' && filteredManagers.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(searchMode === 'players' ? filteredPlayers : filteredManagers).map((person) => (
            <div
              key={person.id}
              onClick={() => (searchMode === 'players' ? handlePlayerClick(person.id) : null)}
              className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all group ${
                searchMode === 'players' ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Person Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                  {person.shirtNumber ? (
                    <span className="font-semibold">{person.shirtNumber}</span>
                  ) : searchMode === 'managers' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6"
                      />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-lg font-semibold text-gray-900 transition-colors ${
                      searchMode === 'players' ? 'group-hover:text-blue-600' : ''
                    }`}
                  >
                    {person.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {person.position && (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getPositionColor(
                          person.position
                        )}`}
                      >
                        {person.position}
                      </span>
                    )}
                    {person.nationality && (
                      <span className="text-xs text-gray-500">{person.nationality}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Person Info */}
              <div className="space-y-3">
                {/* Current Team */}
                {person.team && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {person.team.crest && (
                      <img
                        src={person.team.crest}
                        alt={`${person.team.name} logo`}
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{person.team.name}</p>
                      <p className="text-xs text-gray-500">Current Club</p>
                    </div>
                  </div>
                )}

                {/* Person Details */}
                <div className="space-y-2 text-sm">
                  {person.dateOfBirth && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Age: {calculateAge(person.dateOfBirth)}</span>
                    </div>
                  )}

                  {person.nationality && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                        />
                      </svg>
                      <span>{person.nationality}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Click hint - only for players */}
              {searchMode === 'players' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                    Click to view player details →
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Searching players...</p>
            <p className="text-sm text-gray-500 mt-1">This might take a moment...</p>
          </div>
        </div>
      )}

      {/* Empty State (when no search performed yet) */}
      {!hasSearched && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">{searchMode === 'players' ? '👤' : '👨‍💼'}</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchMode === 'players'
              ? 'Search for Football Players'
              : 'Search for Football Managers'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {searchMode === 'players'
              ? 'Find your favorite football players from major European leagues. Search by name, and discover players from Premier League, La Liga, Bundesliga, Serie A, and Ligue 1.'
              : 'Find football managers and coaches from major European leagues. Search by name to discover managers from top clubs.'}
          </p>

          {/* Popular Search Suggestions */}
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-gray-400 mb-3">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {(searchMode === 'players'
                ? [
                    'Erling Haaland',
                    'Kylian Mbappé',
                    'Lionel Messi',
                    'Cristiano Ronaldo',
                    'Kevin De Bruyne',
                    'Vinicius Jr',
                    'Pedri',
                    'Bukayo Saka',
                  ]
                : [
                    'Pep Guardiola',
                    'Carlo Ancelotti',
                    'Jürgen Klopp',
                    'Mikel Arteta',
                    'Antonio Conte',
                    'Thomas Tuchel',
                    'Xavi',
                    'Erik ten Hag',
                  ]
              ).map((suggestion) => (
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
            <p>
              💡 Tip: {searchMode === 'players' ? 'Player' : 'Manager'} search might take longer as
              we search through multiple team squads
            </p>
            {searchMode === 'players' && (
              <p className="mt-1">
                🔍 Use filters to narrow results by position, nationality, or age
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
