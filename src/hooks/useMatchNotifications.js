import { useState, useEffect, useRef } from 'react';
import { useFavorites } from './useFavorites';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';

export const useMatchNotifications = () => {
  const [user] = useAuthState(auth);
  const { favorites } = useFavorites();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const previousMatchDataRef = useRef(new Map());
  const monitoringIntervalRef = useRef(null);

  // Show notification (reuse from favorites)
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-0 max-w-sm`;

    if (type === 'goal') {
      notification.className += ' bg-green-600 text-white';
    } else if (type === 'start') {
      notification.className += ' bg-blue-600 text-white';
    } else if (type === 'error') {
      notification.className += ' bg-red-500 text-white';
    } else {
      notification.className += ' bg-purple-600 text-white';
    }

    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="text-lg">
          ${type === 'goal' ? '⚽' : type === 'start' ? '🟢' : type === 'error' ? '❌' : '🔔'}
        </div>
        <div class="font-medium text-sm">${message}</div>
      </div>
    `;

    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000); // Show for 5 seconds for match notifications
  };

  // Fetch current match data for monitoring
  const fetchMatchData = async (matchId) => {
    try {
      const response = await fetch(`http://localhost:5000/match-statistics/${matchId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching match data:', error);
      return null;
    }
  };

  // Fetch today's matches to monitor club matches
  const fetchTodaysMatches = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`http://localhost:5000/matches?date=${today}`);
      if (!response.ok) return [];

      const data = await response.json();
      const allMatches = [];

      // Flatten the data structure to get all matches
      data.forEach((country) => {
        country.leagues.forEach((league) => {
          league.matches.forEach((match) => {
            allMatches.push({
              ...match,
              league: league.league,
            });
          });
        });
      });

      return allMatches;
    } catch (error) {
      console.error("Error fetching today's matches:", error);
      return [];
    }
  };

  // Monitor favorite matches for score changes
  const monitorFavoriteMatches = async () => {
    if (!favorites.matches.length) return;

    for (const favoriteMatch of favorites.matches) {
      // Check if we have previous data for this match
      const previousData = previousMatchDataRef.current.get(favoriteMatch.id);

      // Skip finished matches to save API calls
      if (
        previousData &&
        (previousData.status === 'FINISHED' ||
          previousData.status === 'AWARDED' ||
          previousData.status === 'POSTPONED' ||
          previousData.status === 'CANCELLED' ||
          previousData.status === 'SUSPENDED')
      ) {
        continue; // Skip API call for finished/final matches
      }

      const currentData = await fetchMatchData(favoriteMatch.id);
      if (!currentData) continue;

      const currentStatus = currentData.generalInfo?.status;
      const currentScore =
        currentData.statistics?.homeTeam?.goals !== undefined &&
        currentData.statistics?.awayTeam?.goals !== undefined
          ? `${currentData.statistics.homeTeam.goals}-${currentData.statistics.awayTeam.goals}`
          : null;

      if (previousData && currentScore && previousData.score !== currentScore) {
        // Score changed - show notification
        const homeGoals = currentData.statistics.homeTeam.goals;
        const awayGoals = currentData.statistics.awayTeam.goals;
        const prevHomeGoals = parseInt(previousData.score.split('-')[0]) || 0;
        const prevAwayGoals = parseInt(previousData.score.split('-')[1]) || 0;

        let message = `${favoriteMatch.homeTeam} ${homeGoals}-${awayGoals} ${favoriteMatch.awayTeam}`;

        if (homeGoals > prevHomeGoals) {
          message = `⚽ GOAL! ${favoriteMatch.homeTeam} scores! ${homeGoals}-${awayGoals}`;
        } else if (awayGoals > prevAwayGoals) {
          message = `⚽ GOAL! ${favoriteMatch.awayTeam} scores! ${homeGoals}-${awayGoals}`;
        }

        showNotification(message, 'goal');
      }

      // Check if match just finished
      if (
        previousData &&
        previousData.status !== 'FINISHED' &&
        currentStatus === 'FINISHED' &&
        currentScore
      ) {
        showNotification(
          `🏁 FINAL: ${favoriteMatch.homeTeam} ${currentScore} ${favoriteMatch.awayTeam}`,
          'goal'
        );
      }

      // Update stored data
      previousMatchDataRef.current.set(favoriteMatch.id, {
        score: currentScore,
        status: currentStatus,
      });
    }
  };

  // Monitor favorite clubs for match starts
  const monitorFavoriteClubs = async () => {
    if (!favorites.clubs.length) return;

    const todaysMatches = await fetchTodaysMatches();

    for (const favoriteClub of favorites.clubs) {
      // Find matches where this club is playing
      const clubMatches = todaysMatches.filter(
        (match) => match.home_team === favoriteClub.name || match.away_team === favoriteClub.name
      );

      for (const match of clubMatches) {
        const matchKey = `club_${favoriteClub.id}_${match.match_id}`;
        const previousStatus = previousMatchDataRef.current.get(matchKey);

        // Skip finished matches to save processing
        if (
          previousStatus &&
          (previousStatus === 'FINISHED' ||
            previousStatus === 'AWARDED' ||
            previousStatus === 'POSTPONED' ||
            previousStatus === 'CANCELLED' ||
            previousStatus === 'SUSPENDED')
        ) {
          continue; // Skip finished matches
        }

        // Skip if current match is already finished
        if (
          match.status === 'FINISHED' ||
          match.status === 'AWARDED' ||
          match.status === 'POSTPONED' ||
          match.status === 'CANCELLED' ||
          match.status === 'SUSPENDED'
        ) {
          // Update status and skip
          previousMatchDataRef.current.set(matchKey, match.status);
          continue;
        }

        if (!previousStatus && match.status === 'IN_PLAY') {
          // Match just started
          const opponent =
            match.home_team === favoriteClub.name ? match.away_team : match.home_team;
          const isHome = match.home_team === favoriteClub.name;

          showNotification(
            `🟢 ${favoriteClub.name} vs ${opponent} has started! ${isHome ? '(Home)' : '(Away)'}`,
            'start'
          );
        } else if (previousStatus === 'SCHEDULED' && match.status === 'IN_PLAY') {
          // Status changed from scheduled to live
          const opponent =
            match.home_team === favoriteClub.name ? match.away_team : match.home_team;
          const isHome = match.home_team === favoriteClub.name;

          showNotification(
            `🟢 ${favoriteClub.name} vs ${opponent} has started! ${isHome ? '(Home)' : '(Away)'}`,
            'start'
          );
        }

        // Update stored status
        previousMatchDataRef.current.set(matchKey, match.status);
      }
    }
  };

  // Main monitoring function
  const runMonitoring = async () => {
    if (!user || (!favorites.matches.length && !favorites.clubs.length)) {
      return;
    }

    try {
      // Clean up old data periodically (every 10 monitoring cycles)
      const now = Date.now();
      if (!runMonitoring.lastCleanup || now - runMonitoring.lastCleanup > 300000) {
        // 5 minutes
        cleanupOldData();
        runMonitoring.lastCleanup = now;
      }

      // Count how many matches we'll actually monitor (skip finished ones)
      let activeMatchCount = 0;
      let skippedMatchCount = 0;

      // Count active favorite matches
      for (const favoriteMatch of favorites.matches) {
        const previousData = previousMatchDataRef.current.get(favoriteMatch.id);
        if (
          previousData &&
          (previousData.status === 'FINISHED' ||
            previousData.status === 'AWARDED' ||
            previousData.status === 'POSTPONED' ||
            previousData.status === 'CANCELLED' ||
            previousData.status === 'SUSPENDED')
        ) {
          skippedMatchCount++;
        } else {
          activeMatchCount++;
        }
      }

      console.log(
        `🔄 Monitoring: ${activeMatchCount} active matches, ${skippedMatchCount} finished (skipped), ${favorites.clubs.length} clubs`
      );

      await Promise.all([monitorFavoriteMatches(), monitorFavoriteClubs()]);
    } catch (error) {
      console.error('Error in monitoring:', error);
    }
  };

  // Clean up old finished match data to prevent memory leaks
  const cleanupOldData = () => {
    const keysToRemove = [];
    const currentFavoriteIds = new Set(favorites.matches.map((m) => m.id));
    const currentClubIds = new Set(favorites.clubs.map((c) => c.id));

    for (const [key, data] of previousMatchDataRef.current.entries()) {
      // Remove data for matches no longer in favorites
      if (key.startsWith('club_')) {
        const clubId = parseInt(key.split('_')[1]);
        if (!currentClubIds.has(clubId)) {
          keysToRemove.push(key);
        }
      } else {
        const matchId = parseInt(key);
        if (!currentFavoriteIds.has(matchId)) {
          keysToRemove.push(key);
        }
      }
    }

    // Remove old data
    keysToRemove.forEach((key) => {
      previousMatchDataRef.current.delete(key);
    });

    if (keysToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${keysToRemove.length} old match data entries`);
    }
  };

  // Start monitoring
  const startMonitoring = () => {
    if (monitoringIntervalRef.current) return;

    setIsMonitoring(true);
    // Check every 30 seconds for updates
    monitoringIntervalRef.current = setInterval(runMonitoring, 30000);

    // Run once immediately
    runMonitoring();
  };

  // Stop monitoring
  const stopMonitoring = () => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    setIsMonitoring(false);
  };

  // Auto-start monitoring when user has favorites
  useEffect(() => {
    if (user && (favorites.matches.length > 0 || favorites.clubs.length > 0)) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [user, favorites.matches.length, favorites.clubs.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopMonitoring();
  }, []);

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  };
};
