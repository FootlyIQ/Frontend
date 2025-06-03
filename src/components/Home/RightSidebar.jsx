import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebaseConfig';
import { useFavorites } from '../../hooks/useFavorites';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function RightSidebar({ todaysMatches = [] }) {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { favorites } = useFavorites();
  const [hotMatches, setHotMatches] = useState([]);
  const [isLoadingHotMatches, setIsLoadingHotMatches] = useState(true);
  const [userActivity, setUserActivity] = useState({ votes: 0, favorites: 0 });
  const [trendingData, setTrendingData] = useState({ teams: [], players: [] });

  // Calculate hot matches based on voting data and live status
  useEffect(() => {
    if (!todaysMatches || todaysMatches.length === 0) {
      // Add timeout to stop loading if no matches after 2 seconds
      const timeoutId = setTimeout(() => {
        setIsLoadingHotMatches(false);
        setHotMatches([]);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }

    const calculateHotMatches = async () => {
      const allMatches = [];

      // Flatten matches from all countries/leagues
      todaysMatches.forEach((country) => {
        country.leagues?.forEach((league) => {
          league.matches?.forEach((match) => {
            allMatches.push({
              ...match,
              leagueInfo: league.league, // Store the full league info
              countryInfo: country.country,
            });
          });
        });
      });

      // Score matches based on multiple factors (simplified)
      const scoredMatches = await Promise.all(
        allMatches.map(async (match) => {
          // Get voting data from Firestore
          let totalVotes = 0;
          const matchId = match.id || match.matchId || match._id || match.match_id;

          try {
            if (matchId) {
              const voteCountsRef = doc(db, 'match_vote_counts', matchId.toString());
              const voteDoc = await getDoc(voteCountsRef);
              if (voteDoc.exists()) {
                const votes = voteDoc.data();
                totalVotes = (votes.home || 0) + (votes.draw || 0) + (votes.away || 0);
              }
            }
          } catch (error) {
            // Silently handle voting data fetch errors
          }

          let hotScore = 0;
          const isLive =
            match.status === 'LIVE' || match.status === 'IN_PLAY' || match.status === 'PAUSED';
          const isFinished = match.status === 'Finished' || match.status === 'FINISHED';

          // Priority 1: Live matches (should always be first)
          if (isLive) {
            hotScore += 50000; // Much higher priority to ensure they're always first
          }
          // Priority 2: Matches with votes (engagement) - but only if not finished or if finished with significant votes
          else if (totalVotes > 0) {
            if (isFinished && totalVotes >= 3) {
              // Only show finished matches if they had decent engagement
              hotScore += 2000 + totalVotes * 100;
            } else if (!isFinished) {
              // Upcoming matches with votes
              hotScore += 3000 + totalVotes * 100;
            }
            // Finished matches with few votes get no points (filtered out)
          }
          // Priority 3: Upcoming matches without votes
          else if (!isFinished) {
            // Priority 3: Matches starting soon (within 2 hours)
            const matchTime = new Date(match.utcDate || match.date);
            const now = new Date();
            const timeDiff = matchTime - now;
            if (timeDiff > 0 && timeDiff < 7200000) {
              // 2 hours
              hotScore += 1000;
            }

            // Priority 4: Popular teams bonus (only for upcoming matches)
            const popularTeams = [
              'Arsenal',
              'Liverpool',
              'Manchester',
              'Chelsea',
              'Real Madrid',
              'Barcelona',
              'Bayern',
              'PSG',
            ];
            if (
              popularTeams.some(
                (team) => match.home_team?.includes(team) || match.away_team?.includes(team)
              )
            ) {
              hotScore += 500;
            }

            // Base score for upcoming matches
            hotScore += 100;
          }
          // Finished matches without votes get 0 points (will be filtered out)

          return {
            ...match,
            hotScore,
            totalVotes,
            isLive,
          };
        })
      );

      // Sort by hot score and take top 3
      const topMatches = scoredMatches
        .filter((match) => match.hotScore > 0) // Remove matches with no score (finished matches without votes)
        .sort((a, b) => b.hotScore - a.hotScore)
        .slice(0, 3);

      setHotMatches(topMatches);
      setIsLoadingHotMatches(false);
    };

    calculateHotMatches();
  }, [todaysMatches]);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const fetchUserVotes = async () => {
      try {
        // Get user's votes from Firestore
        const votesQuery = query(collection(db, 'match_votes'), where('userId', '==', user.uid));
        const votesSnapshot = await getDocs(votesQuery);
        const userVotes = votesSnapshot.docs.length;

        const userFavorites = favorites.matches.length + favorites.clubs.length;

        setUserActivity({
          votes: userVotes,
          favorites: userFavorites,
        });
      } catch (error) {
        console.error('Error fetching user votes:', error);
        // Fallback to just favorites count
        setUserActivity({
          votes: 0,
          favorites: favorites.matches.length + favorites.clubs.length,
        });
      }
    };

    fetchUserVotes();
  }, [user, favorites]);

  // Calculate trending data based on recent user interactions
  useEffect(() => {
    const recentActivity = JSON.parse(localStorage.getItem('recent_activity') || '[]');
    const last24h = Date.now() - 24 * 60 * 60 * 1000;

    // Filter recent activity
    const todayActivity = recentActivity.filter((activity) => activity.timestamp > last24h);

    // Extract trending teams
    const teamCounts = {};
    todayActivity.forEach((activity) => {
      if (activity.type === 'favorite_club' || activity.type === 'team_view') {
        teamCounts[activity.teamName] = (teamCounts[activity.teamName] || 0) + 1;
      }
    });

    const trendingTeams = Object.entries(teamCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    setTrendingData({ teams: trendingTeams });
  }, []);

  const formatMatchTime = (dateString) => {
    try {
      if (!dateString) return 'TBD';

      let date;

      // Handle different date formats more robustly
      if (typeof dateString === 'string') {
        // Try parsing as ISO string first
        date = new Date(dateString);

        // If that fails, try other common formats
        if (isNaN(date.getTime())) {
          // Try parsing DD/MM/YYYY HH:MM format
          const ddmmyyyyMatch = dateString.match(
            /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{2})/
          );
          if (ddmmyyyyMatch) {
            const [, day, month, year, hour, minute] = ddmmyyyyMatch;
            date = new Date(year, month - 1, day, hour, minute);
          } else {
            // Try parsing "DD.MM.YYYY at HH:MM" format
            const ddmmyyyyAtMatch = dateString.match(
              /(\d{1,2})\.(\d{1,2})\.(\d{4})\s+at\s+(\d{1,2}):(\d{2})/
            );
            if (ddmmyyyyAtMatch) {
              const [, day, month, year, hour, minute] = ddmmyyyyAtMatch;
              date = new Date(year, month - 1, day, hour, minute);
            } else {
              // Try parsing "DD.MM.YYYY ob HH:MM" format (Slovenian)
              const ddmmyyyyObMatch = dateString.match(
                /(\d{1,2})\.(\d{1,2})\.(\d{4})\s+ob\s+(\d{1,2}):(\d{2})/
              );
              if (ddmmyyyyObMatch) {
                const [, day, month, year, hour, minute] = ddmmyyyyObMatch;
                date = new Date(year, month - 1, day, hour, minute);
              } else {
                // Try extracting just time if date parsing fails completely
                const timeMatch = dateString.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                  return timeMatch[0]; // Just return the time part
                }
              }
            }
          }
        }
      } else {
        date = new Date(dateString);
      }

      if (date && !isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }

      // Fallback: try to extract time from the string
      const timeMatch = String(dateString).match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        return timeMatch[0];
      }

      return 'TBD';
    } catch (error) {
      // Final fallback: try to extract time pattern
      const timeMatch = String(dateString).match(/(\d{1,2}):(\d{2})/);
      return timeMatch ? timeMatch[0] : 'TBD';
    }
  };

  const getLeagueName = (match) => {
    // Try different ways to get league name
    if (match.leagueInfo?.name) return match.leagueInfo.name;
    if (match.league?.name) return match.league.name;
    if (match.leagueInfo) return match.leagueInfo;
    if (match.competition?.name) return match.competition.name;
    if (match.competition) return match.competition;
    return 'League TBD';
  };

  const getMatchStatusColor = (status) => {
    switch (status) {
      case 'LIVE':
      case 'IN_PLAY':
      case 'PAUSED':
        return 'text-red-400';
      case 'Finished':
      case 'FINISHED':
        return 'text-gray-400';
      default:
        return 'text-blue-400';
    }
  };

  // Loading skeleton for hot matches
  const HotMatchesLoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-700 p-3 rounded-lg animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
              <div className="w-12 h-3 bg-slate-600 rounded"></div>
            </div>
            <div className="w-16 h-5 bg-slate-600 rounded"></div>
          </div>
          <div className="w-3/4 h-4 bg-slate-600 rounded mb-1"></div>
          <div className="w-1/2 h-3 bg-slate-600 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <aside className="hidden lg:block w-80 bg-slate-800 p-6 space-y-6">
      {/* Hot Matches Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🔥</span>
          <h2 className="text-lg font-semibold text-stone-200">Hot Matches</h2>
        </div>

        {isLoadingHotMatches ? (
          <HotMatchesLoadingSkeleton />
        ) : hotMatches.length > 0 ? (
          <div className="space-y-3">
            {hotMatches.map((match, idx) => (
              <div
                key={match.id || idx}
                className="bg-slate-700 p-3 rounded-lg hover:bg-slate-600 transition cursor-pointer"
                onClick={() => {
                  // Use multiple possible ID fields to ensure navigation works
                  const matchId = match.id || match.matchId || match.match_id || match._id;
                  if (matchId) {
                    navigate(`/match/${matchId}`);
                  } else {
                    console.warn('No valid match ID found for navigation:', match);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {match.isLive && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                    <span className={`text-xs font-medium ${getMatchStatusColor(match.status)}`}>
                      {match.status === 'IN_PLAY' ? 'LIVE' : match.status}
                    </span>
                  </div>
                  {match.totalVotes > 0 && (
                    <div className="text-xs text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded">
                      {match.totalVotes} votes
                    </div>
                  )}
                </div>

                <div className="text-sm">
                  <div className="text-stone-200 font-medium truncate">
                    {match.home_team} vs {match.away_team}
                  </div>
                  <div className="text-stone-400 text-xs mt-1">
                    {getLeagueName(match)} • {formatMatchTime(match.utcDate || match.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-700 p-4 rounded-lg text-center">
            <div className="text-slate-400 text-sm">
              No hot matches yet today.
              <br />
              <span className="text-xs">Vote on matches to see trending!</span>
            </div>
          </div>
        )}
      </div>

      {/* User Activity Section */}
      {user && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📊</span>
            <h2 className="text-lg font-semibold text-stone-200">Your Activity</h2>
          </div>

          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-emerald-300">{userActivity.votes}</div>
                <div className="text-xs text-stone-400">Votes Cast</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-300">{userActivity.favorites}</div>
                <div className="text-xs text-stone-400">Favorites</div>
              </div>
            </div>

            {userActivity.favorites > 0 && (
              <button
                onClick={() => navigate('/profile')}
                className="w-full mt-3 bg-slate-600 hover:bg-slate-500 text-stone-200 text-xs py-2 rounded transition"
              >
                View Profile
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trending Section */}
      {trendingData.teams.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⚡</span>
            <h2 className="text-lg font-semibold text-stone-200">Trending Today</h2>
          </div>

          <div className="space-y-2">
            {trendingData.teams.map((team, idx) => (
              <div key={idx} className="bg-slate-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-stone-200 text-sm font-medium">{team.name}</span>
                  <div className="text-xs text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded">
                    {team.count} views
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚡</span>
          <h2 className="text-lg font-semibold text-stone-200">Quick Actions</h2>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => navigate('/fantasy')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-3 rounded transition"
          >
            🏆 Fantasy Hub
          </button>
          <button
            onClick={() => navigate('/analysis')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition"
          >
            📈 Analysis Hub
          </button>
        </div>
      </div>
    </aside>
  );
}
