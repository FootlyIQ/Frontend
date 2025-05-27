import React, { useEffect, useState } from "react";
import { auth } from "../../firebaseConfig";

export default function VoteBar() {
  const [votes, setVotes] = useState({ '1': 0, 'X': 0, '2': 0 });
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchVotes = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/get-votes");
      const data = await res.json();
      setVotes(data);
    } catch (error) {
      console.error("Failed to fetch votes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteOption) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("You must be logged in to vote.");
        return;
      }

      const votePayload = {
        user_id: currentUser.uid,
        vote: voteOption,
      };

      const res = await fetch("http://127.0.0.1:5000/submit-vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(votePayload),
      });

      if (res.ok) {
        await fetchVotes();
        setHasVoted(true);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to submit vote.");
      }
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, []);

  if (loading) return <div>Loading vote data...</div>;

  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      {/* 1 - Home */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => handleVote("1")}
          disabled={hasVoted}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          1
        </button>
        <span className="text-sm mt-1">{votes["1"]}</span>
      </div>

      {/* X - Draw */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => handleVote("X")}
          disabled={hasVoted}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          X
        </button>
        <span className="text-sm mt-1">{votes["X"]}</span>
      </div>

      {/* 2 - Away */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => handleVote("2")}
          disabled={hasVoted}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
        >
          2
        </button>
        <span className="text-sm mt-1">{votes["2"]}</span>
      </div>
    </div>
  );
}
