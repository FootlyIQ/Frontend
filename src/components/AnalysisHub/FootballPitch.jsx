import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import clusterDescriptions from "./cluster_descriptions.json";
import lastThirdDesc from "./last_third_desc.json";
import styles from './pitch.module.css';

const FootballPitch = ({ width = 772, height = 500 }) => {
    const [passes, setPasses] = useState([]);
    const [descriptions, setDescriptions] = useState({});
    const [selectedTeam, setSelectedTeam] = useState("Arsenal");
    const [isSuccessful, setIsSuccessful] = useState(false);
    const [isHighPass, setIsHighPass] = useState(false);
    const [isLongPass, setIsLongPass] = useState(false);
    const [minPassLength, setMinPassLength] = useState("");
    
    const pitchWidth = 105; // meters
    const pitchHeight = 68;

    const xScale = d3.scaleLinear().domain([0, pitchWidth]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, pitchHeight]).range([0, height]);
    const colorScale = d3.scaleOrdinal(d3.schemeSet1);
    // Extract unique cluster labels from the fetched passes
    const uniqueLabels = Array.from(new Set(passes.map(p => p.label)));

    const fetchPasses = () => {
        fetch(`https://footlyiq-backend.onrender.com/api/passes/most-common?team_name=${encodeURIComponent(selectedTeam)}`)
            .then(res => res.json())
            .then(data => {
                setPasses(data);
                setDescriptions(clusterDescriptions); // set only after successful fetch
            })
            .catch(err => console.error("Error fetching passes:", err));
    };

    const fetchLastThirdPasses = () => {
        fetch(`https://footlyiq-backend.onrender.com/api/passes/last-third?team_name=${encodeURIComponent(selectedTeam)}`)
            .then(res => res.json())
            .then(data => {
                setPasses(data);
                setDescriptions(lastThirdDesc); // set only after successful fetch
            })
            .catch(err => console.error("Error fetching passes:", err));
    };

    const fetchFilteredPasses = () => {
        const params = new URLSearchParams();
        params.append("team_name", selectedTeam);
        (isSuccessful) ? params.append("successful", "true") : params.append("successful", "false");
        (isHighPass) ? params.append("pass_high", "true") : params.append("pass_high", "false");
        (isLongPass) ? params.append("long_pass", "true") : params.append("long_pass", "false");
        if (minPassLength) params.append("pass_length", minPassLength);

        fetch(`https://footlyiq-backend.onrender.com/api/passes/filters?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
            setPasses(data);
            setDescriptions(clusterDescriptions);
        })
        .catch(err => console.error("Error fetching filtered data:", err));
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


                    {/* Conditionally render passes and marker */}
                    {passes.length > 0 && (
                        <>
                            {passes.map((pass, index) => (
                                <line
                                    key={index}
                                    x1={xScale(pass.start_x)}
                                    y1={yScale(pitchHeight - pass.start_y)}
                                    x2={xScale(pass.end_x)}
                                    y2={yScale(pitchHeight - pass.end_y)}
                                    stroke={colorScale(pass.label)}
                                    strokeWidth={2}
                                    markerEnd="url(#arrow)"
                                />
                            ))}
                            <defs>
                                <marker
                                    id="arrow"
                                    viewBox="0 0 10 10"
                                    refX="5"
                                    refY="5"
                                    markerWidth="4"
                                    markerHeight="5"
                                    orient="auto-start-reverse"
                                >
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="white" />
                                </marker>
                            </defs>
                        </>
                    )}
                </svg>

                {/* Conditionally render legend */}
                {passes.length > 0 && (
                    <div className={styles.legendContainer}>
                        <h3 className={styles.legendTitle}>Pass Cluster Legend</h3>
                        <ul className={styles.legendList}>
                        {uniqueLabels.map((label) => (
                            <li key={label} className={styles.legendItem}>
                            <strong
                                className={styles.clusterLabel}
                                style={{ color: colorScale(label) }}
                            >
                                Cluster {label + 1}:
                            </strong>
                            {descriptions[label] || "Description not available"}
                            </li>
                        ))}
                        </ul>
                    </div>
                )}
                {/*
                    {passes.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                            <h3 style={{ color: "white" }}>Pass Cluster Legend</h3>
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {uniqueLabels.map(label => (
                                    <li key={label} style={{ color: colorScale(label), marginBottom: "4px" }}>
                                        <strong>Cluster {label + 1}:</strong> {descriptions[label] || "Description not available"}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                */}
                
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
                <button onClick={fetchPasses} className={styles.button}>
                    Show Most Common Passes
                </button>
                <button onClick={fetchLastThirdPasses} className={styles.button}>
                    Show Last 3rd Passes
                </button>

                {/*filtering*/}
                <div className={styles.filterGroup}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={isSuccessful}
                            onChange={(e) => setIsSuccessful(e.target.checked)}
                            className={styles.checkbox}
                        />
                        Successful Pass
                    </label>

                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={isHighPass}
                            onChange={(e) => setIsHighPass(e.target.checked)}
                            className={styles.checkbox}
                        />
                        High Pass
                    </label>

                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={isLongPass}
                            onChange={(e) => setIsLongPass(e.target.checked)}
                            className={styles.checkbox}
                        />
                        Long Pass
                    </label>

                    <label className={styles.inputLabel}>
                        Min Pass Length:
                        <input
                            type="number"
                            value={minPassLength}
                            onChange={(e) => setMinPassLength(e.target.value)}
                            className={styles.input}
                        />
                    </label>
                </div>
                <button onClick={fetchFilteredPasses} className={styles.button}>
                    Apply Filters
                </button>
            </aside>
        </div>
    );
};

export default FootballPitch;
