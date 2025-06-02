import React from "react";

export default function PlayerDetailCard({ player, stats, onClose }) {
  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl p-6 relative w-full max-w-md">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-3 text-gray-600 dark:text-gray-300 text-xl font-bold hover:text-red-500"
        aria-label="Close"
      >
        ×
      </button>

      {/* Player name */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {player.first_name} {player.second_name}
      </h2>

      {/* Fixture */}
      <p className="text-md text-emerald-600 dark:text-emerald-400 mb-4 font-semibold">
        {stats.fixture}
      </p>


      {/* Stats table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border border-gray-300 dark:border-gray-700 rounded-lg">
          <thead className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
            <tr>
              <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">Stat</th>
              <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">Value</th>
              <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">Points</th>
            </tr>
          </thead>
          <tbody>
            {stats.stats.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">{item.label}</td>
                <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">{item.value}</td>
                <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">{item.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
