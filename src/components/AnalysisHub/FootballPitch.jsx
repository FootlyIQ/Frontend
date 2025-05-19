import React, { useEffect, useState } from "react";
import * as d3 from "d3";

const FootballPitch = ({ width = 800, height = 520 }) => {
    const [passes, setPasses] = useState([]);
    const [descriptions, setDescriptions] = useState({});

    useEffect(() => {
        d3.csv("/cluster_descriptions.csv").then(data => {
            const descMap = {};
            data.forEach(d => {
                descMap[parseInt(d.cluster_label) - 1] = d.description; // -1 for 0-based backend
            });
            console.log(descMap);
            setDescriptions(descMap);
        });
    }, []);

    useEffect(() => {
        fetch("http://127.0.0.1:5000/api/passes/last-third/most-common?team_name=Arsenal")
        .then(res => res.json())
        .then(data => setPasses(data))
        .catch(err => console.error("Error fetching passes:", err));
    }, []);

    const pitchWidth = 105; // meters
    const pitchHeight = 68;

    const xScale = d3.scaleLinear().domain([0, pitchWidth]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, pitchHeight]).range([0, height]);


    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    // Extract unique cluster labels from the fetched passes
    const uniqueLabels = Array.from(new Set(passes.map(p => p.label)));

    return (
        <>
            <svg width={width} height={height} style={{ backgroundColor: "#2e7d32" }}>
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

                {/* Plot passes as arrows or lines */}
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

                {/* Define arrowhead */}
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
            </svg>

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
        </>
    );
};

export default FootballPitch;
