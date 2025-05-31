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

export default function Profile() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [teamId, setTeamId] = useState('');
  const { favorites, removeMatchFromFavorites, removeClubFromFavorites } = useFavorites();

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
      alert('Registration successful!');
    } catch (error) {
      console.error('Error during registration:', error.message);
      alert(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      setUser(userCredential.user);
      setIsLoggedIn(true);
      alert('Login successful!');
    } catch (error) {
      console.error('Error during login:', error.message);
      alert(error.message);
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
      alert('Google login successful!');
    } catch (error) {
      console.error('Error during Google login:', error.message);
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setUser(null);
      setForm({ email: '', password: '', name: '' });
      setTeamId('');
      alert('Logged out successfully!');
    } catch (error) {
      console.error('Error during logout:', error.message);
      alert(error.message);
    }
  };

  const saveTeamIdToFirestore = async () => {
    try {
      if (!user) {
        alert('You must be logged in to save your Fantasy Team ID.');
        return;
      }

      await setDoc(doc(db, 'users', user.uid), { teamId }, { merge: true });
      alert('Fantasy Team ID saved successfully!');
    } catch (error) {
      console.error('Error saving Fantasy Team ID:', error.message);
      alert('Failed to save Fantasy Team ID.');
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center">
      {!isLoggedIn ? (
        <div className="max-w-md w-full bg-gray-800 p-6 rounded shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">
            {isRegistering ? 'Register' : 'Login'}
          </h2>
          {isRegistering && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-gray-700 text-gray-100"
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded bg-gray-700 text-gray-100"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleInputChange}
              className="w-full p-2 border rounded bg-gray-700 text-gray-100"
            />
          </div>
          <button
            onClick={isRegistering ? handleRegister : handleLogin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 hover:bg-red-600 text-white p-2 rounded mt-4"
          >
            Login with Google
          </button>
          <p
            className="text-sm text-center mt-4 cursor-pointer text-blue-400 hover:text-blue-500"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
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
                <h4 className="text-lg font-medium mb-3 text-green-400">Favorite Matches</h4>
                <div className="space-y-3">
                  {favorites.matches.map((match, idx) => (
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
                          <div className="text-sm text-gray-400 text-right min-w-[120px] flex-shrink-0">
                            <div className="font-medium">{match.date}</div>
                            <div className="text-xs">
                              {match.competition && match.competition !== 'Unknown Competition'
                                ? match.competition
                                : 'Competition TBD'}
                            </div>
                            {match.status && (
                              <div className="text-xs text-blue-400">{match.status}</div>
                            )}
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
                  ))}
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
