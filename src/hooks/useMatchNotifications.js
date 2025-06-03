import { useState, useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { useFavorites } from './useFavorites';

export const useMatchNotifications = () => {
  const [user] = useAuthState(auth);
  const { favorites } = useFavorites();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringIntervalRef = useRef(null);
  const previousMatchDataRef = useRef(new Map());
  const notificationCountRef = useRef(0);
  const userStoppedMonitoringRef = useRef(false);
  const initializationDoneRef = useRef(false);

  // Function to remove all existing notifications from screen
  const clearAllNotifications = () => {
    // Find and remove all notifications that might be on screen
    // This includes match notifications and any other notification systems
    const notificationSelectors = [
      '[data-notification="match-notification"]', // Our match notifications
      '[data-notification="monitoring-status"]', // Monitoring status notification
      '.fixed.top-4', // Common notification positioning
      '.fixed.bottom-4', // Bottom notifications
      '.fixed.top-0', // Top notifications
      '.fixed.bottom-0', // Bottom notifications
      '[class*="notification"]', // Any element with "notification" in class name
      '[id*="notification"]', // Any element with "notification" in ID
      '[data-testid*="notification"]', // Test ID notifications
      '.z-50', // High z-index elements (often notifications)
      '.z-\\[9999\\]', // Tailwind high z-index
      'div[style*="position: fixed"][style*="z-index"]', // Any fixed positioned high z-index divs
    ];

    // Try each selector and remove matching elements
    notificationSelectors.forEach((selector) => {
      try {
        const notifications = document.querySelectorAll(selector);
        notifications.forEach((notification) => {
          // Check if it looks like a notification (has typical notification styling)
          const computedStyle = window.getComputedStyle(notification);
          const isFixedPosition = computedStyle.position === 'fixed';
          const hasHighZIndex =
            parseInt(computedStyle.zIndex) > 1000 || computedStyle.zIndex === 'auto';

          // Additional checks to avoid removing important UI elements
          const isLikelyNotification =
            isFixedPosition &&
            (hasHighZIndex ||
              notification.textContent.toLowerCase().includes('monitor') ||
              notification.textContent.toLowerCase().includes('notification') ||
              notification.textContent.toLowerCase().includes('goal') ||
              notification.textContent.toLowerCase().includes('match') ||
              notification.hasAttribute('data-notification'));

          if (isLikelyNotification && notification.parentNode) {
            // Animate out smoothly
            notification.style.transition = 'all 0.3s ease-in-out';
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%) translateY(-50%)';

            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 300);
          }
        });
      } catch (error) {
        // Ignore selector errors and continue with other selectors
      }
    });

    // Reset notification counter
    notificationCountRef.current = 0;
  };

  // Function to show monitoring status notification
  const showMonitoringStatusNotification = () => {
    const notification = document.createElement('div');
    notification.setAttribute('data-notification', 'monitoring-status');
    notification.style.cssText = `
      position: fixed;
      bottom: 16px;
      left: 16px;
      background: #10b981;
      color: white;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
      z-index: 50;
      display: flex;
      align-items: center;
      gap: 8px;
      transform: translateX(-100%);
      transition: all 0.3s ease-in-out;
    `;

    // Add pulsing dot and text (matching the original App.jsx style exactly)
    notification.innerHTML = `
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 2s infinite;"></div>
      <span>Monitoring favorites</span>
    `;

    // Add CSS animation for the pulsing dot
    if (!document.getElementById('monitoring-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'monitoring-pulse-style';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
  };

  const showNotification = (message, type = 'info') => {
    // Don't show notifications if monitoring is stopped
    if (!isMonitoring || userStoppedMonitoringRef.current) {
      return;
    }

    // Limit notifications to prevent spam
    if (notificationCountRef.current >= 10) {
      return; // Stop showing notifications if too many have been shown
    }
    notificationCountRef.current++;

    // Reset counter after 1 minute
    setTimeout(() => {
      notificationCountRef.current = Math.max(0, notificationCountRef.current - 1);
    }, 60000);

    const notification = document.createElement('div');
    notification.setAttribute('data-notification', 'match-notification'); // Add identifier for easy removal
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transform: translateX(100%);
      transition: all 0.3s ease-in-out;
      ${
        type === 'goal'
          ? 'background: linear-gradient(135deg, #10b981, #059669);'
          : type === 'start'
          ? 'background: linear-gradient(135deg, #3b82f6, #1d4ed8);'
          : 'background: linear-gradient(135deg, #6366f1, #4f46e5);'
      }
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
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
      const response = await fetch(`https://footlyiq-backend.onrender.com/match-statistics/${matchId}`);
      if (!response.ok) {
        // Don't log 500 errors to reduce console noise
        if (response.status !== 500) {
          console.error(`API Error ${response.status} for match ${matchId}`);
        }
        return null;
      }
      return await response.json();
    } catch (error) {
      // Only log non-network errors to reduce console noise
      if (!error.message.includes('Failed to fetch')) {
        console.error('Error fetching match data:', error);
      }
      return null;
    }
  };

  // Fetch today's matches to monitor club matches
  const fetchTodaysMatches = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Don't fetch future dates to avoid server errors
      const currentDate = new Date();
      const requestDate = new Date(today);
      if (requestDate > currentDate) {
        return [];
      }

      const response = await fetch(`https://footlyiq-backend.onrender.com/matches?date=${today}`);
      if (!response.ok) {
        // Don't log 500 errors to reduce console noise
        if (response.status !== 500) {
          console.error(`API Error ${response.status} for matches on ${today}`);
        }
        return [];
      }

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
      // Only log non-network errors to reduce console noise
      if (!error.message.includes('Failed to fetch')) {
        console.error("Error fetching today's matches:", error);
      }
      return [];
    }
  };

  // Monitor favorite matches for score changes
  const monitorFavoriteMatches = async () => {
    if (!favorites.matches.length || !isMonitoring || userStoppedMonitoringRef.current) return;

    for (const favoriteMatch of favorites.matches) {
      const previousData = previousMatchDataRef.current.get(favoriteMatch.id);

      // Skip if match was already finished in previous check
      if (
        previousData &&
        (previousData.status === 'FINISHED' ||
          previousData.status === 'AWARDED' ||
          previousData.status === 'POSTPONED' ||
          previousData.status === 'CANCELLED' ||
          previousData.status === 'SUSPENDED')
      ) {
        continue; // Skip finished matches
      }

      const currentData = await fetchMatchData(favoriteMatch.id);
      if (!currentData) continue;

      const currentStatus = currentData.generalInfo?.status;
      const currentHomeGoals = currentData.statistics?.homeTeam?.goals;
      const currentAwayGoals = currentData.statistics?.awayTeam?.goals;

      // Skip if current match is finished - mark it and continue
      if (
        currentStatus === 'FINISHED' ||
        currentStatus === 'AWARDED' ||
        currentStatus === 'POSTPONED' ||
        currentStatus === 'CANCELLED' ||
        currentStatus === 'SUSPENDED'
      ) {
        // Update stored data and skip further checks for this match
        previousMatchDataRef.current.set(favoriteMatch.id, {
          status: currentStatus,
          homeGoals: currentHomeGoals,
          awayGoals: currentAwayGoals,
        });
        continue;
      }

      // Check for goal changes (if we have valid goal data)
      if (
        currentHomeGoals !== undefined &&
        currentAwayGoals !== undefined &&
        previousData &&
        previousData.homeGoals !== undefined &&
        previousData.awayGoals !== undefined
      ) {
        const homeGoalDiff = currentHomeGoals - previousData.homeGoals;
        const awayGoalDiff = currentAwayGoals - previousData.awayGoals;

        if (homeGoalDiff > 0 || awayGoalDiff > 0) {
          // Goal scored!
          const homeTeam = currentData.homeTeam?.name || favoriteMatch.homeTeam;
          const awayTeam = currentData.awayTeam?.name || favoriteMatch.awayTeam;

          if (homeGoalDiff > 0) {
            const message = `⚽ GOAL! ${homeTeam} ${currentHomeGoals}-${currentAwayGoals} ${awayTeam}`;
            showNotification(message, 'goal');
          }
          if (awayGoalDiff > 0) {
            const message = `⚽ GOAL! ${homeTeam} ${currentHomeGoals}-${currentAwayGoals} ${awayTeam}`;
            showNotification(message, 'goal');
          }
        }
      }

      // Update stored data for next comparison
      previousMatchDataRef.current.set(favoriteMatch.id, {
        status: currentStatus,
        homeGoals: currentHomeGoals,
        awayGoals: currentAwayGoals,
      });
    }
  };

  // Monitor favorite clubs for match starts
  const monitorFavoriteClubs = async () => {
    if (!favorites.clubs.length || !isMonitoring || userStoppedMonitoringRef.current) return;

    const todaysMatches = await fetchTodaysMatches();
    if (!todaysMatches.length) return;

    // Check each favorite club
    for (const favoriteClub of favorites.clubs) {
      // Find matches for this club using partial name matching (case-insensitive)
      const clubMatches = todaysMatches.filter((match) => {
        const homeTeamLower = (match.home_team || '').toLowerCase();
        const awayTeamLower = (match.away_team || '').toLowerCase();
        const clubNameLower = favoriteClub.name.toLowerCase();

        return homeTeamLower.includes(clubNameLower) || awayTeamLower.includes(clubNameLower);
      });

      // Monitor each match involving this club
      for (const match of clubMatches) {
        const matchKey = `club_${favoriteClub.id}_match_${match.id}`;
        const previousStatus = previousMatchDataRef.current.get(matchKey);

        // Skip if match was already finished in previous check
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

        // Detect match start - check for various start conditions
        const matchStarted =
          (!previousStatus && match.status === 'IN_PLAY') ||
          (previousStatus === 'SCHEDULED' && match.status === 'IN_PLAY') ||
          (previousStatus === 'TIMED' && match.status === 'IN_PLAY') ||
          (previousStatus === 'LIVE' && match.status === 'IN_PLAY');

        if (matchStarted) {
          // Match just started
          const homeTeam = match.home_team || 'Unknown Team';
          const awayTeam = match.away_team || 'Unknown Team';
          const opponent = homeTeam.toLowerCase().includes(favoriteClub.name.toLowerCase())
            ? awayTeam
            : homeTeam;
          const isHome = homeTeam.toLowerCase().includes(favoriteClub.name.toLowerCase());

          const message = `🟢 ${favoriteClub.name} vs ${opponent} has started! ${
            isHome ? '(Home)' : '(Away)'
          }`;
          showNotification(message, 'start');
        }

        // Update stored status
        previousMatchDataRef.current.set(matchKey, match.status);
      }
    }
  };

  // Main monitoring function
  const runMonitoring = async () => {
    if (
      !user ||
      (!favorites.matches.length && !favorites.clubs.length) ||
      userStoppedMonitoringRef.current
    ) {
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
      // Ensure key is a string before calling startsWith
      const keyStr = String(key);

      // Remove data for matches no longer in favorites
      if (keyStr.startsWith('club_')) {
        const clubId = parseInt(keyStr.split('_')[1]);
        if (!currentClubIds.has(clubId)) {
          keysToRemove.push(key);
        }
      } else {
        const matchId = parseInt(keyStr);
        if (!currentFavoriteIds.has(matchId)) {
          keysToRemove.push(key);
        }
      }
    }

    // Remove old data
    keysToRemove.forEach((key) => {
      previousMatchDataRef.current.delete(key);
    });
  };

  // Internal start monitoring function
  const startMonitoringInternal = () => {
    if (monitoringIntervalRef.current) return;

    setIsMonitoring(true);

    // Dynamic interval based on match activity
    const getMonitoringInterval = () => {
      if (!favorites.matches.length && !favorites.clubs.length) return 60000; // 1 minute when no favorites

      // Check if any matches are currently live
      const hasActiveLiveMatches = favorites.matches.some((match) => {
        const previousData = previousMatchDataRef.current.get(match.id);
        return (
          previousData && (previousData.status === 'IN_PLAY' || previousData.status === 'PAUSED')
        );
      });

      if (hasActiveLiveMatches) {
        return 30000; // 30 seconds for live matches
      } else {
        return 60000; // 1 minute for non-live matches to reduce API calls
      }
    };

    // Check every 30-60 seconds based on activity
    monitoringIntervalRef.current = setInterval(runMonitoring, getMonitoringInterval());

    // Run once immediately
    runMonitoring();
  };

  // Public start monitoring function
  const startMonitoring = () => {
    userStoppedMonitoringRef.current = false;
    if (user) {
      localStorage.setItem(`monitoring_preference_${user.uid}`, 'started');
    }
    startMonitoringInternal();

    // Show monitoring status notification
    showMonitoringStatusNotification();
  };

  // Stop monitoring
  const stopMonitoring = () => {
    userStoppedMonitoringRef.current = true;
    if (user) {
      localStorage.setItem(`monitoring_preference_${user.uid}`, 'stopped');
    }

    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    setIsMonitoring(false);

    // Clear all existing notifications from screen
    clearAllNotifications();
  };

  // Load monitoring preference from localStorage - MUST be called in same order every time
  useEffect(() => {
    if (user && !initializationDoneRef.current) {
      initializationDoneRef.current = true;
      const savedPreference = localStorage.getItem(`monitoring_preference_${user.uid}`);
      if (savedPreference === 'stopped') {
        userStoppedMonitoringRef.current = true;
        setIsMonitoring(false);
      } else if (
        savedPreference === 'started' &&
        (favorites.matches.length > 0 || favorites.clubs.length > 0)
      ) {
        userStoppedMonitoringRef.current = false;
        // Use setTimeout to avoid hook order issues
        setTimeout(() => {
          startMonitoringInternal();
        }, 0);
      }
    }
  }, [user, favorites.matches.length, favorites.clubs.length]);

  // Auto-start monitoring when user has favorites (but only if they haven't manually stopped)
  useEffect(() => {
    if (user && (favorites.matches.length > 0 || favorites.clubs.length > 0)) {
      // Only auto-start if user hasn't manually stopped monitoring
      if (!userStoppedMonitoringRef.current && initializationDoneRef.current) {
        const savedPreference = localStorage.getItem(`monitoring_preference_${user.uid}`);
        if (savedPreference !== 'stopped') {
          startMonitoringInternal();
        }
      }
    } else {
      // If no favorites, stop monitoring but don't change user preference
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      setIsMonitoring(false);
    }

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
    };
  }, [user, favorites.matches.length, favorites.clubs.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
    };
  }, []);

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  };
};
