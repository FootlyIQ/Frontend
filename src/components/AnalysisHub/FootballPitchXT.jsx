import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import styles from './pitch.module.css';


const FootballPitchXT = ({ width = 700, height = 453 }) => {
    const [selectedTeam, setSelectedTeam] = useState("Arsenal");    //lahko je blank
    const [heatmapData, setHeatmapData] = useState(null);
    const [shotsData, setShotsData] = useState(null);
    const [probData, setProbData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: "" });
    const [hoveredBin, setHoveredBin] = useState(null);
    const [maxCount, setMaxCount] = useState(0);


    const pitchWidth = 105; // meters
    const pitchHeight = 68;
    
    const xScale = d3.scaleLinear().domain([0, pitchWidth]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, pitchHeight]).range([0, height]);

    const fetchMovingXT = () => {
        setLoading(true);
        setShotsData(null);     //clear shots xT
        setProbData(null);     //clear shot probability 
        fetch(`https://footlyiq-backend.onrender.com/api/xT/moving?team_name=${encodeURIComponent(selectedTeam)}`)
        .then(res => res.json())
        .then(data => {
            const counts = data.counts;
            console.log(counts);
            const max = Math.max(...counts.flat());
            console.log(max);
            setMaxCount(max);
            setHeatmapData(data.counts);
            setLoading(false);
        })
        .catch(err => {
            console.error("Error fetching moving xT map:", err);
            setLoading(false);
        });
    }

    const fetchShotsXT = () => {
        setLoading(true);
        setHeatmapData(null);   //clear moving xT
        setProbData(null);     //clear shot probability 
        fetch(`https://footlyiq-backend.onrender.com/api/xT/shots?team_name=${encodeURIComponent(selectedTeam)}`)
        .then(res => res.json())
        .then(data => {
            const counts = data.counts;
            console.log(counts);
            const max = Math.max(...counts.flat());
            console.log(max);
            setMaxCount(max);
            setShotsData(data.counts);
            setLoading(false);
        })
        .catch(err => {
            console.error("Error fetching moving xT map:", err);
            setLoading(false);
        });
    }

    const fetchShotProb = () => {
        setLoading(true);
        setHeatmapData(null);   //clear moving xT
        setShotsData(null);     //clear shots xT
        fetch(`https://footlyiq-backend.onrender.com/api/xT/shot-probability?team_name=${encodeURIComponent(selectedTeam)}`)
        .then(res => res.json())
        .then(data => {
            setProbData(data.probability);
            setLoading(false);
        })
        .catch(err => {
            console.error("Error fetching moving xT map:", err);
            setLoading(false);
        });
    }

    

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


                    {/* Moving xT heatmap */}
                    {heatmapData && (() => {
                        const flatCounts = heatmapData.flat();
                        const maxCount = d3.max(flatCounts);
                        const colorScale = d3.scaleSequential()
                            .domain([0, maxCount])
                            .interpolator(d3.interpolateBlues);

                        return heatmapData.map((row, i) =>
                            row.map((count, j) => {
                                const numRows = 12;
                                const cellWidth = pitchWidth / 16;
                                const cellHeight = pitchHeight / 12;
                                const counter = row[j];
                                const color = colorScale(count);

                                return (
                                    <rect
                                        key={`cell-${i}-${j}`}
                                        x={xScale(j * cellWidth)}
                                        y={yScale((numRows -1 - i) * cellHeight)}
                                        width={xScale(cellWidth) - xScale(0)}
                                        height={yScale(cellHeight) - yScale(0)}
                                        fill={color}
                                        opacity={hoveredBin?.i === i && hoveredBin?.j === j ? 1 : 0.7}
                                        onMouseEnter={(e) => {
                                            setHoveredBin({ i, j });
                                            const percentage = maxCount > 0 ? (counter / maxCount).toFixed(3) : "0";
                                            setTooltip({
                                                visible: true,
                                                x: e.clientX,
                                                y: e.clientY,
                                                content: `${percentage} index of moved passes`,
                                            });
                                        }}
                                        onMouseMove={(e) => {
                                            setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredBin(null);
                                            setTooltip({ visible: false, x: 0, y: 0, content: "" });
                                        }}
                                    />
                                );
                            })
                        );
                    })()}


                    {/* Shots xT  Heatmap */}
                    {shotsData && (() => {
                        const flatCounts = shotsData.flat();
                        const maxCount = d3.max(flatCounts);
                        const colorScale = d3.scaleSequential()
                            .domain([0, maxCount])
                            .interpolator(d3.interpolateGreens);

                        return shotsData.map((row, i) =>
                            row.map((count, j) => {
                                const numRows = 12;
                                const cellWidth = pitchWidth / 16;
                                const cellHeight = pitchHeight / 12;
                                const counter = row[j];
                                const color = colorScale(count);

                                return (
                                    <rect
                                        key={`cell-${i}-${j}`}
                                        x={xScale(j * cellWidth)}
                                        y={yScale((numRows -1 - i) * cellHeight)}
                                        width={xScale(cellWidth) - xScale(0)}
                                        height={yScale(cellHeight) - yScale(0)}
                                        fill={color}
                                        opacity={hoveredBin?.i === i && hoveredBin?.j === j ? 1 : 0.7}
                                        onMouseEnter={(e) => {
                                            setHoveredBin({ i, j });
                                            const percentage = maxCount > 0 ? (counter / maxCount).toFixed(3) : "0";
                                            setTooltip({
                                                visible: true,
                                                x: e.clientX,
                                                y: e.clientY,
                                                content: `${percentage} index of shots taken`,
                                            });
                                        }}
                                        onMouseMove={(e) => {
                                            setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredBin(null);
                                            setTooltip({ visible: false, x: 0, y: 0, content: "" });
                                        }}
                                    />
                                );
                            })
                        );
                    })()}

                    {/* Shot Probability Heatmap */}
                    {probData && probData.map((row, yIdx) =>
                        row.map((value, xIdx) => {
                            const binWidth = pitchWidth / 16;
                            const binHeight = pitchHeight / 12;
                            const isHovered = hoveredBin?.i === yIdx && hoveredBin?.j === xIdx;

                            return (
                                <rect
                                    key={`${xIdx}-${yIdx}`}
                                    x={xScale(xIdx * binWidth)}
                                    y={yScale(pitchHeight - (yIdx + 1) * binHeight)}
                                    width={xScale(binWidth) - xScale(0)}
                                    height={yScale(binHeight) - yScale(0)}
                                    fill={d3.interpolateBuPu(value)} 
                                    opacity={isHovered ? 1 : 0.7}
                                    onMouseEnter={(e) => {
                                        setHoveredBin({ i: yIdx, j: xIdx });
                                        setTooltip({
                                            visible: true,
                                            x: e.clientX,
                                            y: e.clientY,
                                            content: `${(value * 100).toFixed(1)}% shot probability`,
                                        });
                                    }}
                                    onMouseMove={(e) => {
                                        setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredBin(null);
                                        setTooltip({ visible: false, x: 0, y: 0, content: "" });
                                    }}
                                />
                            );
                        })
                    )}
                </svg>

                {/* Tooltip */}
                {tooltip.visible && (
                    <div
                        style={{
                            position: "fixed",
                            left: tooltip.x + 15,
                            top: tooltip.y + 15,
                            backgroundColor: "rgba(0,0,0,0.8)",
                            color: "white",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            pointerEvents: "none",
                            fontSize: "0.875rem",
                            zIndex: 1000,
                        }}
                    >
                        {tooltip.content}
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
                <button onClick={fetchMovingXT} disabled={loading} className={styles.button}>
                    Show xT Map
                </button>
                <button onClick={fetchShotsXT} disabled={loading} className={styles.button}>
                    Show Shots Map
                </button>
                <button onClick={fetchShotProb} disabled={loading} className={styles.button}>
                    Show Shot Probability Map
                </button>

                {heatmapData && (
                    <p className="text-gray-400 mt-4">The index shows the ratio of passes moved compared to the zone where the most passes were moved (1.000).</p>
                )}
                {shotsData && (
                    <p className="text-gray-400 mt-4">The index shows the ratio of shots compared to the zone where the most shots were taken (1.000).</p>
                )}
            </aside>
        </div>
    );
};

export default FootballPitchXT;
