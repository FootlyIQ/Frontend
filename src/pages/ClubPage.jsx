import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';

function ClubPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { isClubFavorited, toggleClubFavorite, loading: favoritesLoading } = useFavorites();

  const [fixtures, setFixtures] = useState([]);
  const [squad, setSquad] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [teamCrest, setTeamCrest] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fixtures');

  // New state for filters
  const [filters, setFilters] = useState({ seasons: [], competitions: [] });
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  // Handle favorite toggle for club
  const handleClubFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const clubData = {
      id: teamId,
      name: teamName,
      crest: teamCrest,
    };

    await toggleClubFavorite(clubData);
  };

  // Fetch filters when component mounts
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch(`https://footlyiq-backend.onrender.com/team-filters/${teamId}`);
        if (!response.ok) {
          throw new Error('Error loading filters');
        }
        const data = await response.json();

        // Remove duplicate seasons by comparing stringified objects
        const uniqueSeasons = data.seasons.filter(
          (season, index, self) =>
            index ===
            self.findIndex((s) => s.startDate === season.startDate && s.endDate === season.endDate)
        );

        setFilters({
          ...data,
          seasons: uniqueSeasons,
        });

        // Set default selections and fetch data with these defaults
        if (uniqueSeasons.length > 0 && data.competitions.length > 0) {
          const defaultSeason = uniqueSeasons[0].year;
          const defaultCompetition = data.competitions[0].id;

          setSelectedSeason(defaultSeason);
          setSelectedCompetition(defaultCompetition);

          // Fetch matches with default filters
          fetchMatchesWithFilters(defaultSeason, defaultCompetition);
        }
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };
    fetchFilters();
  }, [teamId]);

  // Separate function to fetch matches with filters
  const fetchMatchesWithFilters = async (season, competition) => {
    try {
      let matchesUrl = `https://footlyiq-backend.onrender.com/team-matches/${teamId}`;
      const params = new URLSearchParams();

      if (season) {
        params.append('season', season.split('/')[0]); // Use first year of season
      }
      if (competition) {
        params.append('competition', competition);
      }
      if (params.toString()) {
        matchesUrl += `?${params.toString()}`;
      }

      const resMatches = await fetch(matchesUrl);
      if (!resMatches.ok) {
        throw new Error('Error loading matches');
      }
      const matchesData = await resMatches.json();
      setFixtures(matchesData);
    } catch (err) {
      setError(err.message);
      setFixtures([]);
    }
  };

  // Modified useEffect for fetching matches when filters change
  useEffect(() => {
    if (selectedSeason && selectedCompetition) {
      setLoading(true);
      fetchMatchesWithFilters(selectedSeason, selectedCompetition).finally(() => setLoading(false));
    }
  }, [selectedSeason, selectedCompetition]);

  // Separate useEffect for fetching squad data
  useEffect(() => {
    const fetchSquadData = async () => {
      try {
        const resSquad = await fetch(`https://footlyiq-backend.onrender.com/team-squad/${teamId}`);
        if (!resSquad.ok) {
          throw new Error('Error loading squad');
        }
        const squadData = await resSquad.json();
        setSquad(squadData.squad);
        setTeamName(squadData.team);
        setTeamCrest(squadData.crest);
        setError('');
      } catch (err) {
        setError(err.message);
        setSquad([]);
        setTeamName('');
        setTeamCrest('');
      }
    };

    fetchSquadData();
  }, [teamId]);

  // Helper function to format stage string nicely: "REGULAR_SEASON" -> "Regular Season"
  const formatStage = (stage) => {
    if (!stage) return '';
    return stage
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Style objects for tabs (buttons)
  const tabButtonStyle = {
    flex: 1,
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  };

  const activeStyle = {
    backgroundColor: '#0056b3',
    color: '#fff',
    boxShadow: '0 6px 10px rgba(0,86,179,0.4)',
  };

  const inactiveStyle = {
    backgroundColor: '#e0e0e0',
    color: '#333',
  };

  return (
    <div
      style={{
        margin: '2rem auto',
        padding: '1rem',
        fontFamily: 'Arial, sans-serif',
        width: '100%',
        maxWidth: '1200px', // ali več, po potrebi
        boxSizing: 'border-box',
      }}
    >
      <div className="p-4">
        {/* Team Header */}
        <div className="flex items-center gap-4 mb-8">
          {teamCrest && (
            <img src={teamCrest} alt={`${teamName} logo`} className="h-16 w-auto object-contain" />
          )}
          <h1 className="text-2xl font-bold text-gray-900">{teamName || `Club ${teamId}`}</h1>

          {/* Favorite Star */}
          {teamName && (
            <button
              onClick={handleClubFavorite}
              disabled={favoritesLoading}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              title={isClubFavorited(teamId) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className={`w-6 h-6 ${
                  isClubFavorited(teamId)
                    ? 'text-yellow-500 fill-current'
                    : 'text-gray-400 hover:text-yellow-500'
                }`}
                fill={isClubFavorited(teamId) ? 'currentColor' : 'none'}
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
          )}
        </div>

        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : error ? (
          <div className="text-red-500 text-center p-4">
            <p>❌ {error}</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('fixtures')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'fixtures'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Fixtures & Results
                  </button>
                  <button
                    onClick={() => setActiveTab('squad')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'squad'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Team Squad
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab content */}
            <div className="bg-white p-6 rounded-lg shadow">
              {activeTab === 'fixtures' ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <select
                      value={selectedSeason || ''}
                      onChange={(e) => setSelectedSeason(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: '1px solid #ccc',
                        minWidth: '150px',
                      }}
                    >
                      {/* Filter unique seasons by year */}
                      {Array.from(new Set(filters.seasons.map((season) => season.year))).map(
                        (year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      )}
                    </select>

                    <select
                      value={selectedCompetition || ''}
                      onChange={(e) => setSelectedCompetition(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: '1px solid #ccc',
                        minWidth: '200px',
                      }}
                    >
                      {filters.competitions.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <h3 style={{ marginBottom: '1rem' }}>Matches</h3>
                  {fixtures.length > 0 ? (
                    <div className="space-y-3">
                      {fixtures.map((match, idx) => (
                        <div
                          key={idx}
                          onClick={() => navigate(`/match/${match.match_id}`)}
                          className="bg-white p-4 border rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                        >
                          <div className="grid grid-cols-12 items-center gap-4">
                            {/* Competition Info */}
                            <div
                              className="col-span-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (match.competition_code) {
                                  navigate(`/competition/${match.competition_code}`);
                                }
                              }}
                              title={`View ${match.competition_name} details`}
                            >
                              <img
                                src={match.competition_logo}
                                alt={match.competition_name}
                                className="w-8 h-8 object-contain"
                              />
                              <span className="font-medium text-gray-700 truncate">
                                {match.competition_name}
                              </span>
                            </div>

                            {/* Teams and Score */}
                            <div className="col-span-6 grid grid-cols-7 items-center gap-2">
                              {/* Home Team */}
                              <div className="col-span-3 flex items-center justify-end gap-2">
                                <span className="font-medium text-right">{match.home_team}</span>
                                <img
                                  src={match.home_crest}
                                  alt={match.home_team}
                                  className="w-6 h-6 object-contain"
                                />
                              </div>

                              {/* Score */}
                              <div className="col-span-1 text-center font-bold px-2">
                                {match.score}
                              </div>

                              {/* Away Team */}
                              <div className="col-span-3 flex items-center justify-start gap-2">
                                <img
                                  src={match.away_crest}
                                  alt={match.away_team}
                                  className="w-6 h-6 object-contain"
                                />
                                <span className="font-medium text-left">{match.away_team}</span>
                              </div>
                            </div>

                            {/* Match Info */}
                            <div className="col-span-3 text-right space-y-1">
                              {/* Matchday Info */}
                              <div className="text-sm text-gray-600">
                                {match.matchday && (
                                  <span className="font-medium">
                                    Matchday {match.matchday}
                                    {match.stage && match.stage !== 'REGULAR_SEASON' && (
                                      <span className="text-gray-500 ml-1">
                                        • {formatStage(match.stage)}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                              {/* Date */}
                              <div className="text-sm text-gray-600">{match.date}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">No matches available.</p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-6">Squad Members</h3>
                  {squad.length > 0 ? (
                    <div className="space-y-8">
                      {/* Manager section */}
                      {squad
                        .filter((player) => player.position === 'Manager')
                        .map((player, idx) => (
                          <div
                            key={`coach-${idx}`}
                            className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg shadow-sm border border-blue-100"
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-xl font-bold text-gray-900">
                                  {player.name}
                                </span>
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                  Head Coach
                                </span>
                              </div>
                              <span className="text-gray-600">
                                <span className="font-medium">Nationality:</span>{' '}
                                {player.nationality}
                              </span>
                            </div>
                          </div>
                        ))}

                      {/* Players sections */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Goalkeepers */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM6.5 9.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z" />
                            </svg>
                            Goalkeepers
                          </h4>
                          <div className="space-y-3">
                            {squad
                              .filter((player) => player.position === 'Goalkeeper')
                              .map((player, idx) => (
                                <PlayerCard key={`gk-${idx}`} player={player} navigate={navigate} />
                              ))}
                          </div>
                        </div>

                        {/* Defenders */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path
                                fillRule="evenodd"
                                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Defenders
                          </h4>
                          <div className="space-y-3">
                            {squad
                              .filter((player) =>
                                ['Defence', 'Centre-Back', 'Left-Back', 'Right-Back'].includes(
                                  player.position
                                )
                              )
                              .map((player, idx) => (
                                <PlayerCard
                                  key={`def-${idx}`}
                                  player={player}
                                  navigate={navigate}
                                />
                              ))}
                          </div>
                        </div>

                        {/* Midfielders */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-green-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Midfielders
                          </h4>
                          <div className="space-y-3">
                            {squad
                              .filter((player) =>
                                [
                                  'Midfield',
                                  'Central Midfield',
                                  'Defensive Midfield',
                                  'Attacking Midfield',
                                ].includes(player.position)
                              )
                              .map((player, idx) => (
                                <PlayerCard
                                  key={`mid-${idx}`}
                                  player={player}
                                  navigate={navigate}
                                />
                              ))}
                          </div>
                        </div>

                        {/* Forwards */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-red-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Forwards
                          </h4>
                          <div className="space-y-3">
                            {squad
                              .filter((player) =>
                                [
                                  'Offence',
                                  'Centre-Forward',
                                  'Left Winger',
                                  'Right Winger',
                                ].includes(player.position)
                              )
                              .map((player, idx) => (
                                <PlayerCard
                                  key={`att-${idx}`}
                                  player={player}
                                  navigate={navigate}
                                />
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">No squad data available.</p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const PlayerCard = ({ player, navigate }) => (
  <div className="group relative bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-200">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h5 className="font-semibold text-gray-900 group-hover:text-blue-600">{player.name}</h5>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Position:</span> {player.position}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Nationality:</span> {player.nationality}
        </p>
      </div>
      {player.id && (
        <button
          onClick={() => navigate(`/player/${player.id}`)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          View Profile
        </button>
      )}
    </div>
  </div>
);

export default ClubPage;
