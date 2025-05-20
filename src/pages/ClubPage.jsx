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

  useEffect(() => {
    const fetchClubData = async () => {
      setLoading(true);
      try {
        const resMatches = await fetch(`http://localhost:5000/team-matches/${teamId}`);
        if (!resMatches.ok) {
          throw new Error('Error loading matches');
        }
        const matchesData = await resMatches.json();
        setFixtures(matchesData);

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
        setFixtures([]);
        setSquad([]);
        setTeamName('');
        setTeamCrest('');
      } finally {
        setLoading(false);
      }
    };

    fetchClubData();
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
                <h3 style={{ marginBottom: '1rem' }}>Upcoming Matches</h3>
                {fixtures.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {fixtures.map((match, idx) => (
                      <li
                        key={idx}
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
                          position: 'relative',
                        }}
                      >
                        {/* Gumb vedno na levi strani */}
                        <div style={{ position: 'absolute', left: '-100px' }}>
                          <button
                            style={{
                              padding: '0.4rem 0.8rem',
                              borderRadius: '8px',
                              backgroundColor: '#007bff',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                            onClick={() => navigate(`/match/${match.match_id}`)}
                          >
                            More info
                          </button>
                        </div>

                        {/* Datum */}
                        <div style={{ minWidth: 80, flexShrink: 0 }}>
                          <strong>{match.date}</strong>
                        </div>

                        {/* Ekipe + rezultat */}
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

                        {/* Liga info */}
                        <div
                          style={{
                            display: 'flex',
                            width: '25%',
                            marginRight: '5.5rem',
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
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {squad.map((player, idx) => (
                      <li
                        key={idx}
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
                        {/* Gumb na levi*/}
                        <div style={{ position: 'absolute', left: '-100px' }}>
                          <button
                            style={{
                              padding: '0.4rem 0.8rem',
                              borderRadius: '8px',
                              backgroundColor: '#28a745',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                            onClick={() => alert(`You clicked on ${player.name}`)}
                          >
                            Info
                          </button>
                        </div>

                        {/* Info o igralcu */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong>{player.name}</strong>
                          <span>Position: {player.position}</span>
                          <span>Nationality: {player.nationality}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
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

export default ClubPage;
