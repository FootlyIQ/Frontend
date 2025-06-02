import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useFavorites } from '../hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { useMatchNotifications } from '../hooks/useMatchNotifications';
import { useLiveMatchStatus } from '../hooks/useLiveMatchStatus';

export default function Profile() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [teamId, setTeamId] = useState('');
  const { favorites, removeMatchFromFavorites, removeClubFromFavorites } = useFavorites();
  const { isMonitoring, startMonitoring, stopMonitoring } = useMatchNotifications();
  const { getDisplayStatus, isLoading: statusLoading } = useLiveMatchStatus(favorites.matches);
  const [banner, setBanner] = useState({ message: '', type: '' });

  const showBanner = (message, type = 'info') => {
    setBanner({ message, type });
    setTimeout(() => setBanner({ message: '', type: '' }), 4000);
  };

  // Preveri stanje prijave ob nalaganju strani
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        setUser(currentUser);

        // Pridobi Fantasy Team ID iz Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setTeamId(data.teamId || '');
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setTeamId('');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const newUser = userCredential.user;

      await setDoc(doc(db, 'users', newUser.uid), {
        name: form.name,
        email: form.email,
        role: 'user',
        createdAt: new Date().toISOString(),
      });

      setUser(newUser);
      setIsLoggedIn(true);
      showBanner('Registration successful!', 'success');
    } catch (error) {
      showBanner(error.message, 'error');
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      setUser(userCredential.user);
      setIsLoggedIn(true);
      showBanner('Login successful!', 'success');
    } catch (error) {
      showBanner(error.message, 'error');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const newUser = result.user;

      const userDocRef = doc(db, 'users', newUser.uid);
      await setDoc(
        userDocRef,
        {
          name: newUser.displayName || 'Google User',
          email: newUser.email,
          role: 'user',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setUser(newUser);
      setIsLoggedIn(true);
      showBanner('Google login successful!', 'success');
    } catch (error) {
      showBanner(error.message, 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setUser(null);
      setForm({ email: '', password: '', name: '' });
      setTeamId('');
      showBanner('Logged out successfully!', 'info');
    } catch (error) {
      showBanner(error.message, 'error');
    }
  };

  const saveTeamIdToFirestore = async () => {
    try {
      if (!user) {
        showBanner('You must be logged in to save your Fantasy Team ID.', 'info');
        return;
      }

      await setDoc(doc(db, 'users', user.uid), { teamId }, { merge: true });
      showBanner('Fantasy Team ID saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving Fantasy Team ID:', error.message);
      showBanner(`Error saving Fantasy Team ID: ${error.message}`, 'error');
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center">
      {banner.message && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white font-semibold transition-all
      ${banner.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}
          style={{ minWidth: 250, maxWidth: 400, textAlign: 'center' }}
        >
          {banner.message}
        </div>
      )}
      {!isLoggedIn ? (
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <h2 className="text-3xl font-extrabold mb-6 text-center text-emerald-400 tracking-tight">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </h2>
          <form
            onSubmit={e => {
              e.preventDefault();
              isRegistering ? handleRegister() : handleLogin();
            }}
            className="space-y-5"
          >
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#34d399"/><path d="M4 20c0-2.5 3.6-4 8-4s8 1.5 8 4" stroke="#34d399" strokeWidth="2" strokeLinecap="round"/></svg>
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    className="w-full p-3 pl-10 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-emerald-400 outline-none transition"
                    placeholder="Your Name"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="#34d399"/><path d="M3 7l9 6 9-6" stroke="#059669" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="w-full p-3 pl-10 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-emerald-400 outline-none transition"
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="8" rx="3" fill="#34d399"/><circle cx="12" cy="14" r="2" fill="#059669"/></svg>
                </span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  className="w-full p-3 pl-10 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-emerald-400 outline-none transition"
                  placeholder="Password"
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold p-3 rounded-lg shadow transition text-lg"
            >
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="mx-3 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold p-3 rounded-lg shadow transition"
          >
            <svg width="20" height="20" viewBox="0 0 48 48"><g><path fill="#fff" d="M44.5 20H24v8.5h11.7C34.7 33.4 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.2 5.1 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.5-7.6 21-17.5V24z"/><path fill="#4285F4" d="M6.3 14.7l7 5.1C15.7 16.1 19.5 13 24 13c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.2 5.1 29.4 3 24 3c-7.7 0-14.4 4.4-17.7 10.7z"/><path fill="#34A853" d="M24 45c5.6 0 10.7-1.9 14.7-5.1l-6.8-5.6C29.7 36.6 26.9 37.5 24 37.5c-5.7 0-10.6-3.7-12.3-8.8l-7 5.4C7.6 41.2 15.2 45 24 45z"/><path fill="#FBBC05" d="M44.5 20H24v8.5h11.7c-1.1 3-4.1 5-7.7 5-2.2 0-4.2-.7-5.7-2l-7 5.4C18.4 43.3 21 45 24 45c10.5 0 19.5-7.6 21-17.5V24z"/><path fill="#EA4335" d="M6.3 14.7l7 5.1C15.7 16.1 19.5 13 24 13c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.2 5.1 29.4 3 24 3c-7.7 0-14.4 4.4-17.7 10.7z"/></g></svg>
            Continue with Google
          </button>
          <p
            className="text-sm text-center mt-6 cursor-pointer text-emerald-400 hover:text-emerald-300 transition"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Already have an account? Login' : "Don’t have an account? Register"}
          </p>
        </div>
      ) : (
        <div className="max-w-4xl w-full bg-gray-800 p-6 rounded shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Welcome, {user.email}</h2>

          {/* Fantasy Team ID Section */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Fantasy Premier League</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Fantasy Team ID</label>
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full p-2 border rounded bg-gray-600 text-gray-100"
              />
            </div>
            <button
              onClick={saveTeamIdToFirestore}
              className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded"
            >
              {teamId ? 'Update Fantasy Team ID' : 'Save Fantasy Team ID'}
            </button>
          </div>

          {/* Notification Settings Section */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">🔔 Real-time Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Live Match Updates</div>
                  <div className="text-sm text-gray-400">
                    Get notified when your favorite matches have score changes
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isMonitoring ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">Active</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Inactive</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Club Match Alerts</div>
                  <div className="text-sm text-gray-400">
                    Get notified when your favorite clubs' matches start
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isMonitoring ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">Active</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Inactive</span>
                  )}
                </div>
              </div>

              {favorites.matches.length === 0 && favorites.clubs.length === 0 && (
                <div className="bg-gray-600 p-3 rounded text-center text-sm text-gray-400">
                  ⭐ Add some favorites to enable real-time notifications!
                </div>
              )}

              {(favorites.matches.length > 0 || favorites.clubs.length > 0) && (
                <div className="bg-blue-900/30 p-3 rounded">
                  <div className="text-sm">
                    <div className="font-medium text-blue-400 mb-2">Monitoring Status:</div>
                    <div className="space-y-1 text-gray-300">
                      {favorites.matches.length > 0 && (
                        <div>
                          📊 Tracking {favorites.matches.length} favorite match
                          {favorites.matches.length > 1 ? 'es' : ''}
                        </div>
                      )}
                      {favorites.clubs.length > 0 && (
                        <div>
                          ⚽ Tracking {favorites.clubs.length} favorite club
                          {favorites.clubs.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Controls (for debugging/testing) */}
              <div className="flex gap-2">
                <button
                  onClick={startMonitoring}
                  disabled={isMonitoring}
                  className={`px-3 py-1 rounded text-sm ${isMonitoring
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                  Start Monitoring
                </button>
                <button
                  onClick={stopMonitoring}
                  disabled={!isMonitoring}
                  className={`px-3 py-1 rounded text-sm ${!isMonitoring
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                >
                  Stop Monitoring
                </button>
              </div>
            </div>
          </div>

          {/* Favorites Section */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">⭐ Your Favorites</h3>

            {/* Favorite Clubs */}
            {favorites.clubs.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-blue-400">Favorite Clubs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {favorites.clubs.map((club, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-700 p-3 rounded-lg flex items-center justify-between"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:text-blue-400"
                        onClick={() => navigate(`/team/${club.id}`)}
                      >
                        <img src={club.crest} alt={club.name} className="w-8 h-8 object-contain" />
                        <span className="font-medium">{club.name}</span>
                      </div>
                      <button
                        onClick={() => removeClubFromFavorites(club.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Remove from favorites"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Matches */}
            {favorites.matches.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-green-400">
                  Favorite Matches{' '}
                  {statusLoading && <span className="text-xs text-gray-400">(updating...)</span>}
                </h4>
                <div className="space-y-3">
                  {favorites.matches.map((match, idx) => {
                    const displayStatus = getDisplayStatus(match);
                    return (
                      <div key={idx} className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center gap-4 cursor-pointer hover:text-blue-400 flex-1"
                            onClick={() => navigate(`/match/${match.id}`)}
                          >
                            {/* Teams Section - Fixed width to prevent layout shift */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={match.homeCrest}
                                  alt={match.homeTeam}
                                  className="w-6 h-6 object-contain flex-shrink-0"
                                />
                                <span className="font-medium truncate">{match.homeTeam}</span>
                              </div>

                              <span className="text-gray-400 flex-shrink-0">vs</span>

                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={match.awayCrest}
                                  alt={match.awayTeam}
                                  className="w-6 h-6 object-contain flex-shrink-0"
                                />
                                <span className="font-medium truncate">{match.awayTeam}</span>
                              </div>
                            </div>

                            {/* Match Info Section - Fixed width */}
                            <div className="text-sm text-gray-400 text-right min-w-[140px] flex-shrink-0">
                              <div className="font-medium">{match.date}</div>
                              <div className="text-xs">
                                {match.competition && match.competition !== 'Unknown Competition'
                                  ? match.competition
                                  : 'Competition TBD'}
                              </div>

                              {/* Live Status and Score */}
                              <div className="flex items-center justify-end gap-2 mt-1">
                                {displayStatus.isLive && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                )}

                                {/* Only show score for matches that have started or finished */}
                                {displayStatus.score &&
                                  displayStatus.status !== 'SCHEDULED' &&
                                  displayStatus.status !== 'TIMED' &&
                                  !(
                                    displayStatus.score === '0-0' &&
                                    (displayStatus.status === 'SCHEDULED' ||
                                      displayStatus.status === 'TIMED')
                                  ) && (
                                    <div className="text-sm font-bold text-green-400">
                                      {displayStatus.score}
                                    </div>
                                  )}

                                <div
                                  className={`text-xs ${displayStatus.status === 'IN_PLAY'
                                      ? 'text-red-400 font-medium'
                                      : displayStatus.status === 'FINISHED'
                                        ? 'text-gray-500'
                                        : displayStatus.status === 'SCHEDULED' ||
                                          displayStatus.status === 'TIMED'
                                          ? 'text-blue-400'
                                          : 'text-yellow-400'
                                    }`}
                                >
                                  {displayStatus.status === 'IN_PLAY'
                                    ? 'LIVE'
                                    : displayStatus.status === 'FINISHED'
                                      ? 'FINISHED'
                                      : displayStatus.status === 'SCHEDULED' ||
                                        displayStatus.status === 'TIMED'
                                        ? 'SCHEDULED'
                                        : displayStatus.status}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeMatchFromFavorites(match.id)}
                            className="text-red-400 hover:text-red-300 p-1 ml-4 flex-shrink-0"
                            title="Remove from favorites"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {favorites.clubs.length === 0 && favorites.matches.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">⭐</div>
                <p>No favorites yet!</p>
                <p className="text-sm mt-1">
                  Add clubs and matches to favorites by clicking the star icons.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white p-2 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
