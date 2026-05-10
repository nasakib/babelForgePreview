/**
 * babelForge Scientific Figure Generator
 * Generates high-fidelity SVG visualizations for clinical publications
 */

const FigureGenerator = {
    // 1. Gini Importance Heatmap (Fingerprinting Study)
    generateGiniHeatmap: (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = 700;
        const height = 150;
        const rows = 4;
        const cols = 50;
        const cellWidth = width / cols;
        const cellHeight = height / rows;

        let svg = `<svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; background:#fff;">`;
        
        for (let r = 0; i < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Generate a "pattern" of importance: higher at ends and middle
                const baseVal = Math.sin(c * 0.2) * 0.5 + 0.5;
                const importance = Math.pow(baseVal, 3) * (1 - (r / rows));
                const opacity = 0.1 + importance * 0.9;
                const color = `rgba(99, 102, 241, ${opacity})`;
                
                svg += `<rect x="${c * cellWidth}" y="${r * cellHeight}" width="${cellWidth - 1}" height="${cellHeight - 1}" fill="${color}" />`;
            }
        }
        
        svg += `
            <text x="0" y="${height + 15}" font-family="Inter" font-size="10" fill="#666">Schaefer ROI Index (1-200)</text>
            <text x="${width - 80}" y="${height + 15}" font-family="Inter" font-size="10" fill="#666">Spectral Bin (1-32)</text>
        </svg>`;
        
        container.innerHTML = svg;
    },

    // 2. Dimensionality Waterfall (Topology Study)
    generateTopologyWaterfall: (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = 600;
        const height = 250;
        const padding = 40;
        
        const responsiveData = [100, 95, 88, 75, 60, 45, 30, 20, 12, 5, 2]; // Up to 11D
        const resistantData = [100, 80, 45, 15, 4, 1, 0, 0, 0, 0, 0];    // Drops after 4D

        let svg = `<svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; background:#fff;">`;
        
        // Axes
        svg += `<line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#333" stroke-width="2" />`;
        svg += `<line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#333" stroke-width="2" />`;

        const getX = (i) => padding + (i * (width - 2 * padding) / 10);
        const getY = (v) => height - padding - (v * (height - 2 * padding) / 100);

        // Responsive Curve
        let respPath = `M ${getX(0)} ${getY(responsiveData[0])}`;
        for(let i=1; i<11; i++) respPath += ` L ${getX(i)} ${getY(responsiveData[i])}`;
        svg += `<path d="${respPath}" fill="none" stroke="#6366f1" stroke-width="3" />`;
        
        // Resistant Curve
        let resPath = `M ${getX(0)} ${getY(resistantData[0])}`;
        for(let i=1; i<11; i++) resPath += ` L ${getX(i)} ${getY(resistantData[i])}`;
        svg += `<path d="${resPath}" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="5,5" />`;

        // Labels
        svg += `<text x="${width/2}" y="${height - 5}" font-family="Inter" font-size="12" text-anchor="middle">Clique Dimension (D)</text>`;
        svg += `<text x="10" y="${height/2}" font-family="Inter" font-size="12" transform="rotate(-90 10,${height/2})" text-anchor="middle">Integrity (%)</text>`;
        
        // Legend
        svg += `<rect x="${width-120}" y="50}" width="10" height="10" fill="#6366f1" />`;
        svg += `<text x="${width-105}" y="59}" font-family="Inter" font-size="10">Responsive</text>`;
        svg += `<rect x="${width-120}" y="70}" width="10" height="10" fill="#ef4444" />`;
        svg += `<text x="${width-105}" y="79}" font-family="Inter" font-size="10">Resistant</text>`;

        svg += `</svg>`;
        container.innerHTML = svg;
    },

    // 3. Arnold Tongue Expansion (ZenBud Study)
    generateArnoldTongues: (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = 600;
        const height = 300;
        
        let svg = `<svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; background:#fff;">`;
        
        // Generate "Tongue" shapes (V-shapes)
        const centers = [100, 300, 500];
        centers.forEach((c, idx) => {
            // Unstable (Narrow)
            svg += `<path d="M ${c-20} 0 L ${c} ${height-50} L ${c+20} 0" fill="#fee2e2" stroke="#ef4444" stroke-width="1" />`;
            // ZB-01 Enhanced (Wide)
            svg += `<path d="M ${c-60} 0 L ${c} ${height-50} L ${c+60} 0" fill="rgba(252, 211, 77, 0.2)" stroke="#f59e0b" stroke-width="2" />`;
        });

        // Axes
        svg += `<line x1="40" y1="${height-50}" x2="${width-40}" y2="${height-50}" stroke="#333" stroke-width="2" />`;
        svg += `<text x="${width/2}" y="${height-10}" font-family="Inter" font-size="12" text-anchor="middle">Coupling Strength (K)</text>`;
        svg += `<text x="10" y="${height/2}" font-family="Inter" font-size="12" transform="rotate(-90 10,${height/2})" text-anchor="middle">Detuning (Δω)</text>`;

        svg += `</svg>`;
        container.innerHTML = svg;
    }
};
