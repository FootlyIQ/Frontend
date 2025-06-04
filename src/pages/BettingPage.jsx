import React, { useEffect, useState } from 'react';

// Loading Screen Component
const BettingLoadingScreen = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with animated title */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full animate-pulse"></div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Loading Betting Odds
          </h1>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse"></div>
        </div>

        {/* Animated progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
          <span className="text-sm text-gray-600 ml-3">Fetching live odds from bookmakers...</span>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Skeleton cards for upcoming matches */}
      <div className="space-y-4">
        {[1, 2, 3].map((index) => (
          <div key={index} className="border rounded-lg p-6 shadow-sm bg-white animate-pulse">
            {/* Match header skeleton */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-24 ml-auto"></div>
            </div>

            {/* Teams skeleton */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                <div className="h-5 bg-gray-300 rounded w-24"></div>
              </div>
              <div className="text-2xl font-bold text-gray-300">VS</div>
              <div className="flex items-center gap-2">
                <div className="h-5 bg-gray-300 rounded w-24"></div>
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
            </div>

            {/* Odds skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[1, 2, 3].map((oddIndex) => (
                <div key={oddIndex} className="p-4 border rounded-lg bg-gray-50">
                  <div className="h-4 bg-gray-300 rounded w-16 mx-auto mb-2"></div>
                  <div className="h-6 bg-gray-400 rounded w-12 mx-auto"></div>
                </div>
              ))}
            </div>

            {/* Bookmaker info skeleton */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Fun betting facts while loading */}
      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-green-800">Did you know?</span>
          </div>
          <p className="text-sm text-green-700">
            Odds change in real-time based on betting patterns and team news. We're fetching the
            latest data for you!
          </p>
        </div>
      </div>

      {/* Loading indicators */}
      <div className="fixed bottom-4 right-4 bg-white rounded-full shadow-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600 font-medium">Loading odds...</span>
        </div>
      </div>
    </div>
  );
};

export default function BettingPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOdds = async () => {
      try {
        const res = await fetch('https://footlyiq-backend.onrender.com/odds');
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        console.error('Error fetching odds:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOdds();
  }, []);

  if (loading) return <BettingLoadingScreen />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upcoming Betting Odds</h1>

      {matches.length === 0 && <p>No betting data available right now.</p>}

      {matches.map((match) => {
        const bookmaker = match.bookmakers?.[0];
        const market = bookmaker?.markets?.find((m) => m.key === 'h2h');
        const outcomes = market?.outcomes || [];

        return (
          <div key={match.id} className="border rounded-lg p-4 mb-4 shadow-sm bg-white">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">{match.sport_title}</h2>
            <p className="text-sm text-gray-600 mb-2">
              {new Date(match.commence_time).toLocaleString()}
            </p>
            <p className="font-medium text-gray-800 mb-2">
              {match.home_team} vs {match.away_team}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {outcomes.map((outcome) => (
                <div key={outcome.name} className="p-2 border rounded text-center bg-gray-100">
                  <div className="font-semibold text-gray-700">{outcome.name}</div>
                  <div className="text-blue-600 text-lg">{outcome.price}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-2">Bookmaker: {bookmaker?.title}</p>
          </div>
        );
      })}
    </div>
  );
}