import { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { collection, doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

export const useFavorites = () => {
  const [user] = useAuthState(auth);
  const [favorites, setFavorites] = useState({ matches: [], clubs: [] });
  const [loading, setLoading] = useState(false);

  // Listen to user's favorites
  useEffect(() => {
    if (!user) {
      setFavorites({ matches: [], clubs: [] });
      return;
    }

    const userFavoritesRef = doc(db, 'user_favorites', user.uid);
    const unsubscribe = onSnapshot(userFavoritesRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setFavorites({
          matches: data.matches || [],
          clubs: data.clubs || [],
        });
      } else {
        setFavorites({ matches: [], clubs: [] });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Check if a match is favorited
  const isMatchFavorited = (matchId) => {
    return favorites.matches.some((match) => match.id === matchId);
  };

  // Check if a club is favorited
  const isClubFavorited = (clubId) => {
    return favorites.clubs.some((club) => club.id === clubId);
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-0 max-w-sm`;

    if (type === 'success') {
      notification.className += ' bg-green-500 text-white';
    } else if (type === 'error') {
      notification.className += ' bg-red-500 text-white';
    } else {
      notification.className += ' bg-blue-500 text-white';
    }

    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="text-lg">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </div>
        <div class="font-medium text-sm">${message}</div>
      </div>
    `;

    // Initially hide with opacity and slide from right
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Animate out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  // Track user activity for trending features
  const trackActivity = (type, data) => {
    try {
      const activity = {
        type, // 'favorite_club', 'favorite_match', 'team_view', etc.
        ...data,
        timestamp: Date.now(),
      };

      const recentActivity = JSON.parse(localStorage.getItem('recent_activity') || '[]');
      recentActivity.push(activity);

      // Keep only last 100 activities and last 24 hours
      const last24h = Date.now() - 24 * 60 * 60 * 1000;
      const filteredActivity = recentActivity.filter((act) => act.timestamp > last24h).slice(-100);

      localStorage.setItem('recent_activity', JSON.stringify(filteredActivity));
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  // Add match to favorites
  const addMatchToFavorites = async (matchData) => {
    if (!user) {
      showNotification('Please login to add favorites', 'error');
      return;
    }

    setLoading(true);
    try {
      const userFavoritesRef = doc(db, 'user_favorites', user.uid);
      const docSnap = await getDoc(userFavoritesRef);

      let currentFavorites = { matches: [], clubs: [] };
      if (docSnap.exists()) {
        currentFavorites = docSnap.data();
      }

      // Check if match is already favorited
      if (!currentFavorites.matches.some((match) => match.id === matchData.id)) {
        currentFavorites.matches.push({
          id: matchData.id,
          homeTeam: matchData.homeTeam,
          awayTeam: matchData.awayTeam,
          homeCrest: matchData.homeCrest,
          awayCrest: matchData.awayCrest,
          date: matchData.date,
          status: matchData.status,
          score: matchData.score,
          competition: matchData.competition,
          addedAt: new Date(),
        });

        await setDoc(userFavoritesRef, currentFavorites);
        showNotification(
          `⭐ ${matchData.homeTeam} vs ${matchData.awayTeam} added to favorites!`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error adding match to favorites:', error);
      showNotification('Failed to add match to favorites', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Remove match from favorites
  const removeMatchFromFavorites = async (matchId) => {
    if (!user) return;

    setLoading(true);
    try {
      const userFavoritesRef = doc(db, 'user_favorites', user.uid);
      const docSnap = await getDoc(userFavoritesRef);

      if (docSnap.exists()) {
        const currentFavorites = docSnap.data();
        const matchToRemove = currentFavorites.matches.find((match) => match.id === matchId);
        currentFavorites.matches = currentFavorites.matches.filter((match) => match.id !== matchId);
        await setDoc(userFavoritesRef, currentFavorites);

        if (matchToRemove) {
          showNotification(
            `🗑️ ${matchToRemove.homeTeam} vs ${matchToRemove.awayTeam} removed from favorites`,
            'info'
          );
        }
      }
    } catch (error) {
      console.error('Error removing match from favorites:', error);
      showNotification('Failed to remove match from favorites', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add club to favorites
  const addClubToFavorites = async (clubData) => {
    if (!user) {
      showNotification('Please login to add favorites', 'error');
      return;
    }

    setLoading(true);
    try {
      const userFavoritesRef = doc(db, 'user_favorites', user.uid);
      const docSnap = await getDoc(userFavoritesRef);

      let currentFavorites = { matches: [], clubs: [] };
      if (docSnap.exists()) {
        currentFavorites = docSnap.data();
      }

      // Check if club is already favorited
      if (!currentFavorites.clubs.some((club) => club.id === clubData.id)) {
        currentFavorites.clubs.push({
          id: clubData.id,
          name: clubData.name,
          crest: clubData.crest,
          addedAt: new Date(),
        });

        await setDoc(userFavoritesRef, currentFavorites);

        // Track activity
        trackActivity('favorite_club', {
          teamName: clubData.name,
          teamId: clubData.id,
        });

        showNotification(`⭐ ${clubData.name} added to favorites!`, 'success');
      }
    } catch (error) {
      console.error('Error adding club to favorites:', error);
      showNotification('Failed to add club to favorites', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Remove club from favorites
  const removeClubFromFavorites = async (clubId) => {
    if (!user) return;

    setLoading(true);
    try {
      const userFavoritesRef = doc(db, 'user_favorites', user.uid);
      const docSnap = await getDoc(userFavoritesRef);

      if (docSnap.exists()) {
        const currentFavorites = docSnap.data();
        const clubToRemove = currentFavorites.clubs.find((club) => club.id === clubId);
        currentFavorites.clubs = currentFavorites.clubs.filter((club) => club.id !== clubId);
        await setDoc(userFavoritesRef, currentFavorites);

        if (clubToRemove) {
          showNotification(`🗑️ ${clubToRemove.name} removed from favorites`, 'info');
        }
      }
    } catch (error) {
      console.error('Error removing club from favorites:', error);
      showNotification('Failed to remove club from favorites', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle match favorite
  const toggleMatchFavorite = async (matchData) => {
    if (isMatchFavorited(matchData.id)) {
      await removeMatchFromFavorites(matchData.id);
    } else {
      await addMatchToFavorites(matchData);
    }
  };

  // Toggle club favorite
  const toggleClubFavorite = async (clubData) => {
    if (isClubFavorited(clubData.id)) {
      await removeClubFromFavorites(clubData.id);
    } else {
      await addClubToFavorites(clubData);
    }
  };

  return {
    favorites,
    loading,
    isMatchFavorited,
    isClubFavorited,
    toggleMatchFavorite,
    toggleClubFavorite,
    addMatchToFavorites,
    removeMatchFromFavorites,
    addClubToFavorites,
    removeClubFromFavorites,
    trackActivity,
  };
};
