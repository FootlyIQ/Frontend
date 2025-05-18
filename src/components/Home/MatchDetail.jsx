import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function MatchDetail() {
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // state za zavihek
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/match-statistics/${matchId}`);
        setMatchData(response.data);
      } catch (err) {
        console.error('Error at loading games:', err);
        setError('Error at loading details.');
      }
    };

    fetchMatchDetails();
    // ⏱️ Osvežuj vsakih 4 sekunde (4000 ms)
    const interval = setInterval(fetchMatchDetails, 5000);

    // Počisti interval ob unmountu
    return () => clearInterval(interval);
  }, [matchId]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!matchData) return <p>Loading statistics...</p>;

  const { generalInfo, homeTeam, awayTeam, extraInfo, statistics } = matchData;

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md text-gray-900 dark:text-gray-100">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-4">
        <img
          src={homeTeam.crest}
          alt={`${homeTeam.name} logo`}
          className="w-10 h-10 object-contain cursor-pointer"
          onClick={() => navigate(`/team/${homeTeam.id}`)} // <- tukaj dodano
          title={`Go to ${homeTeam.name} page`} // opcijsko tooltip
        />
        {homeTeam.name} <span>vs</span>
        <img
          src={awayTeam.crest}
          alt={`${awayTeam.name} logo`}
          className="w-10 h-10 object-contain cursor-pointer"
          onClick={() => navigate(`/team/${awayTeam.id}`)} // <- tukaj dodano
          title={`Go to ${awayTeam.name} page`} // opcijsko tooltip
        />
        {awayTeam.name}
      </h2>

      {/* Navigacija med zavihki */}
      <nav className="mb-4 flex gap-4 border-b border-gray-300 dark:border-gray-700">
        <button
          className={`pb-2 ${
            activeTab === 'overview' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`pb-2 ${
            activeTab === 'lineups' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('lineups')}
        >
          Lineups
        </button>
        <button
          className={`pb-2 ${
            activeTab === 'statistics'
              ? 'border-b-2 border-blue-600 font-semibold'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
      </nav>

      {/* Overview zavihek */}
      {activeTab === 'overview' && (
        <>
          <p className="text-sm text-gray-600 mb-2">{generalInfo.date}</p>
          <p className="text-sm text-gray-600 mb-2">Stadium: {generalInfo.venue}</p>
          <p className="text-sm text-gray-600 mb-2">Status: {generalInfo.status}</p>

          <div className="mt-4">
            <h3 className="font-semibold">Coaches:</h3>
            <ul className="text-sm">
              <li>
                {homeTeam.name}: {homeTeam.coach.name} ({homeTeam.coach.nationality})
              </li>
              <li>
                {awayTeam.name}: {awayTeam.coach.name} ({awayTeam.coach.nationality})
              </li>
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold">Info:</h3>
            <p>
              Goals: {Array.isArray(extraInfo.goals) ? extraInfo.goals.length : extraInfo.goals}
            </p>
            <p>
              Bookings:{' '}
              {Array.isArray(extraInfo.bookings) ? extraInfo.bookings.length : extraInfo.bookings}
            </p>
            <p>
              Substitutions:{' '}
              {Array.isArray(extraInfo.substitutions)
                ? extraInfo.substitutions.length
                : extraInfo.substitutions}
            </p>
          </div>
        </>
      )}

      {/* Lineups zavihek */}
      {activeTab === 'lineups' && (
        <div>
          {/* Home Team */}
          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              {homeTeam.name} (Rank: {homeTeam.leagueRank})
            </h3>
            <p className="italic mb-2">Formation: {homeTeam.formation || 'Unknown'}</p>

            <h4 className="font-semibold">Starting Lineup</h4>
            <ul className="list-disc list-inside mb-2">
              {homeTeam.lineup.length > 0 ? (
                homeTeam.lineup.map((player, i) => (
                  <li key={i}>
                    {player.name} ({player.position || 'N/A'})
                  </li>
                ))
              ) : (
                <li>No lineup data</li>
              )}
            </ul>

            <h4 className="font-semibold">Bench</h4>
            <ul className="list-disc list-inside">
              {homeTeam.bench.length > 0 ? (
                homeTeam.bench.map((player, i) => (
                  <li key={i}>
                    {player.name} ({player.position || 'N/A'})
                  </li>
                ))
              ) : (
                <li>No bench data</li>
              )}
            </ul>
          </section>

          {/* Away Team */}
          <section>
            <h3 className="text-xl font-semibold mb-2">
              {awayTeam.name} (Rank: {awayTeam.leagueRank})
            </h3>
            <p className="italic mb-2">Formation: {awayTeam.formation || 'Unknown'}</p>

            <h4 className="font-semibold">Starting Lineup</h4>
            <ul className="list-disc list-inside mb-2">
              {awayTeam.lineup.length > 0 ? (
                awayTeam.lineup.map((player, i) => (
                  <li key={i}>
                    {player.name} ({player.position || 'N/A'})
                  </li>
                ))
              ) : (
                <li>No lineup data</li>
              )}
            </ul>

            <h4 className="font-semibold">Bench</h4>
            <ul className="list-disc list-inside">
              {awayTeam.bench.length > 0 ? (
                awayTeam.bench.map((player, i) => (
                  <li key={i}>
                    {player.name} ({player.position || 'N/A'})
                  </li>
                ))
              ) : (
                <li>No bench data</li>
              )}
            </ul>
          </section>
        </div>
      )}

      {activeTab === 'statistics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Home team statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-2">{homeTeam.name}</h3>
            <ul className="text-sm space-y-1">
              {Object.entries(statistics.homeTeam).map(([key, value]) => (
                <li
                  key={key}
                  className="flex justify-between border-b border-gray-200 dark:border-gray-700 py-1"
                >
                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Away team statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-2">{awayTeam.name}</h3>
            <ul className="text-sm space-y-1">
              {Object.entries(statistics.awayTeam).map(([key, value]) => (
                <li
                  key={key}
                  className="flex justify-between border-b border-gray-200 dark:border-gray-700 py-1"
                >
                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
