import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import styles from './pitch.module.css';


const FootballPitchXG = ({ width = 772, height = 500 }) => {
    const [selectedTeam, setSelectedTeam] = useState("Arsenal");    //lahko je blank
    const [heatmapData, setHeatmapData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, value: null });
    const [hoveredBin, setHoveredBin] = useState(null);
    
    const pitchWidth = 105; // meters
    const pitchHeight = 68;

    const xScale = d3.scaleLinear().domain([0, pitchWidth]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, pitchHeight]).range([0, height]);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    /*
    const fetchHeatmap = () => {
        setLoading(true);
        setHeatmapData([]); //clear the previous render
        fetch(`http://127.0.0.1:5000/api/xG/heatmap?team_name=${encodeURIComponent(selectedTeam)}`)
            .then(res => res.json())
            .then(data => {
                setHeatmapData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching heatmap:", err);
                setLoading(false);
            });
    }
    */

    const fetchHeatmap = () => {
        setLoading(true);
        setHeatmapData([]); // Clear previous render

        const fetchOnce = async () => {
            const res = await fetch(`https://footlyiq-backend.onrender.com/api/xG/heatmap?team_name=${encodeURIComponent(selectedTeam)}`);
            const data = await res.json();
            setHeatmapData(data);
        };

        fetchOnce().then(() => {
            // Simulate second click after short delay (e.g., 100ms)
            setTimeout(() => {
                fetchOnce().then(() => {
                    setLoading(false);
                });
            }, 25);
        }).catch(err => {
            console.error("Error fetching heatmap:", err);
            setLoading(false);
        });
    };

    
    

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


                    {/* Conditionally render xG */}
                    {/*
                        {loading ? (
                            <p className="text-2xl font-bold text-emerald-500">Loading heatmap...</p>
                        ) : (
                            heatmapData.length > 0 && (
                            <>
                                {heatmapData.map((d, i) => (
                                    <rect
                                        key={i}
                                        x={xScale(d.x - (105 / 11) / 2)}  // center the bin
                                        y={yScale(d.y - (68 / 11) / 2)}   // because y increases downward in SVG
                                        width={xScale(105 / 11) - xScale(0)}
                                        //height={yScale(0) + yScale(68 / 11)}
                                        height={yScale(68/11) - yScale(0)}
                                        fill={d3.interpolateReds(d.xG / 0.3)}  // normalize assuming max xG ~ 0.3
                                        opacity={0.5}
                                    />
                                    
                                ))}
                            </>
                        )
                        )}
                    */}

                    {/* Render Heatmap if not loading */}
                    {!loading && heatmapData.length > 0 && heatmapData.map((d, i) => (
                        <rect
                            key={i}
                            x={xScale((pitchWidth - d.x) - (pitchWidth / 11) / 2)}
                            y={yScale(d.y - (pitchHeight / 11) / 2)}
                            //y={yScale(d.y - (pitchHeight / 11) / 2)}
                            width={xScale(pitchWidth / 11) - xScale(0)}
                            height={yScale(pitchHeight / 11) - yScale(0)}
                            fill={d3.interpolateReds(d.xG / 0.3)}
                            opacity={hoveredBin === i ? 0.9 : 0.5}
                            onMouseEnter={(e) => {
                                setHoveredBin(i);
                                setTooltip({
                                    visible: true,
                                    x: e.clientX,
                                    y: e.clientY,
                                    value: d.xG.toFixed(3),
                                });
                            }}
                            onMouseMove={(e) => {
                                setTooltip((prev) => ({
                                    ...prev,
                                    x: e.clientX,
                                    y: e.clientY,
                                }));
                            }}
                            onMouseLeave={() => {
                                setHoveredBin(null);
                                setTooltip({ visible: false, x: 0, y: 0, value: null });
                            }}
                        />
                    ))}
                    
                </svg>

                {/* Tooltip */}
                {tooltip.visible && (
                    <div
                        className="absolute bg-black text-white px-2 py-1 text-sm rounded"
                        style={{
                            left: tooltip.x + 10,
                            top: tooltip.y - 10,
                            pointerEvents: "none",
                            zIndex: 10,
                            whiteSpace: "nowrap",
                        }}
                    >
                        xG: {tooltip.value}
                    </div>
                )}

                {/* Loading Message OUTSIDE SVG */}
                {loading && (
                    <p className="text-2xl font-bold text-emerald-500 mt-4">Loading heatmap...</p>
                )}
            </section>

            <aside className={styles.sidebar}>
                <label htmlFor="team-select" className={styles.label}>Select Team:</label>
                <select
                    id="team-select"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className={styles.select}
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
                <button onClick={fetchHeatmap} className={styles.button}>
                    Show xG Map
                </button>
            </aside>
        </div>
    );
};

export default FootballPitchXG;
