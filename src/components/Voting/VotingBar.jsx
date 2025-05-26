import React, { useState } from 'react';

export default function VoteBar() {
  const [votes, setVotes] = useState({ home: 0, draw: 0, away: 0 });

  const handleVote = (option) => {
    setVotes((prevVotes) => ({
      ...prevVotes,
      [option]: prevVotes[option] + 1,
    }));
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      {/* Home team vote (1) */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => handleVote('home')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          1
        </button>
        <span className="text-sm mt-1">{votes.home}</span>
      </div>

      {/* Draw vote (X) */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => handleVote('draw')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          X
        </button>
        <span className="text-sm mt-1">{votes.draw}</span>
      </div>

      {/* Away team vote (2) */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => handleVote('away')}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          2
        </button>
        <span className="text-sm mt-1">{votes.away}</span>
      </div>
    </div>
  );
}
