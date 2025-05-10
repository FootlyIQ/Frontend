export default function Fantasy() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      <main className="flex-1 p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Panel (Suggestions + Search) */}
          <div className="lg:w-1/3 w-full bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Search Players</h2>
            
            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name, club..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Suggested Players */}
            <h3 className="text-lg font-semibold mb-2">Suggested Players</h3>
            <ul className="space-y-2">
              {['Erling Haaland', 'Bukayo Saka', 'Jude Bellingham'].map((name, idx) => (
                <li
                  key={idx}
                  className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900 cursor-pointer transition"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Panel (Pitch) */}
          <div className="lg:w-2/3 w-full bg-green-100 dark:bg-green-600 p-6 rounded-lg shadow flex items-center justify-center">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              [ Football Pitch Placeholder ]
            </div>
            {/* Later: SVG/CSS football field or image */}
          </div>

        </div>
      </main>
    </div>
  );
}
