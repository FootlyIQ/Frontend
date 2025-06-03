import { useState, useEffect } from 'react';

export const useLiveMatchStatus = (favoriteMatches) => {
  const [liveStatuses, setLiveStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!favoriteMatches || favoriteMatches.length === 0) {
      setLiveStatuses({});
      return;
    }

    const fetchLiveStatuses = async () => {
      setIsLoading(true);
      const newStatuses = {};

      try {
        // Batch fetch to minimize API calls - check matches more intelligently
        const recentMatches = favoriteMatches.filter((match) => {
          try {
            // Handle different date formats that might be in the match data
            let matchDate;
            if (match.date) {
              // Try different date parsing approaches
              if (match.date.includes('T')) {
                matchDate = new Date(match.date);
              } else if (match.date.includes('/')) {
                matchDate = new Date(match.date);
              } else if (match.date.includes('-')) {
                matchDate = new Date(match.date);
              } else {
                // If it's just a date string, try to parse it
                matchDate = new Date(match.date);
              }
            } else {
              // If no date, assume it's recent and include it
              return true;
            }

            const now = new Date();
            const daysDiff = Math.abs(now - matchDate) / (1000 * 60 * 60 * 24);

            // Include matches from last 7 days AND next 1 day (to catch all relevant matches)
            return daysDiff <= 7;
          } catch (error) {
            console.error(`Error parsing date for match ${match.id}:`, error);
            // If date parsing fails, include the match anyway
            return true;
          }
        });

        // If no matches pass the date filter, check all matches anyway (fallback)
        const matchesToCheck = recentMatches.length > 0 ? recentMatches : favoriteMatches;

        // Check all recent matches, not just 5
        for (const match of matchesToCheck) {
          try {
            const response = await fetch(`https://footlyiq-backend.onrender.com/match-statistics/${match.id}`);
            if (response.ok) {
              const data = await response.json();
              const status = data.generalInfo?.status || match.status;
              const score =
                data.statistics?.homeTeam?.goals !== undefined &&
                data.statistics?.awayTeam?.goals !== undefined
                  ? `${data.statistics.homeTeam.goals}-${data.statistics.awayTeam.goals}`
                  : null;

              newStatuses[match.id] = {
                status,
                score,
                lastUpdated: new Date().toISOString(),
              };
            } else {
              // Fallback to stored status if API fails
              newStatuses[match.id] = {
                status: match.status,
                score: match.score,
                lastUpdated: new Date().toISOString(),
              };
            }
          } catch (error) {
            console.error(`Error fetching status for match ${match.id}:`, error);
            // Fallback to stored status
            newStatuses[match.id] = {
              status: match.status,
              score: match.score,
              lastUpdated: new Date().toISOString(),
            };
          }

          // Small delay between requests to avoid hitting rate limits
          await new Promise((resolve) => setTimeout(resolve, 100)); // Reduced delay to 100ms
        }

        setLiveStatuses(newStatuses);
      } catch (error) {
        console.error('Error fetching live statuses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchLiveStatuses();

    // Set up periodic refresh (every 2 minutes for more responsive updates)
    const interval = setInterval(fetchLiveStatuses, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [JSON.stringify(favoriteMatches)]); // Use JSON.stringify to detect actual changes in favorites

  // Helper function to get display status
  const getDisplayStatus = (match) => {
    const liveStatus = liveStatuses[match.id];
    if (liveStatus) {
      return {
        status: liveStatus.status,
        score: liveStatus.score,
        isLive: liveStatus.status === 'IN_PLAY' || liveStatus.status === 'PAUSED',
      };
    }

    // Fallback to stored data
    return {
      status: match.status,
      score: match.score,
      isLive: false,
    };
  };

  return {
    liveStatuses,
    isLoading,
    getDisplayStatus,
  };
};
