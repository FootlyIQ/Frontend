import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebaseConfig';
import { collection, doc, getDoc, setDoc, onSnapshot, increment } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function MatchDetail() {
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // state za zavihek
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();

  // Voting state
  const [user] = useAuthState(auth);
  const [userVote, setUserVote] = useState(null);
  const [voteCount, setVoteCount] = useState({ home: 0, draw: 0, away: 0 });
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setIsRefreshing(true);
        const response = await axios.get(`https://footlyiq-backend.onrender.com/match-statistics/${matchId}`);
        setMatchData(response.data);
        setLastUpdated(new Date());
        setError('');
      } catch (err) {
        console.error('Error at loading games:', err);
        setError('Error at loading details.');
      } finally {
        setIsRefreshing(false);
      }
    };

    fetchMatchDetails();

    // Set different refresh intervals based on match status
    const getRefreshInterval = () => {
      if (!matchData) return 30000; // Default 30 seconds for initial load

      const status = matchData.generalInfo?.status;

      // Refresh more frequently for live matches
      if (status === 'IN_PLAY' || status === 'PAUSED') {
        return 30000; // 30 seconds for live matches (optimized from 15s)
      }
      // Much less frequent for finished matches (once per day)
      if (status === 'FINISHED') {
        return 24 * 60 * 60 * 1000; // 24 hours for finished matches
      }
      // Moderate frequency for scheduled matches (every 10 minutes)
      if (status === 'SCHEDULED') {
        return 10 * 60 * 1000; // 10 minutes for scheduled matches
      }
      // Default fallback
      return 30000; // 30 seconds
    };

    const interval = setInterval(fetchMatchDetails, getRefreshInterval());

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [matchId, matchData?.generalInfo?.status]); // Add status to dependencies to update interval

  // Check if match is eligible for voting
  const isMatchEligibleForVoting = () => {
    if (!matchData) return false;
    const status = matchData.generalInfo?.status;
    // Allow voting only for scheduled matches (not started, in progress, or finished)
    return status === 'SCHEDULED' || status === 'TIMED';
  };

  // Check if we should show poll results
  const shouldShowPollResults = () => {
    if (!matchData) return false;
    const status = matchData.generalInfo?.status;
    // Show results when match is live, paused, or finished
    return status === 'IN_PLAY' || status === 'PAUSED' || status === 'FINISHED';
  };

  // Handle voting
  const handleVote = async (voteType) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    if (!isMatchEligibleForVoting()) {
      alert('Voting is only available before the match starts');
      return;
    }

    // Prevent changing votes
    if (userVote) {
      alert('You have already voted! You cannot change your vote.');
      return;
    }

    setIsVoting(true);
    try {
      const userVoteRef = doc(db, 'match_votes', `${matchId}_${user.uid}`);
      const matchVoteRef = doc(db, 'match_vote_counts', matchId);

      // Check if user has already voted (extra safety check)
      const existingVote = await getDoc(userVoteRef);

      if (existingVote.exists()) {
        alert('You have already voted!');
        setIsVoting(false);
        return;
      }

      // First time voting - increment the vote count
      await setDoc(
        matchVoteRef,
        {
          [voteType]: increment(1),
        },
        { merge: true }
      );

      // Save user's vote
      await setDoc(userVoteRef, {
        vote: voteType,
        matchId: matchId,
        userId: user.uid,
        timestamp: new Date(),
      });

      setUserVote(voteType);
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  // Listen to vote counts and user's vote
  useEffect(() => {
    if (!matchId) return;

    // Listen to vote counts
    const matchVoteRef = doc(db, 'match_vote_counts', matchId);
    const unsubscribeVotes = onSnapshot(matchVoteRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setVoteCount({
          home: data.home || 0,
          draw: data.draw || 0,
          away: data.away || 0,
        });
      } else {
        setVoteCount({ home: 0, draw: 0, away: 0 });
      }
    });

    // Listen to user's vote if authenticated
    let unsubscribeUserVote = null;
    if (user) {
      const userVoteRef = doc(db, 'match_votes', `${matchId}_${user.uid}`);
      unsubscribeUserVote = onSnapshot(userVoteRef, (doc) => {
        if (doc.exists()) {
          setUserVote(doc.data().vote);
        } else {
          setUserVote(null);
        }
      });
    }

    return () => {
      unsubscribeVotes();
      if (unsubscribeUserVote) unsubscribeUserVote();
    };
  }, [matchId, user]);

  // Voting Poll Component
  const VotingPoll = () => {
    const totalVotes = voteCount.home + voteCount.draw + voteCount.away;
    const getPercentage = (votes) => (totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0);

    // Don't show anything if no votes and match hasn't started
    if (totalVotes === 0 && !isMatchEligibleForVoting() && !shouldShowPollResults()) {
      return null;
    }

    const isVotingActive = isMatchEligibleForVoting();
    const showResults = shouldShowPollResults();

    return (
      <div
        className={`p-6 rounded-lg border ${
          showResults
            ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
            : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
        }`}
      >
        <h3 className="text-lg font-semibold mb-4 text-center">
          {showResults ? '📊 Match Prediction Results' : '🗳️ Match Prediction Poll'}
        </h3>
        <p className="text-sm text-gray-600 text-center mb-6">
          {showResults
            ? `Here's what our community predicted before the match started!`
            : 'Who do you think will win? Vote before the match starts!'}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Home Team Vote */}
          <button
            onClick={() => handleVote('home')}
            disabled={isVoting || !user || !isVotingActive || userVote}
            className={`p-4 rounded-lg border-2 transition-all ${
              userVote === 'home'
                ? 'border-blue-500 bg-blue-100 text-blue-700'
                : showResults
                ? 'border-gray-300 bg-gray-50 cursor-default'
                : userVote
                ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
            } ${!user || !isVotingActive || userVote ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold">1</div>
              <div className="text-sm mt-1">{matchData.homeTeam.name}</div>
              <div className="text-xs text-gray-500 mt-2">
                {voteCount.home} votes ({getPercentage(voteCount.home)}%)
              </div>
              {/* Progress bar for results */}
              {showResults && totalVotes > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getPercentage(voteCount.home)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </button>

          {/* Draw Vote */}
          <button
            onClick={() => handleVote('draw')}
            disabled={isVoting || !user || !isVotingActive || userVote}
            className={`p-4 rounded-lg border-2 transition-all ${
              userVote === 'draw'
                ? 'border-green-500 bg-green-100 text-green-700'
                : showResults
                ? 'border-gray-300 bg-gray-50 cursor-default'
                : userVote
                ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
            } ${!user || !isVotingActive || userVote ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold">X</div>
              <div className="text-sm mt-1">Draw</div>
              <div className="text-xs text-gray-500 mt-2">
                {voteCount.draw} votes ({getPercentage(voteCount.draw)}%)
              </div>
              {/* Progress bar for results */}
              {showResults && totalVotes > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getPercentage(voteCount.draw)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </button>

          {/* Away Team Vote */}
          <button
            onClick={() => handleVote('away')}
            disabled={isVoting || !user || !isVotingActive || userVote}
            className={`p-4 rounded-lg border-2 transition-all ${
              userVote === 'away'
                ? 'border-purple-500 bg-purple-100 text-purple-700'
                : showResults
                ? 'border-gray-300 bg-gray-50 cursor-default'
                : userVote
                ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
            } ${!user || !isVotingActive || userVote ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold">2</div>
              <div className="text-sm mt-1">{matchData.awayTeam.name}</div>
              <div className="text-xs text-gray-500 mt-2">
                {voteCount.away} votes ({getPercentage(voteCount.away)}%)
              </div>
              {/* Progress bar for results */}
              {showResults && totalVotes > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getPercentage(voteCount.away)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Vote Status */}
        <div className="text-center">
          {showResults ? (
            <div>
              {user && userVote && (
                <p className="text-sm text-blue-600 font-medium mb-2">
                  🎯 You predicted:{' '}
                  {userVote === 'home'
                    ? matchData.homeTeam.name
                    : userVote === 'draw'
                    ? 'Draw'
                    : matchData.awayTeam.name}
                </p>
              )}
              {totalVotes > 0 && (
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Community predicted:</p>
                  <p className="text-xs mt-1">
                    Most popular:{' '}
                    {voteCount.home > voteCount.draw && voteCount.home > voteCount.away
                      ? `${matchData.homeTeam.name} (${getPercentage(voteCount.home)}%)`
                      : voteCount.draw > voteCount.home && voteCount.draw > voteCount.away
                      ? `Draw (${getPercentage(voteCount.draw)}%)`
                      : `${matchData.awayTeam.name} (${getPercentage(voteCount.away)}%)`}
                  </p>
                </div>
              )}
            </div>
          ) : !user ? (
            <p className="text-sm text-gray-500">Please login to vote</p>
          ) : userVote ? (
            <p className="text-sm text-green-600 font-medium">
              ✅ You voted for:{' '}
              {userVote === 'home'
                ? matchData.homeTeam.name
                : userVote === 'draw'
                ? 'Draw'
                : matchData.awayTeam.name}
              <br />
              <span className="text-xs text-gray-500">Vote is final - you cannot change it</span>
            </p>
          ) : (
            <p className="text-sm text-blue-600">Click on your prediction to vote!</p>
          )}

          {totalVotes > 0 && (
            <p className="text-xs text-gray-500 mt-2">Total votes: {totalVotes}</p>
          )}
        </div>
      </div>
    );
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!matchData) return <p>Loading statistics...</p>;

  const { generalInfo, homeTeam, awayTeam, extraInfo, statistics } = matchData;

  // Helper function to get player events (goals, assists, cards, substitutions)
  const getPlayerEvents = (playerId, playerName) => {
    const events = [];

    // Check for goals
    if (Array.isArray(extraInfo.goals)) {
      extraInfo.goals.forEach((goal) => {
        if (goal.scorer?.id === playerId || goal.scorer?.name === playerName) {
          events.push({ type: 'goal', minute: goal.minute, injuryTime: goal.injuryTime });
        }
        if (goal.assist?.id === playerId || goal.assist?.name === playerName) {
          events.push({ type: 'assist', minute: goal.minute, injuryTime: goal.injuryTime });
        }
      });
    }

    // Check for bookings (cards)
    if (Array.isArray(extraInfo.bookings)) {
      extraInfo.bookings.forEach((booking) => {
        if (booking.player?.id === playerId || booking.player?.name === playerName) {
          events.push({
            type: booking.card === 'YELLOW' ? 'yellowCard' : 'redCard',
            minute: booking.minute,
          });
        }
      });
    }

    // Check for substitutions
    if (Array.isArray(extraInfo.substitutions)) {
      extraInfo.substitutions.forEach((sub) => {
        if (sub.playerOut?.id === playerId || sub.playerOut?.name === playerName) {
          events.push({ type: 'substitutedOut', minute: sub.minute });
        }
        if (sub.playerIn?.id === playerId || sub.playerIn?.name === playerName) {
          events.push({ type: 'substitutedIn', minute: sub.minute });
        }
      });
    }

    return events;
  };

  // Helper function to render event icons
  const renderEventIcons = (events) => {
    if (events.length === 0) return null;

    return (
      <div className="flex items-center gap-1 mt-1">
        {events.map((event, idx) => {
          const displayMinute = event.injuryTime
            ? `${event.minute}+${event.injuryTime}`
            : event.minute;

          switch (event.type) {
            case 'goal':
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,3C13.76,3 15.4,3.53 16.78,4.41L16.5,5H13L12,5L10.28,4.16L10.63,3.13C11.08,3.05 11.53,3 12,3M9.53,3.38L9.19,4.41L6.63,5.69L5.38,5.94C6.5,4.73 7.92,3.84 9.53,3.38M13,6H16L18.69,9.59L17.44,12.16L14.81,12.78L11.53,8.94L13,6M6.16,6.66L7,10L5.78,13.06L3.22,13.94C3.08,13.31 3,12.67 3,12C3,10.1 3.59,8.36 4.59,6.91L6.16,6.66M20.56,9.22C20.85,10.09 21,11.03 21,12C21,13.44 20.63,14.79 20.03,16H19L18.16,12.66L19.66,9.66L20.56,9.22M8,10H11L13.81,13.28L12,16L8.84,16.78L6.53,13.69L8,10M12,17L15,19L14.22,20.91C13.5,21.3 12.77,21.6 12,21.72C11.33,21.61 10.7,21.39 10.09,21.08L9.47,19L12,17M18,19L15,19L13.75,16.5L16.66,15.89L18,19M4.81,15.41L7.31,14.75L8.83,17.34L7.34,19.96C5.64,18.79 4.39,17.25 3.82,15.41H4.81M15.53,21.19L16.47,19.5L18.81,19C17.26,20.5 15.29,21.5 13.08,21.91L15.53,21.19Z" />
                  </svg>
                  <span>{displayMinute}'</span>
                </div>
              );
            case 'assist':
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.5,16C20.5,17.38 19.38,18.5 18,18.5H6C4.62,18.5 3.5,17.38 3.5,16V15H2V13H3.5V12C3.5,10.62 4.62,9.5 6,9.5H7V8.5C7,7.12 8.12,6 9.5,6H14.5C15.88,6 17,7.12 17,8.5V9.5H18C19.38,9.5 20.5,10.62 20.5,12V13H22V15H20.5V16M18,11.5H6C5.72,11.5 5.5,11.72 5.5,12V16C5.5,16.28 5.72,16.5 6,16.5H18C18.28,16.5 18.5,16.28 18.5,16V12C18.5,11.72 18.28,11.5 18,11.5M15,8.5C15,8.22 14.78,8 14.5,8H9.5C9.22,8 9,8.22 9,8.5V9.5H15V8.5Z" />
                  </svg>
                  <span>{displayMinute}'</span>
                </div>
              );
            case 'yellowCard':
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-xs"
                >
                  <div className="w-2 h-3 bg-yellow-400 rounded-sm"></div>
                  <span>{event.minute}'</span>
                </div>
              );
            case 'redCard':
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs"
                >
                  <div className="w-2 h-3 bg-red-600 rounded-sm"></div>
                  <span>{event.minute}'</span>
                </div>
              );
            case 'substitutedOut':
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  <span>{event.minute}'</span>
                </div>
              );
            case 'substitutedIn':
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  <span>{event.minute}'</span>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md text-gray-900 dark:text-gray-100">
      {/* Match Header */}
      <div className="mb-8">
        {/* Teams and Score */}
        <div className="bg-gray-50 p-6 rounded-lg mb-4">
          <div className="grid grid-cols-7 items-center gap-4">
            {/* Home Team */}
            <div className="col-span-3">
              <div
                className="flex items-center justify-end gap-4 group cursor-pointer"
                onClick={() => navigate(`/team/${homeTeam.id}`)}
              >
                <div className="text-right">
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                    {homeTeam.name}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {homeTeam.leagueRank ? `League Rank: ${homeTeam.leagueRank}` : ''}
                  </span>
                </div>
                <img
                  src={homeTeam.crest}
                  alt={`${homeTeam.name} logo`}
                  className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                />
              </div>
            </div>

            {/* Score/Status */}
            <div className="col-span-1">
              <div className="flex flex-col items-center">
                {/* Show "vs" for matches that haven't started yet */}
                {generalInfo.status === 'SCHEDULED' ||
                generalInfo.status === 'TIMED' ||
                (generalInfo.status !== 'FINISHED' &&
                  generalInfo.status !== 'IN_PLAY' &&
                  generalInfo.status !== 'PAUSED' &&
                  !statistics?.homeTeam?.goals &&
                  !statistics?.awayTeam?.goals) ? (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">vs</div>
                    <time className="text-sm text-gray-500">
                      {generalInfo.date.split(' ob ')[1]}
                    </time>
                  </div>
                ) : (
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${
                        generalInfo.status === 'IN_PLAY' || generalInfo.status === 'PAUSED'
                          ? 'text-green-600'
                          : generalInfo.status === 'FINISHED'
                          ? 'text-gray-900'
                          : 'text-blue-600'
                      }`}
                    >
                      {statistics?.homeTeam?.goals !== undefined &&
                      statistics?.awayTeam?.goals !== undefined
                        ? `${statistics.homeTeam.goals} - ${statistics.awayTeam.goals}`
                        : 'vs'}
                    </div>
                    <div
                      className={`text-sm ${
                        generalInfo.status === 'IN_PLAY'
                          ? 'text-green-600 font-semibold'
                          : 'text-gray-500'
                      }`}
                    >
                      {generalInfo.status === 'PAUSED'
                        ? 'HALF TIME'
                        : generalInfo.status === 'IN_PLAY'
                        ? 'LIVE'
                        : generalInfo.status === 'FINISHED'
                        ? 'Finished'
                        : 'Upcoming'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Away Team */}
            <div className="col-span-3">
              <div
                className="flex items-center gap-4 group cursor-pointer"
                onClick={() => navigate(`/team/${awayTeam.id}`)}
              >
                <img
                  src={awayTeam.crest}
                  alt={`${awayTeam.name} logo`}
                  className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                />
                <div>
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                    {awayTeam.name}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {awayTeam.leagueRank ? `League Rank: ${awayTeam.leagueRank}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-8 px-16">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">Date</span>
              </div>
              <p className="mt-1 text-gray-900">
                {generalInfo.date.split(' ob ')[0]}
                <span className="text-gray-600 ml-2">at {generalInfo.date.split(' ob ')[1]}</span>
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="font-medium">Competition</span>
              </div>
              <p
                className="mt-1 text-gray-900 cursor-pointer hover:text-blue-600 transition-colors font-medium"
                onClick={() => {
                  // Try to extract competition code from the competition name or use a fallback
                  const competitionName =
                    generalInfo.competition || extraInfo.competition?.name || 'TBD';
                  if (competitionName !== 'TBD') {
                    // Map common competition names to their codes
                    const competitionCodeMap = {
                      'Primera Division': 'PD',
                      'Premier League': 'PL',
                      Bundesliga: 'BL1',
                      'Serie A': 'SA',
                      'Ligue 1': 'FL1',
                      Championship: 'ELC',
                      Eredivisie: 'DED',
                      'Primeira Liga': 'PPL',
                      'UEFA Champions League': 'CL',
                      'UEFA Europa League': 'EL',
                    };

                    const competitionCode =
                      competitionCodeMap[competitionName] ||
                      extraInfo.competition?.code ||
                      competitionName.replace(/\s+/g, '').toUpperCase();

                    navigate(`/competition/${competitionCode}`);
                  }
                }}
                title={`View ${
                  generalInfo.competition || extraInfo.competition?.name || 'TBD'
                } details`}
              >
                {generalInfo.competition || extraInfo.competition?.name || 'TBD'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <span className="font-medium">Venue</span>
              </div>
              <p className="mt-1 text-gray-900">{generalInfo.venue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('lineups')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lineups'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lineups
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'statistics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistics
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Coaches Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Team Management</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{homeTeam.name}</p>
                        <p className="text-sm text-gray-600">Head Coach</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{homeTeam.coach.name || 'Not available'}</p>
                        <p className="text-sm text-gray-600">
                          {homeTeam.coach.nationality || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{awayTeam.name}</p>
                        <p className="text-sm text-gray-600">Head Coach</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{awayTeam.coach.name || 'Not available'}</p>
                        <p className="text-sm text-gray-600">
                          {awayTeam.coach.nationality || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Events Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Match Events</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Goals</span>
                      <div className="flex items-center gap-2 min-w-[60px] justify-end">
                        <span className="font-medium w-4 text-right">
                          {Array.isArray(extraInfo.goals)
                            ? extraInfo.goals.length === 0
                              ? '0'
                              : extraInfo.goals.length
                            : '0'}
                        </span>
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,3C13.76,3 15.4,3.53 16.78,4.41L16.5,5H13L12,5L10.28,4.16L10.63,3.13C11.08,3.05 11.53,3 12,3M9.53,3.38L9.19,4.41L6.63,5.69L5.38,5.94C6.5,4.73 7.92,3.84 9.53,3.38M13,6H16L18.69,9.59L17.44,12.16L14.81,12.78L11.53,8.94L13,6M6.16,6.66L7,10L5.78,13.06L3.22,13.94C3.08,13.31 3,12.67 3,12C3,10.1 3.59,8.36 4.59,6.91L6.16,6.66M20.56,9.22C20.85,10.09 21,11.03 21,12C21,13.44 20.63,14.79 20.03,16H19L18.16,12.66L19.66,9.66L20.56,9.22M8,10H11L13.81,13.28L12,16L8.84,16.78L6.53,13.69L8,10M12,17L15,19L14.22,20.91C13.5,21.3 12.77,21.6 12,21.72C11.33,21.61 10.7,21.39 10.09,21.08L9.47,19L12,17M18,19L15,19L13.75,16.5L16.66,15.89L18,19M4.81,15.41L7.31,14.75L8.83,17.34L7.34,19.96C5.64,18.79 4.39,17.25 3.82,15.41H4.81M15.53,21.19L16.47,19.5L18.81,19C17.26,20.5 15.29,21.5 13.08,21.91L15.53,21.19Z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Yellow Cards</span>
                      <div className="flex items-center gap-2 min-w-[60px] justify-end">
                        <span className="font-medium w-4 text-right">
                          {Array.isArray(extraInfo.bookings)
                            ? extraInfo.bookings.filter((booking) => booking.card === 'YELLOW')
                                .length
                            : '0'}
                        </span>
                        <div className="w-4 h-6 bg-yellow-400 rounded"></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Red Cards</span>
                      <div className="flex items-center gap-2 min-w-[60px] justify-end">
                        <span className="font-medium w-4 text-right">
                          {Array.isArray(extraInfo.bookings)
                            ? extraInfo.bookings.filter((booking) => booking.card === 'RED').length
                            : '0'}
                        </span>
                        <div className="w-4 h-6 bg-red-600 rounded"></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Substitutions</span>
                      <div className="flex items-center gap-2 min-w-[60px] justify-end">
                        <span className="font-medium w-4 text-right">
                          {Array.isArray(extraInfo.substitutions)
                            ? extraInfo.substitutions.length === 0
                              ? '0'
                              : extraInfo.substitutions.length
                            : '0'}
                        </span>
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referees Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Match Officials</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.isArray(generalInfo.referees) && generalInfo.referees.length > 0 ? (
                    generalInfo.referees.map((referee, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-center">
                          <p className="font-medium text-gray-900">{referee.name}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {referee.type === 'REFEREE'
                              ? 'Main Referee'
                              : referee.type === 'ASSISTANT_REFEREE_N1'
                              ? 'Assistant Referee 1'
                              : referee.type === 'ASSISTANT_REFEREE_N2'
                              ? 'Assistant Referee 2'
                              : referee.type
                                  .replace(/_/g, ' ')
                                  .toLowerCase()
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {referee.nationality || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-500 text-center">Referee information not available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <VotingPoll />
          </div>
        )}

        {/* Lineups Tab */}
        {activeTab === 'lineups' && (
          <div className="space-y-8">
            {/* Home Team */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">{homeTeam.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Formation: {homeTeam.formation || 'Unknown'}</span>
                    {homeTeam.leagueRank && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Rank: {homeTeam.leagueRank}
                      </span>
                    )}
                  </div>
                </div>
                <img
                  src={homeTeam.crest}
                  alt={homeTeam.name}
                  className="h-12 w-12 object-contain"
                />
              </div>

              {/* Starting XI */}
              <div className="mb-6">
                <h4 className="font-semibold mb-4 text-lg">Starting XI</h4>

                {/* Group players by position */}
                {(() => {
                  const sortedPlayers = homeTeam.lineup.sort((a, b) => {
                    const getPositionPriority = (position) => {
                      if (position.includes('Goalkeeper')) return 1;
                      if (position.includes('Back') || position.includes('Defence')) return 2;
                      if (position.includes('Midfield')) return 3;
                      if (
                        position.includes('Offence') ||
                        position.includes('Forward') ||
                        position.includes('Winger')
                      )
                        return 4;
                      return 5;
                    };
                    return getPositionPriority(a.position) - getPositionPriority(b.position);
                  });

                  const goalkeeper = sortedPlayers.filter((p) => p.position.includes('Goalkeeper'));
                  const defenders = sortedPlayers.filter(
                    (p) => p.position.includes('Back') || p.position.includes('Defence')
                  );
                  const midfielders = sortedPlayers.filter((p) => p.position.includes('Midfield'));
                  const attackers = sortedPlayers.filter(
                    (p) =>
                      p.position.includes('Offence') ||
                      p.position.includes('Forward') ||
                      p.position.includes('Winger')
                  );

                  return (
                    <div className="space-y-4">
                      {/* Goalkeeper */}
                      {goalkeeper.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Goalkeeper</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {goalkeeper.map((player, idx) => (
                              <div
                                key={`gk-${idx}`}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {player.shirtNumber || '?'}
                                </div>
                                <div className="flex-1">
                                  <span
                                    className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => navigate(`/player/${player.id}`)}
                                    title={`View ${player.name}'s details`}
                                  >
                                    {player.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({player.position || 'N/A'})
                                  </span>
                                  {renderEventIcons(getPlayerEvents(player.id, player.name))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Defence */}
                      {defenders.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Defence</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {defenders.map((player, idx) => (
                              <div
                                key={`def-${idx}`}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {player.shirtNumber || '?'}
                                </div>
                                <div className="flex-1">
                                  <span
                                    className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => navigate(`/player/${player.id}`)}
                                    title={`View ${player.name}'s details`}
                                  >
                                    {player.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({player.position || 'N/A'})
                                  </span>
                                  {renderEventIcons(getPlayerEvents(player.id, player.name))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Midfield */}
                      {midfielders.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Midfield</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {midfielders.map((player, idx) => (
                              <div
                                key={`mid-${idx}`}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {player.shirtNumber || '?'}
                                </div>
                                <div className="flex-1">
                                  <span
                                    className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => navigate(`/player/${player.id}`)}
                                    title={`View ${player.name}'s details`}
                                  >
                                    {player.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({player.position || 'N/A'})
                                  </span>
                                  {renderEventIcons(getPlayerEvents(player.id, player.name))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attack */}
                      {attackers.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Attack</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {attackers.map((player, idx) => (
                              <div
                                key={`att-${idx}`}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {player.shirtNumber || '?'}
                                </div>
                                <div className="flex-1">
                                  <span
                                    className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => navigate(`/player/${player.id}`)}
                                    title={`View ${player.name}'s details`}
                                  >
                                    {player.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({player.position || 'N/A'})
                                  </span>
                                  {renderEventIcons(getPlayerEvents(player.id, player.name))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Substitutes and Changes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Substitutes</h4>
                  <div className="space-y-2">
                    {homeTeam.bench.map((player, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {player.shirtNumber || '?'}
                        </div>
                        <div className="flex-1">
                          <span
                            className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => navigate(`/player/${player.id}`)}
                            title={`View ${player.name}'s details`}
                          >
                            {player.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({player.position || 'N/A'})
                          </span>
                          {renderEventIcons(getPlayerEvents(player.id, player.name))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Substitutions</h4>
                  <div className="space-y-2">
                    {Array.isArray(extraInfo.substitutions) &&
                      extraInfo.substitutions
                        .filter((sub) => sub.team.id === homeTeam.id)
                        .map((sub, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded"
                          >
                            <span className="text-green-600">↑</span>
                            <span
                              className="cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => navigate(`/player/${sub.playerIn.id}`)}
                              title={`View ${sub.playerIn.name}'s details`}
                            >
                              {sub.playerIn.name}
                            </span>
                            <span className="text-gray-400 mx-1">for</span>
                            <span className="text-red-600">↓</span>
                            <span
                              className="cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => navigate(`/player/${sub.playerOut.id}`)}
                              title={`View ${sub.playerOut.name}'s details`}
                            >
                              {sub.playerOut.name}
                            </span>
                            <span className="text-gray-500 ml-auto">{sub.minute}'</span>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Away Team */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">{awayTeam.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Formation: {awayTeam.formation || 'Unknown'}</span>
                    {awayTeam.leagueRank && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Rank: {awayTeam.leagueRank}
                      </span>
                    )}
                  </div>
                </div>
                <img
                  src={awayTeam.crest}
                  alt={awayTeam.name}
                  className="h-12 w-12 object-contain"
                />
              </div>

              {/* Starting XI */}
              <div className="mb-6">
                <h4 className="font-semibold mb-4 text-lg">Starting XI</h4>

                {/* Group players by position */}
                {(() => {
                  const sortedPlayers = awayTeam.lineup.sort((a, b) => {
                    const getPositionPriority = (position) => {
                      if (position.includes('Goalkeeper')) return 1;
                      if (position.includes('Back') || position.includes('Defence')) return 2;
                      if (position.includes('Midfield')) return 3;
                      if (
                        position.includes('Offence') ||
                        position.includes('Forward') ||
                        position.includes('Winger')
                      )
                        return 4;
                      return 5;
                    };
                    return getPositionPriority(a.position) - getPositionPriority(b.position);
                  });

                  const goalkeeper = sortedPlayers.filter((p) => p.position.includes('Goalkeeper'));
                  const defenders = sortedPlayers.filter(
                    (p) => p.position.includes('Back') || p.position.includes('Defence')
                  );
                  const midfielders = sortedPlayers.filter((p) => p.position.includes('Midfield'));
                  const attackers = sortedPlayers.filter(
                    (p) =>
                      p.position.includes('Offence') ||
                      p.position.includes('Forward') ||
                      p.position.includes('Winger')
                  );

                  return (
                    <div className="space-y-4">
                      {/* Goalkeeper */}
                      {goalkeeper.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Goalkeeper</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {goalkeeper.map((player, idx) => (
                              <div
                                key={`gk-${idx}`}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {player.shirtNumber || '?'}
                                </div>
                                <div className="flex-1">
                                  <span
                                    className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => navigate(`/player/${player.id}`)}
                                    title={`View ${player.name}'s details`}
                                  >
                                    {player.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({player.position || 'N/A'})
                                  </span>
                                  {renderEventIcons(getPlayerEvents(player.id, player.name))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Defence */}
                      {defenders.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Defence</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {defenders.map((player, idx) => (
                              <div
                                key={`def-${idx}`}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {player.shirtNumber || '?'}
                                </div>
                                <div className="flex-1">
                                  <span
                                    className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => navigate(`/player/${player.id}`)}
                                    title={`View ${player.name}'s details`}
                                  >
                                    {player.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({player.position || 'N/A'})
                                  </span>
                                  {renderEventIcons(getPlayerEvents(player.id, player.name))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Midfield */}
                      {midfielders.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Midfield</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {midfielders.map((player, idx) => (
                              <div
                                key={`mid-${idx}`}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {player.shirtNumber || '?'}
                                </div>
                                <div className="flex-1">
                                  <span
                                    className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => navigate(`/player/${player.id}`)}
                                    title={`View ${player.name}'s details`}
                                  >
                                    {player.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({player.position || 'N/A'})
                                  </span>
                                  {renderEventIcons(getPlayerEvents(player.id, player.name))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attack */}
                      {attackers.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Attack</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {attackers.map((player, idx) => (
                              <div
                                key={`att-${idx}`}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {player.shirtNumber || '?'}
                                </div>
                                <div className="flex-1">
                                  <span
                                    className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => navigate(`/player/${player.id}`)}
                                    title={`View ${player.name}'s details`}
                                  >
                                    {player.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({player.position || 'N/A'})
                                  </span>
                                  {renderEventIcons(getPlayerEvents(player.id, player.name))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Substitutes and Changes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Substitutes</h4>
                  <div className="space-y-2">
                    {awayTeam.bench.map((player, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {player.shirtNumber || '?'}
                        </div>
                        <div className="flex-1">
                          <span
                            className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => navigate(`/player/${player.id}`)}
                            title={`View ${player.name}'s details`}
                          >
                            {player.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({player.position || 'N/A'})
                          </span>
                          {renderEventIcons(getPlayerEvents(player.id, player.name))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Substitutions</h4>
                  <div className="space-y-2">
                    {Array.isArray(extraInfo.substitutions) &&
                      extraInfo.substitutions
                        .filter((sub) => sub.team.id === awayTeam.id)
                        .map((sub, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded"
                          >
                            <span className="text-green-600">↑</span>
                            <span
                              className="cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => navigate(`/player/${sub.playerIn.id}`)}
                              title={`View ${sub.playerIn.name}'s details`}
                            >
                              {sub.playerIn.name}
                            </span>
                            <span className="text-gray-400 mx-1">for</span>
                            <span className="text-red-600">↓</span>
                            <span
                              className="cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => navigate(`/player/${sub.playerOut.id}`)}
                              title={`View ${sub.playerOut.name}'s details`}
                            >
                              {sub.playerOut.name}
                            </span>
                            <span className="text-gray-500 ml-auto">{sub.minute}'</span>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">Match Statistics</h3>
                {isRefreshing && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <p className="text-gray-600">Detailed comparison between both teams</p>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                  {matchData && (
                    <span className="ml-2 text-gray-400">
                      • Next update:{' '}
                      {matchData.generalInfo?.status === 'FINISHED'
                        ? 'Tomorrow'
                        : matchData.generalInfo?.status === 'IN_PLAY' ||
                          matchData.generalInfo?.status === 'PAUSED'
                        ? '15s'
                        : matchData.generalInfo?.status === 'SCHEDULED'
                        ? '10min'
                        : '30s'}
                    </span>
                  )}
                </p>
              )}
              {/* Live indicator */}
              {(generalInfo.status === 'IN_PLAY' || generalInfo.status === 'PAUSED') && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-600 uppercase tracking-wide">
                    {generalInfo.status === 'PAUSED' ? 'HALF TIME' : 'LIVE'}
                  </span>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Check if statistics are available */}
            {!statistics ||
            Object.keys(statistics.homeTeam || {}).length === 0 ||
            (statistics?.homeTeam?.goals === undefined &&
              statistics?.awayTeam?.goals === undefined) ||
            generalInfo.status === 'TIMED' ||
            generalInfo.status === 'SCHEDULED' ? (
              // No statistics available - show placeholder
              <div className="text-center py-16">
                <div className="mb-6">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Statistics Not Available
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {generalInfo.status === 'SCHEDULED'
                    ? 'Match statistics will be available once the game begins. Check back when the match is live!'
                    : 'Statistics data is currently unavailable for this match.'}
                </p>

                {/* Team preview cards for scheduled matches */}
                {generalInfo.status === 'SCHEDULED' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-2xl mx-auto">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <img
                          src={homeTeam.crest}
                          alt={homeTeam.name}
                          className="w-12 h-12 object-contain"
                        />
                        <h4 className="text-lg font-semibold text-blue-900">{homeTeam.name}</h4>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-700">Home Team</p>
                        {homeTeam.leagueRank && (
                          <p className="text-xs text-blue-600 mt-1">
                            League Rank: {homeTeam.leagueRank}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <img
                          src={awayTeam.crest}
                          alt={awayTeam.name}
                          className="w-12 h-12 object-contain"
                        />
                        <h4 className="text-lg font-semibold text-red-900">{awayTeam.name}</h4>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-red-700">Away Team</p>
                        {awayTeam.leagueRank && (
                          <p className="text-xs text-red-600 mt-1">
                            League Rank: {awayTeam.leagueRank}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Match info card */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-6 max-w-md mx-auto">
                  <h5 className="font-semibold text-gray-900 mb-3">Match Information</h5>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Date:</span> {generalInfo.date}
                    </p>
                    <p>
                      <span className="font-medium">Venue:</span> {generalInfo.venue}
                    </p>
                    <p>
                      <span className="font-medium">Competition:</span>{' '}
                      {generalInfo.competition || extraInfo.competition?.name || 'TBD'}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>
                      <span
                        className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                          generalInfo.status === 'SCHEDULED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {generalInfo.status === 'SCHEDULED'
                          ? 'Upcoming'
                          : generalInfo.status === 'IN_PLAY'
                          ? 'LIVE'
                          : generalInfo.status === 'FINISHED'
                          ? 'Finished'
                          : generalInfo.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Statistics are available - show normal view
              <>
                {/* Team Headers */}
                <div className="grid grid-cols-3 items-center gap-4 mb-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={homeTeam.crest}
                        alt={homeTeam.name}
                        className="w-10 h-10 object-contain"
                      />
                      <h4 className="text-lg font-semibold text-gray-900">{homeTeam.name}</h4>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      VS
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3">
                      <h4 className="text-lg font-semibold text-gray-900">{awayTeam.name}</h4>
                      <img
                        src={awayTeam.crest}
                        alt={awayTeam.name}
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Statistics Comparison */}
                <div className="space-y-6">
                  {Object.entries(statistics.homeTeam).map(([key, homeValue]) => {
                    const awayValue = statistics.awayTeam[key];
                    const statName = key
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase());

                    // Calculate percentages for progress bars (handle different stat types)
                    let homePercentage = 0;
                    let awayPercentage = 0;

                    if (key.includes('percentage') || key.includes('accuracy')) {
                      // For percentage stats, use the values directly
                      homePercentage = parseFloat(homeValue) || 0;
                      awayPercentage = parseFloat(awayValue) || 0;
                    } else {
                      // For count stats, calculate relative percentages
                      const total = (parseFloat(homeValue) || 0) + (parseFloat(awayValue) || 0);
                      if (total > 0) {
                        homePercentage = ((parseFloat(homeValue) || 0) / total) * 100;
                        awayPercentage = ((parseFloat(awayValue) || 0) / total) * 100;
                      }
                    }

                    return (
                      <div
                        key={`${key}-${homeValue}-${awayValue}`}
                        className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all duration-300"
                      >
                        {/* Stat Name */}
                        <div className="text-center mb-4">
                          <h5 className="text-lg font-semibold text-gray-800">{statName}</h5>
                        </div>

                        {/* Values and Progress Bars */}
                        <div className="grid grid-cols-3 items-center gap-6">
                          {/* Home Team */}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600 mb-2 transition-all duration-500">
                              {homeValue}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(homePercentage, 100)}%` }}
                              ></div>
                            </div>
                            {!key.includes('percentage') && !key.includes('accuracy') && (
                              <div className="text-sm text-gray-500 mt-1 transition-all duration-500">
                                {homePercentage.toFixed(1)}%
                              </div>
                            )}
                          </div>

                          {/* VS Divider */}
                          <div className="text-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                              <span className="text-xs font-medium text-gray-600">VS</span>
                            </div>
                          </div>

                          {/* Away Team */}
                          <div className="text-left">
                            <div className="text-2xl font-bold text-red-600 mb-2 transition-all duration-500">
                              {awayValue}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-red-500 h-3 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(awayPercentage, 100)}%` }}
                              ></div>
                            </div>
                            {!key.includes('percentage') && !key.includes('accuracy') && (
                              <div className="text-sm text-gray-500 mt-1 transition-all duration-500">
                                {awayPercentage.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Winner Indicator */}
                        {homeValue !== awayValue && (
                          <div className="text-center mt-3">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                                parseFloat(homeValue) > parseFloat(awayValue)
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {parseFloat(homeValue) > parseFloat(awayValue)
                                ? `${homeTeam.shortName || homeTeam.name} leads`
                                : `${awayTeam.shortName || awayTeam.name} leads`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 transition-all duration-500">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2 transition-all duration-500">
                        {statistics?.homeTeam?.goals !== undefined
                          ? statistics.homeTeam.goals
                          : '-'}
                      </div>
                      <div className="text-sm font-medium text-blue-800">
                        {homeTeam.shortName || homeTeam.name} Goals
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200 transition-all duration-500">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-600 mb-2">
                        {generalInfo.status === 'SCHEDULED' ? 'Match Score' : 'Final Score'}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 transition-all duration-500">
                        {statistics?.homeTeam?.goals !== undefined &&
                        statistics?.awayTeam?.goals !== undefined
                          ? `${statistics.homeTeam.goals} - ${statistics.awayTeam.goals}`
                          : 'vs'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200 transition-all duration-500">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 mb-2 transition-all duration-500">
                        {statistics?.awayTeam?.goals !== undefined
                          ? statistics.awayTeam.goals
                          : '-'}
                      </div>
                      <div className="text-sm font-medium text-red-800">
                        {awayTeam.shortName || awayTeam.name} Goals
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
