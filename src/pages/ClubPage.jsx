import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ClubPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();

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

  // Fetch filters when component mounts
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch(`http://localhost:5000/team-filters/${teamId}`);
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
      let matchesUrl = `http://localhost:5000/team-matches/${teamId}`;
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
        const resSquad = await fetch(`http://localhost:5000/team-squad/${teamId}`);
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          gap: '1rem', // spacing between logo and team name
        }}
      >
        {teamCrest && (
          <img src={teamCrest} alt={`${teamName} logo`} style={{ height: 80, width: 'auto' }} />
        )}
        <h2 style={{ margin: 0 }}>{teamName || `Club ${teamId}`}</h2>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading...</p>
      ) : error ? (
        <div style={{ color: 'red', textAlign: 'center' }}>
          <p>❌ {error}</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={() => setActiveTab('fixtures')}
              style={{
                ...tabButtonStyle,
                ...(activeTab === 'fixtures' ? activeStyle : inactiveStyle),
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'fixtures') e.currentTarget.style.backgroundColor = '#c8c8c8';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'fixtures')
                  e.currentTarget.style.backgroundColor = inactiveStyle.backgroundColor;
              }}
            >
              Fixtures
            </button>
            <button
              onClick={() => setActiveTab('squad')}
              style={{
                ...tabButtonStyle,
                ...(activeTab === 'squad' ? activeStyle : inactiveStyle),
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'squad') e.currentTarget.style.backgroundColor = '#c8c8c8';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'squad')
                  e.currentTarget.style.backgroundColor = inactiveStyle.backgroundColor;
              }}
            >
              Squad
            </button>
          </div>

          {/* Tab content */}
          <div
            style={{
              backgroundColor: '#f9f9f9',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              width: '100%',
              maxWidth: '1200px',
              margin: '0 auto',
              boxSizing: 'border-box',
            }}
          >
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
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {fixtures.map((match, idx) => (
                      <li
                        key={idx}
                        onClick={() => navigate(`/match/${match.match_id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          padding: '1rem',
                          borderBottom: '1px solid #ccc',
                          gap: '1rem',
                          width: '100%',
                          boxSizing: 'border-box',
                          flexWrap: 'wrap',
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fff';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        }}
                      >
                        {/* Date */}
                        <div style={{ minWidth: 80, flexShrink: 0 }}>
                          <strong>{match.date}</strong>
                        </div>

                        {/* Teams + score */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexGrow: 2,
                            flexBasis: '50%',
                            overflow: 'hidden',
                            flexWrap: 'nowrap',
                          }}
                        >
                          <img src={match.home_crest} alt="" style={{ height: 30 }} />
                          <span style={{ fontWeight: 500 }}>{match.home_team}</span>
                          <strong style={{ minWidth: 40, textAlign: 'center' }}>
                            {match.score}
                          </strong>
                          <span style={{ fontWeight: 500 }}>{match.away_team}</span>
                          <img src={match.away_crest} alt="" style={{ height: 30 }} />
                        </div>

                        {/* League info */}
                        <div
                          style={{
                            display: 'flex',
                            width: '25%',
                            marginRight: '1rem',
                          }}
                        >
                          <div style={{ flexBasis: '8%', minWidth: 80, fontSize: '0.85rem' }}>
                            <div>
                              <strong>Matchday:</strong> {match.matchday || 'N/A'}
                            </div>
                            <div>{formatStage(match.stage)}</div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              flexGrow: 1,
                              minWidth: 100,
                              gap: '0.25rem',
                            }}
                          >
                            {match.competition_logo && (
                              <img src={match.competition_logo} alt="" style={{ height: 30 }} />
                            )}
                            <span
                              style={{
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {match.competition_name}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No matches available.</p>
                )}
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: '1rem' }}>Squad Members</h3>
                {squad.length > 0 ? (
                  <>
                    {console.log('Unique positions:', [...new Set(squad.map((p) => p.position))])}

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {/* Coach section */}
                      {squad
                        .filter((player) => player.position === 'Manager')
                        .map((player, idx) => (
                          <li
                            key={`coach-${idx}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              padding: '1rem',
                              borderBottom: '1px solid #ccc',
                              gap: '1rem',
                              width: '100%',
                              boxSizing: 'border-box',
                              position: 'relative',
                              backgroundColor: '#f8f9fa',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <strong>{player.name}</strong>
                                <span
                                  style={{
                                    backgroundColor: '#0056b3',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  Head Coach
                                </span>
                              </div>
                              <span>Nationality: {player.nationality}</span>
                            </div>
                          </li>
                        ))}

                      {/* Goalkeeper section */}
                      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Goalkeepers</h4>
                      {squad
                        .filter((player) => player.position === 'Goalkeeper')
                        .map((player, idx) => (
                          <PlayerListItem key={`gk-${idx}`} player={player} navigate={navigate} />
                        ))}

                      {/* Defender section */}
                      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Defenders</h4>
                      {squad
                        .filter(
                          (player) =>
                            player.position === 'Defence' ||
                            player.position === 'Centre-Back' ||
                            player.position === 'Left-Back' ||
                            player.position === 'Right-Back'
                        )
                        .map((player, idx) => (
                          <PlayerListItem key={`def-${idx}`} player={player} navigate={navigate} />
                        ))}

                      {/* Midfielder section */}
                      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Midfielders</h4>
                      {squad
                        .filter(
                          (player) =>
                            player.position === 'Midfield' ||
                            player.position === 'Central Midfield' ||
                            player.position === 'Defensive Midfield' ||
                            player.position === 'Attacking Midfield'
                        )
                        .map((player, idx) => (
                          <PlayerListItem key={`mid-${idx}`} player={player} navigate={navigate} />
                        ))}

                      {/* Forward section */}
                      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Forwards</h4>
                      {squad
                        .filter(
                          (player) =>
                            player.position === 'Offence' ||
                            player.position === 'Centre-Forward' ||
                            player.position === 'Left Winger' ||
                            player.position === 'Right Winger'
                        )
                        .map((player, idx) => (
                          <PlayerListItem key={`att-${idx}`} player={player} navigate={navigate} />
                        ))}
                    </ul>
                  </>
                ) : (
                  <p>No squad data available.</p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const PlayerListItem = ({ player, navigate }) => (
  <li
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '1rem',
      borderBottom: '1px solid #ccc',
      gap: '1rem',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
    }}
  >
    <div style={{ position: 'absolute', left: '-100px' }}>
      {player.id && (
        <button
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => navigate(`/player/${player.id}`)}
        >
          Info
        </button>
      )}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <strong>{player.name}</strong>
      <span>Position: {player.position}</span>
      <span>Nationality: {player.nationality}</span>
    </div>
  </li>
);

export default ClubPage;
