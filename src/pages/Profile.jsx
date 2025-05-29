import { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Profile() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ email: "", password: "", name: "" });
    const [isRegistering, setIsRegistering] = useState(false);
    const [teamId, setTeamId] = useState("");

    // Preveri stanje prijave ob nalaganju strani
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setIsLoggedIn(true);
                setUser(currentUser);

                // Pridobi Fantasy Team ID iz Firestore
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setTeamId(data.teamId || "");
                }
            } else {
                setIsLoggedIn(false);
                setUser(null);
                setTeamId("");
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

            await setDoc(doc(db, "users", newUser.uid), {
                name: form.name,
                email: form.email,
                role: "user",
                createdAt: new Date().toISOString()
            });

            setUser(newUser);
            setIsLoggedIn(true);
            alert("Registration successful!");
        } catch (error) {
            console.error("Error during registration:", error.message);
            alert(error.message);
        }
    };

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
            setUser(userCredential.user);
            setIsLoggedIn(true);
            alert("Login successful!");
        } catch (error) {
            console.error("Error during login:", error.message);
            alert(error.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const newUser = result.user;

            const userDocRef = doc(db, "users", newUser.uid);
            await setDoc(userDocRef, {
                name: newUser.displayName || "Google User",
                email: newUser.email,
                role: "user",
                createdAt: new Date().toISOString()
            }, { merge: true });

            setUser(newUser);
            setIsLoggedIn(true);
            alert("Google login successful!");
        } catch (error) {
            console.error("Error during Google login:", error.message);
            alert(error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsLoggedIn(false);
            setUser(null);
            setForm({ email: "", password: "", name: "" });
            setTeamId("");
            alert("Logged out successfully!");
        } catch (error) {
            console.error("Error during logout:", error.message);
            alert(error.message);
        }
    };

    const saveTeamIdToFirestore = async () => {
        try {
            if (!user) {
                alert("You must be logged in to save your Fantasy Team ID.");
                return;
            }

            await setDoc(doc(db, "users", user.uid), { teamId }, { merge: true });
            alert("Fantasy Team ID saved successfully!");
        } catch (error) {
            console.error("Error saving Fantasy Team ID:", error.message);
            alert("Failed to save Fantasy Team ID.");
        }
    };

    return (
        <div className="p-6 bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center">
            {!isLoggedIn ? (
                <div className="max-w-md w-full bg-gray-800 p-6 rounded shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 text-center">
                        {isRegistering ? "Register" : "Login"}
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
                        {isRegistering ? "Register" : "Login"}
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
                        {isRegistering
                            ? "Already have an account? Login"
                            : "Don't have an account? Register"}
                    </p>
                </div>
            ) : (
                <div className="max-w-md w-full bg-gray-800 p-6 rounded shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 text-center">Welcome, {user.email}</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Fantasy Team ID</label>
                        <input
                            type="text"
                            value={teamId}
                            onChange={(e) => setTeamId(e.target.value)}
                            className="w-full p-2 border rounded bg-gray-700 text-gray-100"
                        />
                    </div>
                    <button
                        onClick={saveTeamIdToFirestore}
                        className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded"
                    >
                        {teamId ? "Update Fantasy Team ID" : "Save Fantasy Team ID"}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 hover:bg-red-600 text-white p-2 rounded mt-4"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}