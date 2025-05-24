import React, { useEffect, useState } from "react";
import * as d3 from "d3";


const FootballPitchXT = ({ width = 700, height = 453 }) => {
    const [selectedTeam, setSelectedTeam] = useState("Arsenal");    //lahko je blank

    const pitchWidth = 105; // meters
    const pitchHeight = 68;
    
    const xScale = d3.scaleLinear().domain([0, pitchWidth]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, pitchHeight]).range([0, height]);
    

    return (
        <div className="flex flex-col lg:flex-row min-h-screen gap-5">
            <section>
                <svg width={width} height={height} style={{ backgroundColor: "#222222", opacity: "0.6" }}>  {/* zelena barva: 2e7d32 */}
                    {/* Outer pitch */}
                    <rect
                        x={xScale(0)}
                        y={yScale(0)}
                        width={xScale(pitchWidth)}
                        height={yScale(pitchHeight)}
                        stroke="white"
                        strokeWidth={2}
                        fill="none"
                    />

                    {/* Halfway line */}
                    <line
                        x1={xScale(pitchWidth / 2)}
                        y1={yScale(0)}
                        x2={xScale(pitchWidth / 2)}
                        y2={yScale(pitchHeight)}
                        stroke="white"
                        strokeWidth={2}
                    />

                    {/* Center circle */}
                    <circle
                        cx={xScale(pitchWidth / 2)}
                        cy={yScale(pitchHeight / 2)}
                        r={xScale(9.15) - xScale(0)}
                        stroke="white"
                        strokeWidth={2}
                        fill="none"
                    />

                    {/* Center spot */}
                    <circle
                        cx={xScale(pitchWidth / 2)}
                        cy={yScale(pitchHeight / 2)}
                        r={2}
                        fill="white"
                    />

                    {/* Penalty areas (16.5m box) */}
                    {/* Left */}
                    <rect
                        x={xScale(0)}
                        y={yScale((pitchHeight - 40.32) / 2)}
                        width={xScale(16.5) - xScale(0)}
                        height={yScale(40.32) - yScale(0)}
                        stroke="white"
                        strokeWidth={2}
                        fill="none"
                    />
                    {/* Right */}
                    <rect
                        x={xScale(pitchWidth - 16.5)}
                        y={yScale((pitchHeight - 40.32) / 2)}
                        width={xScale(pitchWidth) - xScale(pitchWidth - 16.5)}
                        height={yScale(40.32) - yScale(0)}
                        stroke="white"
                        strokeWidth={2}
                        fill="none"
                    />

                    {/* Goal areas (5.5m box) */}
                    {/* Left */}
                    <rect
                        x={xScale(0)}
                        y={yScale((pitchHeight - 18.32) / 2)}
                        width={xScale(5.5) - xScale(0)}
                        height={yScale(18.32) - yScale(0)}
                        stroke="white"
                        strokeWidth={2}
                        fill="none"
                    />
                    {/* Right */}
                    <rect
                        x={xScale(pitchWidth - 5.5)}
                        y={yScale((pitchHeight - 18.32) / 2)}
                        width={xScale(pitchWidth) - xScale(pitchWidth - 5.5)}
                        height={yScale(18.32) - yScale(0)}
                        stroke="white"
                        strokeWidth={2}
                        fill="none"
                    />

                    {/* Penalty spots */}
                    <circle
                        cx={xScale(11)}
                        cy={yScale(pitchHeight / 2)}
                        r={2}
                        fill="white"
                    />
                    <circle
                        cx={xScale(pitchWidth - 11)}
                        cy={yScale(pitchHeight / 2)}
                        r={2}
                        fill="white"
                    />

                    

                    {/* Goal lines */}
                    {/* Left goal line */}
                    <line
                        x1={xScale(0)}
                        y1={yScale((pitchHeight - 7.32) / 2)}
                        x2={xScale(0)}
                        y2={yScale((pitchHeight + 7.32) / 2)}
                        stroke="white"
                        strokeWidth={8}
                    />
                    {/* Right goal line */}
                    <line
                        x1={xScale(pitchWidth)}
                        y1={yScale((pitchHeight - 7.32) / 2)}
                        x2={xScale(pitchWidth)}
                        y2={yScale((pitchHeight + 7.32) / 2)}
                        stroke="white"
                        strokeWidth={8}
                    />
                </svg>

            </section>

            <aside className="hidden lg:block w-80 bg-slate-700 p-6">
                <label htmlFor="team-select">Select Team:</label>
                <select
                    id="team-select"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    style={{ marginLeft: "10px", padding: "5px" }}
                >
                    <option value="Arsenal">Arsenal</option>
                    <option value="Aston Villa">Aston Villa</option>
                    <option value="Bournemouth">Bournemouth</option>
                    <option value="Brentford">Brentford</option>
                    <option value="Brighton">Brighton</option>
                    <option value="Burnley">Burnley</option>
                    <option value="Chelsea">Chelsea</option>
                    <option value="Crystal Palace">Crystal Palace</option>
                    <option value="Everton">Everton</option>
                    <option value="Fulham">Fulham</option>
                    <option value="Leeds United">Leeds United</option>
                    <option value="Leicester City">Leicester City</option>
                    <option value="Liverpool">Liverpool</option>
                    <option value="Manchester City">Manchester City</option>
                    <option value="Manchester United">Manchester United</option>
                    <option value="Newcastle United">Newcastle United</option>
                    <option value="Nottingham Forest">Nottingham Forest</option>
                    <option value="Sheffield United">Sheffield United</option>
                    <option value="Southampton">Southampton</option>
                    <option value="Tottenham Hotspur">Tottenham Hotspur</option>
                    <option value="Watford">Watford</option>
                    <option value="West Ham United">West Ham United</option>
                    <option value="Wolverhampton Wanderers">Wolverhampton</option>
                </select>
                <button className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition">
                    Show xT Map
                </button>
            </aside>
        </div>
    );
};

export default FootballPitchXT;
