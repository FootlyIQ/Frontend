import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function ClubPage() {
  const { teamId } = useParams();

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
        maxWidth: 700,
        margin: '2rem auto',
        padding: '1rem',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          gap: '1rem', // razmik med logo in imenom
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
                        style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #ddd' }}
                      >
                        <strong>{match.date}</strong> — {match.home_team} vs {match.away_team} (
                        {match.score})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No matches to display.</p>
                )}
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: '1rem' }}>Squad</h3>
                {squad.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {squad.map((player, idx) => (
                      <li
                        key={idx}
                        style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #ddd' }}
                      >
                        {player.name} ({player.position}) — {player.nationality}
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
