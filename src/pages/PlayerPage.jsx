import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function PlayerPage() {
  const { playerId } = useParams();
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
        const resDetails = await fetch(`http://localhost:5000/player/${playerId}`, {
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
          `http://localhost:5000/player/${playerId}/matches?limit=50`,
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

  // Style objects for tabs
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
    <div
      style={{
        margin: '2rem auto',
        padding: '1rem',
        fontFamily: 'Arial, sans-serif',
        width: '100%',
        maxWidth: '1200px',
        boxSizing: 'border-box',
      }}
    >
      {/* Player Header */}
      {playerDetails && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            gap: '2rem',
          }}
        >
          {/* Player Image */}
          {playerDetails.image && (
            <img
              src={playerDetails.image}
              alt={playerDetails.name}
              style={{
                height: 120,
                width: 'auto',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            />
          )}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>{playerDetails.name}</h2>
            <p style={{ margin: 0, color: '#666' }}>{playerDetails.position}</p>
          </div>
        </div>
      )}

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
              onClick={() => setActiveTab('details')}
              style={{
                ...tabButtonStyle,
                ...(activeTab === 'details' ? activeStyle : inactiveStyle),
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'details') e.currentTarget.style.backgroundColor = '#c8c8c8';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'details')
                  e.currentTarget.style.backgroundColor = inactiveStyle.backgroundColor;
              }}
            >
              Player Details
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              style={{
                ...tabButtonStyle,
                ...(activeTab === 'matches' ? activeStyle : inactiveStyle),
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'matches') e.currentTarget.style.backgroundColor = '#c8c8c8';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'matches')
                  e.currentTarget.style.backgroundColor = inactiveStyle.backgroundColor;
              }}
            >
              Matches & Stats
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
            {activeTab === 'details' && playerDetails ? (
              <div style={{ display: 'grid', gap: '2rem' }}>
                {/* Personal Information */}
                <section>
                  <h3 style={{ marginBottom: '1rem' }}>Personal Information</h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <p>
                        <strong>Full Name:</strong> {playerDetails.firstName}{' '}
                        {playerDetails.lastName}
                      </p>
                      <p>
                        <strong>Age:</strong> {calculateAge(playerDetails.dateOfBirth)} years
                      </p>
                      <p>
                        <strong>Date of Birth:</strong>{' '}
                        {new Date(playerDetails.dateOfBirth).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Nationality:</strong> {playerDetails.nationality}
                      </p>
                      <p>
                        <strong>Position:</strong> {playerDetails.position}
                      </p>
                      <p>
                        <strong>Shirt Number:</strong> {playerDetails.shirtNumber || 'N/A'}
                      </p>
                    </div>
                    <div>
                      {playerDetails.contract ? (
                        <>
                          <h4 style={{ marginBottom: '0.5rem' }}>Contract Information</h4>
                          <p>
                            <strong>Contract Start:</strong>{' '}
                            {playerDetails.contract.start || 'Not available'}
                          </p>
                          <p>
                            <strong>Contract Until:</strong>{' '}
                            {playerDetails.contract.until || 'Not available'}
                          </p>
                        </>
                      ) : (
                        <h4>Contract information not available</h4>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            ) : activeTab === 'matches' && playerMatches ? (
              <div>
                {/* Player Statistics */}
                <section style={{ marginBottom: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem' }}>Season Statistics</h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                      backgroundColor: '#fff',
                      padding: '1rem',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.9rem', color: '#666' }}>Matches Played</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {playerMatches.stats.matchesPlayed}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.9rem', color: '#666' }}>Starting XI</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {playerMatches.stats.startingXI}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.9rem', color: '#666' }}>Goals</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {playerMatches.stats.goals}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.9rem', color: '#666' }}>Assists</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {playerMatches.stats.assists}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.9rem', color: '#666' }}>Minutes Played</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {playerMatches.stats.minutesPlayed}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Match List */}
                <section>
                  <h3 style={{ marginBottom: '1rem' }}>Recent Matches</h3>
                  {playerMatches.matches.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {playerMatches.matches.map((match, idx) => (
                        <li
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '1rem',
                            borderBottom: '1px solid #eee',
                            gap: '1rem',
                            backgroundColor: '#fff',
                            marginBottom: '0.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                        >
                          {/* Competition */}
                          <div style={{ width: '40px' }}>
                            <img
                              src={match.competition.emblem}
                              alt={match.competition.name}
                              style={{ width: '30px', height: '30px' }}
                            />
                          </div>

                          {/* Teams */}
                          <div
                            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}
                          >
                            <img
                              src={match.homeTeam.crest}
                              alt=""
                              style={{ width: '25px', height: '25px' }}
                            />
                            <span>{match.homeTeam.name}</span>
                            <strong>
                              {match.homeTeam.score} - {match.awayTeam.score}
                            </strong>
                            <span>{match.awayTeam.name}</span>
                            <img
                              src={match.awayTeam.crest}
                              alt=""
                              style={{ width: '25px', height: '25px' }}
                            />
                          </div>

                          {/* Date and Status */}
                          <div style={{ textAlign: 'right', minWidth: '150px' }}>
                            <div style={{ fontSize: '0.9rem' }}>{match.date}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{match.status}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No match data available.</p>
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
