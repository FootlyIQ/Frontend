export default function MatchFeed() {
    return (
      <section>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Today's Matches</h2>
        <div className="space-y-4">
          {['Barcelona vs Real Madrid', 'Liverpool vs Man City'].map((match, idx) => (
            <div key={idx} className="bg-stone-200 p-4 rounded-xl shadow-md hover:shadow-xl transition border-2 border-emerald-300">
              <p className="text-lg font-semibold">{match}</p>
              <p className="text-sm text-gray-500">Kickoff: 20:45 CET</p>
            </div>
          ))}
        </div>
      </section>
    );
}
  