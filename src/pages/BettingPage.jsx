import React, { useEffect, useState } from 'react';

export default function BettingPage() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOdds = async () => {
            try {
                const res = await fetch('http://127.0.0.1:5000/odds');
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

    if (loading) return <div className="p-6">Loading betting odds...</div>;

    return(
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Upcoming Betting Odds</h1>

            {matches.length === 0 && (
                <p>No betting data available right now.</p>
            )}

            {matches.map((match) => {
                const bookmaker = match.bookmakers?.[0];
                const market = bookmaker?.markets?.find(m => m.key === 'h2h');
                const outcomes = market?.outcomes || [];

                return (
                    <div key={match.id} className="border rounded-lg p-4 mb-4 shadow-sm bg-white">
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                            {match.sport_title}
                        </h2>
                        <p className="text-sm text-gray-600 mb-2">
                            {new Date(match.commence_time).toLocaleString()}
                        </p>
                        <p className="font-medium text-gray-800 mb-2">
                            {match.home_team} vs {match.away_team}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {outcomes.map(outcome => (
                                <div
                                    key={outcome.name}
                                    className="p-2 border rounded text-center bg-gray-100"
                                >
                                    <div className="font-semibold text-gray-700">{outcome.name}</div>
                                    <div className="text-blue-600 text-lg">{outcome.price}</div>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                            Bookmaker: {bookmaker?.title}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}