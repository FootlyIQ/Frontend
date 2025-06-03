import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function PlayerPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [playerDetails, setPlayerDetails] = useState(null);
  const [playerMatches, setPlayerMatches] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      try {
        // Fetch player details
        const resDetails = await fetch(`https://footlyiq-backend.onrender.com/player/${playerId}`, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });
        if (!resDetails.ok) {
          throw new Error('Error loading player details');
        }
        const detailsData = await resDetails.json();
        setPlayerDetails(detailsData);

        // Fetch player matches
        const resMatches = await fetch(
          `https://footlyiq-backend.onrender.com/player/${playerId}/matches?limit=50`,
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );
        if (!resMatches.ok) {
          throw new Error('Error loading player matches');
        }
        const matchesData = await resMatches.json();
        setPlayerMatches(matchesData);

        setError('');
      } catch (err) {
        setError(err.message);
        setPlayerDetails(null);
        setPlayerMatches(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId]);

  // Calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="p-4">
      {/* Player Header */}
      {playerDetails && (
        <div className="flex items-center gap-4 mb-8">
          {playerDetails.image && (
            <img
              src={playerDetails.image}
              alt={playerDetails.name}
              className="h-24 w-auto rounded-lg object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{playerDetails.name}</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <span>{playerDetails.position}</span>
              <span>•</span>
              <span>{playerDetails.nationality}</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center p-4">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">❌ {error}</div>
      ) : (
        <>
          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Player Details
                </button>
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'matches'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Matches & Stats
                </button>
              </nav>
            </div>
          </div>

          {/* Tab content */}
          <div className="bg-white p-6 rounded-lg shadow">
            {activeTab === 'details' && playerDetails ? (
              <div className="space-y-6">
                {/* Personal Information */}
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information Column */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                      <div className="space-y-3">
                        <p>
                          <span className="font-medium">Full Name:</span> {playerDetails.firstName}{' '}
                          {playerDetails.lastName}
                        </p>
                        <p>
                          <span className="font-medium">Age:</span>{' '}
                          {calculateAge(playerDetails.dateOfBirth)} years
                        </p>
                        <p>
                          <span className="font-medium">Date of Birth:</span>{' '}
                          {new Date(playerDetails.dateOfBirth).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-medium">Nationality:</span>{' '}
                          {playerDetails.nationality}
                        </p>
                        <p>
                          <span className="font-medium">Position:</span> {playerDetails.position}
                        </p>
                        <p>
                          <span className="font-medium">Shirt Number:</span>{' '}
                          {playerDetails.shirtNumber || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {/* Contract Information Column */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Contract Information</h3>
                      {playerDetails.contract ? (
                        <div className="space-y-3">
                          <p>
                            <span className="font-medium">Contract Start:</span>{' '}
                            {playerDetails.contract.start || 'Not available'}
                          </p>
                          <p>
                            <span className="font-medium">Contract Until:</span>{' '}
                            {playerDetails.contract.until || 'Not available'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">Contract information not available</p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            ) : activeTab === 'matches' && playerMatches ? (
              <div className="space-y-8">
                {/* Player Statistics */}
                <section>
                  <h3 className="text-xl font-semibold mb-4">Season Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Matches Played</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {playerMatches.stats.matchesOnPitch}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Starting XI</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {playerMatches.stats.startingXI}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Goals</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {playerMatches.stats.goals}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Assists</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {playerMatches.stats.assists}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Minutes Played</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {playerMatches.stats.minutesPlayed}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Match List */}
                <section>
                  <h3 className="text-xl font-semibold mb-4">Recent Matches</h3>
                  {playerMatches.matches.length > 0 ? (
                    <div className="space-y-3">
                      {playerMatches.matches.map((match, idx) => (
                        <div
                          key={idx}
                          onClick={() => navigate(`/match/${match.match_id}`)}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200"
                        >
                          <div className="grid grid-cols-12 items-center gap-4">
                            {/* Competition */}
                            <div className="col-span-1">
                              <img
                                src={match.competition.emblem}
                                alt={match.competition.name}
                                className="w-8 h-8 object-contain"
                                title={match.competition.name}
                              />
                            </div>

                            {/* Teams and Score */}
                            <div className="col-span-9 grid grid-cols-7 items-center">
                              {/* Home Team */}
                              <div className="col-span-3 flex items-center justify-end gap-2">
                                <span className="font-medium text-right">
                                  {match.homeTeam.name}
                                </span>
                                <img
                                  src={match.homeTeam.crest}
                                  alt={match.homeTeam.name}
                                  className="w-6 h-6 object-contain"
                                />
                              </div>

                              {/* Score */}
                              <div className="col-span-1 text-center font-bold px-2">
                                {match.homeTeam.score} - {match.awayTeam.score}
                              </div>

                              {/* Away Team */}
                              <div className="col-span-3 flex items-center justify-start gap-2">
                                <img
                                  src={match.awayTeam.crest}
                                  alt={match.awayTeam.name}
                                  className="w-6 h-6 object-contain"
                                />
                                <span className="font-medium text-left">{match.awayTeam.name}</span>
                              </div>
                            </div>

                            {/* Date and Status */}
                            <div className="col-span-2 text-right">
                              <div className="text-sm text-gray-600">{match.date}</div>
                              <div className="text-xs text-gray-500">{match.status}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No match data available.</p>
                  )}
                </section>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

export default PlayerPage;
