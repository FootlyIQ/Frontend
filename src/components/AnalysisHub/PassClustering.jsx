import Rabona from 'rabonajs';
import { useEffect, useState } from 'react';
import * as d3 from "d3";
import FootballPitch from './FootballPitch';

export default function PassClustering() {
    const [pitch, setPitch] = useState(null);

    useEffect(() => {
        // Fetch clustered pass data for Arsenal
        async function fetchAndPlotPasses() {
            try {
                const res = await fetch("http://127.0.0.1:5000/api/passes/last-third/most-common?team_name=Arsenal");
                const data = await res.json();

                if(!Array.isArray(data)) {
                    console.error("Invalid data received", data);
                    return;
                }

                // Remove existing pitch if it exists
                const container = document.getElementById('pitch');
                if (container) container.innerHTML = '';

                // Create new pitch
                const newPitch = Rabona.pitch('pitch', {
                    height: 68,
                    width: 105,
                    padding: 100,
                    linecolour: '#ffffff',
                    fillcolour: '#7ec850',
                });

                setPitch(newPitch);

                // Extract unique cluster labels
                const uniqueLabels = [...new Set(data.map(d => d.label))];

                // Define colors for clusters (as many as needed)
                const colors = ['red', 'blue', 'orange', 'purple', 'cyan', 'pink'];
                const clusterColorMap = {};
                uniqueLabels.forEach((label, idx) => {
                    clusterColorMap[label] = colors[idx % colors.length];
                });

                // Group passes by cluster and plot each group
                for(const label of uniqueLabels) {
                    const clusterPasses = data
                    .filter(pass => pass.label === label)
                    .map(pass => ({
                        startX: pass.start_x,
                        startY: pass.start_y,
                        endX: pass.end_x,
                        endY: pass.end_y,
                        length: pass.pass_length,
                        //angle: pass.angle,
                    }));

                    Rabona.layer({
                        type: 'arrow',
                        data: clusterPasses,
                        options: {
                            colour: clusterColorMap[label],
                            opacity: 0.9,
                            width: 2,
                        },
                    }).addTo(newPitch);
                }

            } catch (error) {
                console.error("Error loading or plotting passes:", error);
            }
        }

        fetchAndPlotPasses();
    }, []);

    return (
        <>
        <FootballPitch />
        </>
    );
}

//<div id="pitch" style={{ width: '800px', height: '500px', margin: 'auto' }}/>