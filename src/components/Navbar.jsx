import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-slate-900 p-6 shadow-lg lg:w-64 w-full">
            {/* Logo & Hamburger */}
            <div className="flex justify-between items-center lg:block">
                <h1 className="text-2xl font-bold text-emerald-500">⚽ FootlyIQ</h1>
                {/* Hamburger only visible on small screens */}
                <button
                className="lg:hidden text-stone-200 focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
                >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                </button>
            </div>

            {/* Menu */}
            <ul className={`mt-6 space-y-4 font-medium text-stone-200 ${isOpen ? 'block' : 'hidden'} lg:block`}>
                <li><Link to="/" className="hover:text-emerald-500">Live Scores</Link></li>
                <li className="hover:text-emerald-500 cursor-pointer">Teams</li>
                <li className="hover:text-emerald-500 cursor-pointer">Players</li>
                <li><Link to="/fantasy" className="hover:text-emerald-500">Fantasy</Link></li>
                <li><Link to="/analysis" className="hover:text-emerald-500">Analysis Hub</Link></li>
                <li className="hover:text-emerald-500 cursor-pointer">Predictions</li>
                <li><Link to="/profile" className="hover:text-emerald-500">Profile</Link></li>
            </ul>
        </nav>
    );
}  