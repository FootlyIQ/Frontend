export default function RightSidebar() {
    return (
      <aside className="hidden lg:block w-80 bg-slate-800 p-6">
        <h2 className="text-lg font-semibold text-stone-200 mb-4">Player Spotlight</h2>
        <div className="space-y-4">
          {[
            { name: 'Erling Haaland', stat: '5 Goals in 2 Matches', lorem: "fsgfbs sbfshjfbs shfbvgshfbv shdfshfv shfvsjfv sfvsgfvdgvjhs" },
            { name: 'Jude Bellingham', stat: '3 Assists', lorem: "fsgfbs sbfshjfbs shfbvgshfbv shdfshfv shfvsjfv sfvsgfvdgvjhs" },
          ].map((player, idx) => (
            <div key={idx} className="bg-slate-700 p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="text-stone-200 font-semibold">{player.name}</h3>
              <p className="text-sm text-emerald-300">{player.stat}</p>
              <p className="text-sm text-zinc-300">{player.lorem}</p>
            </div>
          ))}
        </div>
      </aside>
    );
}
  