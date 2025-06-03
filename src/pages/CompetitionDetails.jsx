import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CompetitionDetails() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('standings');
  const [selectedSeason, setSelectedSeason] = useState(2024); // Default to 2024/2025 season

  useEffect(() => {
    const fetchCompetitionDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://footlyiq-backend.onrender.com/competition/${code}${selectedSeason ? `?season=${selectedSeason}` : ''}`
        );
        setData(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching competition details:', err);
        if (err.response?.status === 404) {
          setError('This competition is not available in the current API package.');
        } else {
          setError(err.response?.data?.message || 'Error loading competition details.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitionDetails();
  }, [code, selectedSeason]);

  if (isLoading) {
    return (
      <div className="animate-pulse p-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-4 text-red-500">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Competition Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { competition, standings, scorers, matches } = data;

  // Sort matches by date (newest first) if available
  const sortedMatches =
    matches?.matches?.length > 0
      ? [...matches.matches].sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      : [];

  // Use available seasons directly from the API response (already filtered in backend)
  const availableSeasons = matches?.availableSeasons || [];

  return (
    <div className="p-4">
      {/* Competition Header */}
      <div className="flex items-center gap-4 mb-8">
        {competition.emblem && (
          <img
            src={competition.emblem}
            alt={competition.name}
            className="w-16 h-16 object-contain"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{competition.name}</h1>
          <div className="flex items-center gap-2 text-gray-600">
            <img
              src={competition.area.flag}
              alt={competition.area.name}
              className="w-5 h-4 object-contain"
            />
            <span>{competition.area.name}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('standings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'standings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Standings & Stats
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'matches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Season Matches
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'standings' ? (
        // Standings & Stats Tab
        <div>
          {/* Season Selector */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Season Information</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="standings-season-select" className="text-gray-600">
                  Select Season:
                </label>
                {availableSeasons.length > 0 ? (
                  <select
                    id="standings-season-select"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableSeasons.map((season) => (
                      <option key={season.year} value={season.year}>
                        {season.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-gray-500">No seasons available</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standings */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Standings</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">#</th>
                      <th className="py-2">Team</th>
                      <th className="text-center py-2">MP</th>
                      <th className="text-center py-2">W</th>
                      <th className="text-center py-2">D</th>
                      <th className="text-center py-2">L</th>
                      <th className="text-center py-2">GF</th>
                      <th className="text-center py-2">GA</th>
                      <th className="text-center py-2">GD</th>
                      <th className="text-center py-2">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.standings[0].table.map((row) => (
                      <tr key={row.team.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{row.position}</td>
                        <td className="py-3">
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                            onClick={() => navigate(`/team/${row.team.id}`)}
                            title={`Go to ${row.team.name} page`}
                          >
                            <img
                              src={row.team.crest}
                              alt={row.team.name}
                              className="w-6 h-6 object-contain"
                            />
                            <span>{row.team.shortName || row.team.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-3">{row.playedGames}</td>
                        <td className="text-center py-3">{row.won}</td>
                        <td className="text-center py-3">{row.draw}</td>
                        <td className="text-center py-3">{row.lost}</td>
                        <td className="text-center py-3">{row.goalsFor}</td>
                        <td className="text-center py-3">{row.goalsAgainst}</td>
                        <td
                          className={`text-center py-3 font-medium ${
                            row.goalDifference > 0
                              ? 'text-green-600'
                              : row.goalDifference < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {row.goalDifference > 0 ? '+' : ''}
                          {row.goalDifference}
                        </td>
                        <td className="text-center py-3 font-bold">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Scorers */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Top Scorers (10)</h2>
              <div className="space-y-4">
                {scorers.scorers.map((scorer) => (
                  <div
                    key={scorer.player.id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold cursor-pointer hover:text-blue-600"
                        onClick={() => navigate(`/player/${scorer.player.id}`)}
                        title={`View ${scorer.player.name}'s details`}
                      >
                        {scorer.player.name}
                      </span>
                      <span
                        className="text-sm text-gray-600 cursor-pointer hover:text-blue-600"
                        onClick={() => navigate(`/team/${scorer.team.id}`)}
                        title={`Go to ${scorer.team.name} page`}
                      >
                        ({scorer.team.shortName})
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Goals</span>
                        <p className="font-bold text-center">{scorer.goals}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Penalties</span>
                        <p className="font-bold text-center">{scorer.penalties || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Matches Tab
        <div>
          {/* Season Info and Selector */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Season Information</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="season-select" className="text-gray-600">
                  Select Season:
                </label>
                {availableSeasons.length > 0 ? (
                  <select
                    id="season-select"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableSeasons.map((season) => (
                      <option key={season.year} value={season.year}>
                        {season.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-gray-500">No seasons available</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600">Start Date</p>
                <p className="font-semibold">
                  {new Date(competition.currentSeason.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">End Date</p>
                <p className="font-semibold">
                  {new Date(competition.currentSeason.endDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Current Matchday</p>
                <p className="font-semibold">{competition.currentSeason.currentMatchday}</p>
              </div>
            </div>
          </div>

          {/* All Season Matches */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">All Matches</h2>
            {sortedMatches.length > 0 ? (
              <div className="space-y-6">
                {/* Group matches by matchday and ensure they stay in descending order */}
                {Array.from(new Set(sortedMatches.map((m) => m.matchday)))
                  .sort((a, b) => b - a) // Sort matchdays in descending order
                  .map((matchday) => (
                    <div key={matchday} className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                        Matchday {matchday}
                      </h3>
                      <div className="space-y-3">
                        {sortedMatches
                          .filter((match) => match.matchday === matchday)
                          .map((match) => (
                            <div
                              key={match.id}
                              onClick={() => navigate(`/match/${match.id}`)}
                              className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                              title="Click to view match details"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 flex-1">
                                  <img
                                    src={match.homeTeam.crest}
                                    alt={match.homeTeam.shortName}
                                    className="w-6 h-6 object-contain"
                                  />
                                  <span className="font-medium">{match.homeTeam.shortName}</span>
                                </div>
                                <div className="flex flex-col items-center min-w-[100px]">
                                  {match.status === 'FINISHED' ? (
                                    <span className="font-bold">
                                      {match.score.fullTime.home} - {match.score.fullTime.away}
                                    </span>
                                  ) : (
                                    <span className="text-sm font-medium text-orange-600">
                                      {match.status === 'IN_PLAY'
                                        ? 'LIVE'
                                        : match.status === 'TIMED'
                                        ? new Date(match.utcDate).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : match.status}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {new Date(match.utcDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                  <span className="font-medium">{match.awayTeam.shortName}</span>
                                  <img
                                    src={match.awayTeam.crest}
                                    alt={match.awayTeam.shortName}
                                    className="w-6 h-6 object-contain"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">
                No matches available for this season.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
