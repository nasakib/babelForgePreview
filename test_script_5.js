
        // Smooth scrolling for navigation
        function scrollToSection(id) {
            document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
        }
        
        function toggleExplanation() {
            const overlay = document.getElementById('science-explanation');
            overlay.classList.toggle('hidden');
        }

        // --- 0. Interactive paper charts ---
        const initSciencePaperCharts = () => {
            const bettiCtx = document.getElementById('bettiChart')?.getContext('2d');
            if (bettiCtx) {
                new Chart(bettiCtx, {
                    type: 'line',
                    data: {
                        labels: ['0.05', '0.10', '0.15', '0.20', '0.25', '0.30', '0.35', '0.40'],
                        // Synthetic illustrative Betti curves for conceptual demonstration only; not derived from actual fMRI data or validated for clinical use.
                        datasets: [
                            { label: 'β₀ components', data: [88, 64, 38, 20, 12, 7, 4, 2], borderColor: '#c4b5fd', backgroundColor: 'rgba(196,181,253,0.12)', tension: 0.35, fill: true },
                            { label: 'β₁ loops', data: [2, 9, 23, 31, 24, 16, 8, 3], borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.10)', tension: 0.35, fill: true },
                            { label: 'β₂ cavities', data: [0, 1, 6, 14, 19, 13, 5, 1], borderColor: '#f0abfc', backgroundColor: 'rgba(240,171,252,0.08)', tension: 0.35, fill: true }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            x: { title: { display: true, text: 'Filtration threshold', color: '#8a82a8' }, grid: { color: 'rgba(167,139,250,0.08)' }, ticks: { color: '#8a82a8' } },
                            y: { title: { display: true, text: 'Feature count', color: '#8a82a8' }, beginAtZero: true, grid: { color: 'rgba(167,139,250,0.08)' }, ticks: { color: '#8a82a8' } }
                        },
                        plugins: {
                            subtitle: { display: true, text: 'Conceptual sketch · synthetic illustrative values', color: '#8a82a8', font: { family: 'JetBrains Mono', size: 11 } },
                            legend: { labels: { color: '#c7bce0', font: { family: 'Inter' } } }
                        }
                    }
                });
            }

            const kuramotoCtx = document.getElementById('kuramotoChart')?.getContext('2d');
            if (kuramotoCtx) {
                new Chart(kuramotoCtx, {
                    type: 'line',
                    data: {
                        labels: ['0.0', '0.2', '0.4', '0.6', '0.8', '1.0', '1.2', '1.4', '1.6'],
                        datasets: [
                            { label: 'Order parameter r', data: [0.08, 0.10, 0.14, 0.26, 0.48, 0.67, 0.79, 0.86, 0.90], borderColor: '#86efac', backgroundColor: 'rgba(134,239,172,0.08)', tension: 0.35, fill: true },
                            { label: 'Pathological locking risk', data: [0.05, 0.08, 0.16, 0.36, 0.64, 0.74, 0.70, 0.62, 0.55], borderColor: '#fda4af', backgroundColor: 'rgba(253,164,175,0.08)', tension: 0.35, fill: true }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            x: { title: { display: true, text: 'Global coupling K', color: '#8a82a8' }, grid: { color: 'rgba(167,139,250,0.08)' }, ticks: { color: '#8a82a8' } },
                            y: { min: 0, max: 1, title: { display: true, text: 'Normalized magnitude', color: '#8a82a8' }, grid: { color: 'rgba(167,139,250,0.08)' }, ticks: { color: '#8a82a8' } }
                        },
                        plugins: { legend: { labels: { color: '#c7bce0', font: { family: 'Inter' } } } }
                    }
                });
            }
        };

        // --- 1. Cohort Doughnut Chart ---
        const initCohortChart = () => {
            const ctx = document.getElementById('cohortChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Treatment-Responsive', 'Treatment-Resistant'],
                    datasets: [{
                        data: [133, 133],
                        backgroundColor: [
                            '#a78bfa', // plum 400
                            '#ec4899'  // fuchsia/magenta accent
                        ],
                        borderColor: '#0f0820',
                        borderWidth: 2,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#c7bce0', font: { family: 'Inter' } } },
                        tooltip: {
                            backgroundColor: '#0f0820',
                            borderColor: 'rgba(167,139,250,0.3)',
                            borderWidth: 1,
                            titleColor: '#ede9fe',
                            bodyColor: '#c7bce0',
                            callbacks: {
                                label: function(context) {
                                    return ` ${context.label}: ${context.raw} subjects (50%)`;
                                }
                            }
                        }
                    },
                    cutout: '65%'
                }
            });
        };

        // --- 2. Metrics Bar Chart ---
        const initMetricsChart = () => {
            const ctx = document.getElementById('metricsChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Precision', 'Recall', 'F1-Score'],
                    datasets: [
                        {
                            label: 'Responsive',
                            data: [0.93, 0.93, 0.93],
                            backgroundColor: '#c4b5fd', // plum 300
                            borderRadius: 6
                        },
                        {
                            label: 'Resistant',
                            data: [0.93, 0.93, 0.93],
                            backgroundColor: '#7c3aed', // plum 600
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1.0,
                            grid: { color: 'rgba(167,139,250,0.08)' },
                            ticks: { color: '#8a82a8', font: { family: 'Inter' } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#c7bce0', font: { family: 'Inter', weight: 'bold' } }
                        }
                    },
                    plugins: {
                        legend: { position: 'top', labels: { color: '#c7bce0', font: { family: 'Inter' } } },
                        tooltip: {
                            backgroundColor: '#0f0820',
                            borderColor: 'rgba(167,139,250,0.3)',
                            borderWidth: 1,
                            titleColor: '#ede9fe',
                            bodyColor: '#c7bce0',
                            callbacks: {
                                label: (context) => ` ${context.dataset.label}: ${context.raw.toFixed(2)}`
                            }
                        }
                    }
                }
            });
        };

        // --- 3. High-Fidelity Brain Dashboard (Three.js) ---
        let dashScene, dashCamera, dashRenderer, dashControls, dashRaycaster, dashMouse;
        let dashLobeGroup, dashEdgeGroup, dashCliqueGroup, dashParticleSystem;
        let dashData = null;
        let dashStatus = 'HEALTHY';
        let dashPharmaEfficacy = 0;
        let dashHoveredNode = null;
        let dashSelectedNode = null;
        let signalPackets = [];

        const updateNodeInspector = (node) => {
            document.getElementById('node-inspector-overlay').style.display = 'block';
            document.getElementById('insp-name').innerText = node.userData.name;
            document.getElementById('insp-power').innerText = (node.scale.x * 100).toFixed(0) + '%';

            let syncVal = 0.5 + Math.random() * 0.4;
            let nodeState = 'Active';
            let stateColor = 'text-emerald-400';

            if (dashStatus === 'PTSD') {
                if (dashTreatmentClass === 'NOVEL') {
                    if (dashPharmaEfficacy === 1) { syncVal = 0.88; nodeState = 'Optimized'; stateColor = 'text-amber-400'; } // Gold
                    else if (dashPharmaEfficacy > 1) { syncVal = 1.0; nodeState = 'Hyper-Sync (Toxic)'; stateColor = 'text-cyan-300'; }
                    else { nodeState = 'Fragmented'; stateColor = 'text-rose-500'; }
                } else {
                    if (dashPharmaEfficacy >= 1) { syncVal = 0.4; nodeState = 'Suppressed'; stateColor = 'text-slate-500'; }
                    else { nodeState = 'Fragmented'; stateColor = 'text-rose-500'; }
                }
            } else if (dashStatus === 'ADHD') {
                 if (dashTreatmentClass === 'NOVEL') {
                    if (dashPharmaEfficacy === 1) { syncVal = 0.88; nodeState = 'Upregulated'; stateColor = 'text-amber-400'; }
                    else if (dashPharmaEfficacy > 1) { syncVal = 0.2; nodeState = 'Chaotic Over-stim'; stateColor = 'text-rose-500'; }
                    else { nodeState = 'Hypo-active'; stateColor = 'text-slate-400'; }
                 } else {
                    if (dashPharmaEfficacy === 1) { syncVal = 0.88; nodeState = 'Peak Stimulation'; stateColor = 'text-sky-400'; }
                    else if (dashPharmaEfficacy > 1) { syncVal = 0.1; nodeState = 'Toxic Hyper-arousal'; stateColor = 'text-rose-600'; }
                    else { nodeState = 'Hypo-active'; stateColor = 'text-slate-400'; }
                 }
            } else if (dashStatus === 'TOURETTES') {
                 if (dashTreatmentClass === 'NOVEL') {
                    if (dashPharmaEfficacy === 1) { syncVal = 0.88; nodeState = 'Dampened (Stable)'; stateColor = 'text-amber-400'; }
                    else if (dashPharmaEfficacy > 1) { syncVal = 0.9; nodeState = 'Over-dampened'; stateColor = 'text-slate-500'; }
                    else { syncVal = 0.95; nodeState = 'Hyper-connected (Tic)'; stateColor = 'text-emerald-500'; }
                 } else {
                    if (dashPharmaEfficacy === 1) { syncVal = 0.9; nodeState = 'Rigid Suppression'; stateColor = 'text-slate-500'; }
                    else if (dashPharmaEfficacy > 1) { syncVal = 1.0; nodeState = 'Parkinsonian Frozen'; stateColor = 'text-slate-700'; }
                    else { syncVal = 0.95; nodeState = 'Hyper-connected (Tic)'; stateColor = 'text-emerald-500'; }
                 }
            } else {
                 syncVal = 0.88;
                 nodeState = 'Baseline Alignment';
                 stateColor = 'text-indigo-400';
            }

            document.getElementById('insp-sync').innerText = syncVal.toFixed(2) + ' r';
            const stateEl = document.getElementById('insp-state');
            if (stateEl) {
                stateEl.innerText = nodeState;
                stateEl.className = `text-xs font-bold ${stateColor}`;
            }

            const stateData = dashData[dashStatus === 'ADHD' ? 'ADHD' : (dashStatus === 'TOURETTES' ? 'TOURETTES' : (dashStatus === 'PTSD' ? 'RESISTANT' : 'RESPONSIVE'))];            const connections = stateData.edges.filter(e => e.source === node.userData.id || e.target === node.userData.id);
            const top5 = connections.slice(0, 5).map(e => {
                const otherId = e.source === node.userData.id ? e.target : e.source;
                return stateData.nodes[otherId].name;
            });
            
            const ul = document.getElementById('insp-conns');
            ul.innerHTML = top5.length ? top5.map(name => `<li>→ ${name}</li>`).join('') : '<li class="text-slate-500">No active pathways</li>';
        };

        const initDashboardBrain = () => {
            const container = document.getElementById('dashboard-brain-container');
            if (!container) return;

            dashScene = new THREE.Scene();
            dashScene.background = new THREE.Color(0x030008);
            dashScene.fog = new THREE.FogExp2(0x030008, 0.001);

            dashCamera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1500);
            dashCamera.position.set(0, 100, 300);

            dashRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            dashRenderer.setSize(container.clientWidth, container.clientHeight);
            dashRenderer.setPixelRatio(window.devicePixelRatio);
            container.appendChild(dashRenderer.domElement);

            dashControls = new THREE.OrbitControls(dashCamera, dashRenderer.domElement);
            dashControls.enableDamping = true;
            dashControls.autoRotate = true;
            dashControls.autoRotateSpeed = 0.25;

            dashRaycaster = new THREE.Raycaster();
            dashMouse = new THREE.Vector2();

            dashLobeGroup = new THREE.Group();
            dashEdgeGroup = new THREE.Group();
            dashCliqueGroup = new THREE.Group();
            dashScene.add(dashLobeGroup, dashEdgeGroup, dashCliqueGroup);

            // 1. Atmosphere: Neural Dust
            const partCount = 400;
            const partGeo = new THREE.BufferGeometry();
            const partPos = new Float32Array(partCount * 3);
            for(let i=0; i<partCount*3; i++) partPos[i] = (Math.random() - 0.5) * 600;
            partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
            const partMat = new THREE.PointsMaterial({ color: 0x8b5cf6, size: 1.5, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
            dashParticleSystem = new THREE.Points(partGeo, partMat);
            dashScene.add(dashParticleSystem);

            // 2. The Holographic Shell
            const shellGeo = new THREE.SphereGeometry(65, 32, 32);
            const shellMat = new THREE.MeshPhongMaterial({ 
                color: 0x8b5cf6, 
                wireframe: true, 
                transparent: true, 
                opacity: 0.04,
                blending: THREE.AdditiveBlending 
            });
            const shell = new THREE.Mesh(shellGeo, shellMat);
            shell.scale.set(0.8, 0.6, 1.0);
            dashScene.add(shell);

            // 3. Lighting
            dashScene.add(new THREE.AmbientLight(0x150830));
            const mainLight = new THREE.PointLight(0x8b5cf6, 3, 600);
            mainLight.position.set(50, 100, 100);
            dashScene.add(mainLight);

            const rimLight = new THREE.PointLight(0x00ffcc, 1.5, 400);
            rimLight.position.set(-100, -50, -50);
            dashScene.add(rimLight);

            container.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                dashMouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
                dashMouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
            });

            container.addEventListener('click', () => {
                if (dashHoveredNode) {
                    dashSelectedNode = dashHoveredNode;
                    updateNodeInspector(dashSelectedNode);
                } else {
                    dashSelectedNode = null;
                    document.getElementById('node-inspector-overlay').style.display = 'none';
                }
            });

            if (window.precalculatedTopologyData) {
                dashData = window.precalculatedTopologyData;
                renderDashboardTopology('RESPONSIVE');
            } else {
                fetch('data/topology_projection.json')
                    .then(r => r.json())
                    .then(data => {
                        dashData = data;
                        renderDashboardTopology('RESPONSIVE');
                    })
                    .catch(err => {
                        console.warn("Could not load topology data via fetch or script tag.", err);
                    });
            }

            animateDashboard();
        };

        const renderDashboardTopology = (status) => {
            if (!dashData) return;
            const data = dashData[status];
            
            while(dashLobeGroup.children.length > 0) dashLobeGroup.remove(dashLobeGroup.children[0]);
            while(dashEdgeGroup.children.length > 0) dashEdgeGroup.remove(dashEdgeGroup.children[0]);
            while(dashCliqueGroup.children.length > 0) dashCliqueGroup.remove(dashCliqueGroup.children[0]);
            signalPackets = [];

            const isPTSD = status === 'RESISTANT';
            const lobeGeo = new THREE.SphereGeometry(6, 24, 24);
            
            data.nodes.forEach(n => {
                let baseColor = 0x8b5cf6; // Default (Purple)
                if (n.z < -20) baseColor = 0xf43f5e; // Visual Cortex (Rose)
                else if (n.y > 15 && n.z >= -20 && n.z <= 20) baseColor = 0x10b981; // Somatomotor (Emerald)
                else if (n.y < 0 && n.z >= -20 && n.z <= 20) baseColor = 0xf59e0b; // Limbic / Ventral Attn (Amber)
                else if (n.z > 20) baseColor = 0x818cf8; // Frontal / Control (Indigo)

                const color = isPTSD ? 0x991b1b : baseColor;
                // High-end Fresnel/Glow look
                const mat = new THREE.MeshPhongMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.4,
                    transparent: true,
                    opacity: 0.85,
                    shininess: 100
                });
                const mesh = new THREE.Mesh(lobeGeo, mat);
                mesh.position.set(n.x, n.y, n.z);
                mesh.userData = { ...n, origin: new THREE.Vector3(n.x, n.y, n.z), baseColor: baseColor };
                dashLobeGroup.add(mesh);
            });
            const edgeMat = new THREE.LineBasicMaterial({ color: 0x4c1d95, transparent: true, opacity: 0.1 });
            data.edges.forEach(e => {
                const s = data.nodes[e.source], t = data.nodes[e.target];
                const start = new THREE.Vector3(s.x, s.y, s.z);
                const end = new THREE.Vector3(t.x, t.y, t.z);
                const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
                const line = new THREE.Line(geo, edgeMat);
                line.userData = { source: e.source, target: e.target };
                dashEdgeGroup.add(line);

                // Create signal packets for healthy state
                if (!isPTSD || dashPharmaEfficacy > 0.5) {
                    if (Math.random() > 0.7) {
                        signalPackets.push({
                            pos: start.clone(),
                            start: start,
                            end: end,
                            speed: 0.01 + Math.random() * 0.03,
                            t: Math.random()
                        });
                    }
                }
            });

            data.cliques.forEach(c => {
                if (c.nodes.length >= 3) {
                    const positions = [];
                    for (let i = 1; i < c.nodes.length - 1; i++) {
                        const n0 = data.nodes[c.nodes[0]], ni = data.nodes[c.nodes[i]], ni1 = data.nodes[c.nodes[i+1]];
                        positions.push(n0.x, n0.y, n0.z, ni.x, ni.y, ni.z, ni1.x, ni1.y, ni1.z);
                    }
                    const geo = new THREE.BufferGeometry();
                    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                    const mat = new THREE.MeshPhongMaterial({ 
                        color: isPTSD ? 0xff0055 : 0x00ffcc, 
                        transparent: true, 
                        opacity: 0.12, 
                        side: THREE.DoubleSide,
                        blending: THREE.AdditiveBlending 
                    });
                    dashCliqueGroup.add(new THREE.Mesh(geo, mat));
                }
            });
        };

        
        
        let dashTreatmentClass = 'NOVEL';

        const updateTreatmentClass = (cls) => {
            dashTreatmentClass = cls;
            document.getElementById('btn-novel').classList.toggle('bg-white', cls === 'NOVEL');
            document.getElementById('btn-novel').classList.toggle('shadow-sm', cls === 'NOVEL');
            document.getElementById('btn-novel').classList.toggle('text-indigo-600', cls === 'NOVEL');
            document.getElementById('btn-novel').classList.toggle('text-slate-500', cls !== 'NOVEL');

            document.getElementById('btn-conv').classList.toggle('bg-white', cls === 'CONVENTIONAL');
            document.getElementById('btn-conv').classList.toggle('shadow-sm', cls === 'CONVENTIONAL');
            document.getElementById('btn-conv').classList.toggle('text-indigo-600', cls === 'CONVENTIONAL');
            document.getElementById('btn-conv').classList.toggle('text-slate-500', cls !== 'CONVENTIONAL');
            
            updateDashboardState(dashStatus);
        };

                const setDashboardDose = (level) => {
            const val = {low: 1, mild: 2, high: 3}[level];
            const slider = document.getElementById('pharma-slider');
            if (slider) slider.value = val;
            updatePharmaEfficacy(val);
        };
        
        const updateDashboardState = (state) => {
            dashStatus = state;
            
            document.getElementById('btn-healthy').classList.toggle('active', state === 'HEALTHY');
            document.getElementById('btn-ptsd').classList.toggle('active', state === 'PTSD');
            document.getElementById('btn-adhd').classList.toggle('active', state === 'ADHD');
            document.getElementById('btn-tourettes').classList.toggle('active', state === 'TOURETTES');
            
            let label = 'Healthy Baseline';
            let drugName = 'ZB-01 Dosage';
            let drugDesc = 'Adjust precision dosage to monitor regional stabilization and topological repair rate.';
            let targetState = 'RESPONSIVE';
            
            let moleculeSVG = `<svg viewBox="0 0 160 100" class="h-full w-auto stroke-indigo-600 fill-none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="50,40 70,30 90,40 90,60 70,70 50,60" />
    <path d="M55,45 L55,55 M70,35 L85,45 M70,65 L85,55" stroke-width="1.5" />
    <polygon points="90,40 110,30 120,45 105,60 90,60" />
    <text x="96" y="74" font-family="Inter" font-size="12" fill="currentColor" stroke="none" font-weight="bold">NH</text>
    <path d="M120,45 L135,35 L135,20" />
    <text x="126" y="15" font-family="Inter" font-size="12" fill="currentColor" stroke="none" font-weight="bold">N(CH₃)₂</text>
    <path d="M70,30 L70,15" />
    <text x="63" y="10" font-family="Inter" font-size="12" fill="#ef4444" stroke="none" font-weight="bold">OH</text>
</svg>`;
            let moleculeName = 'ZB-01 (Indole Derivative)';

            if (state === 'PTSD') {
                label = 'PTSD Flash (D7)';
                targetState = 'RESISTANT';
                if (dashTreatmentClass === 'NOVEL') {
                    drugName = 'ZB-01 Dosage';
                    drugDesc = 'Adjust dosage to stabilize hyperarousal and repair 11D cliques.';
                    
                    
                    
                    moleculeName = 'ZB-01 (Indole Derivative)';
                } else {
                    drugName = 'Sertraline (SSRI) Dosage';
                    drugDesc = 'Broad serotonin reuptake inhibition. Induces global dampening without targeted topological repair.';
                    
                    
                    
                    moleculeSVG = `<svg viewBox="0 0 100 50" class="h-full w-auto stroke-slate-500 fill-none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polygon points="30,25 40,15 55,15 65,25 55,35 40,35 Z"/>
                                        <circle cx="20" cy="25" r="2" fill="#64748b"/>
                                        <path d="M30 25 L20 25 M65 25 L75 25"/>
                                   </svg>`;
                    moleculeName = 'Sertraline (Standard of Care)';
                }
            } else if (state === 'ADHD') {
                label = 'ADHD (Inattentive)';
                targetState = 'ADHD';
                if (dashTreatmentClass === 'NOVEL') {
                    drugName = 'SynaptoStim (SS-20) Dosage';
                    drugDesc = 'Adjust dopaminergic stimulant dosage to increase connectivity in frontal networks.';
                    
                    
                    
                    moleculeSVG = `<svg viewBox="0 0 160 100" class="h-full w-auto stroke-indigo-600 fill-none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="40,50 60,38 80,50 80,70 60,82 40,70" />
    <path d="M45,53 L45,67 M60,43 L75,53 M60,77 L75,67" stroke-width="1.5" />
    <path d="M80,50 L105,35 L130,50" />
    <path d="M105,35 L105,15" />
    <text x="135" y="55" font-family="Inter" font-size="12" fill="currentColor" stroke="none" font-weight="bold">NH₂</text>
    <text x="98" y="10" font-family="Inter" font-size="12" fill="currentColor" stroke="none" font-weight="bold">CH₃</text>
</svg>`;
                    moleculeName = 'SS-20 (Phenethylamine Class)';
                } else {
                    drugName = 'Amphetamine Salts Dosage';
                    drugDesc = 'Broad stimulant. Narrow therapeutic window with rapid onset of hyper-arousal toxicity.';
                    
                    
                    
                    moleculeSVG = `<svg viewBox="0 0 100 50" class="h-full w-auto stroke-slate-500 fill-none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polygon points="30,25 40,15 55,15 65,25 55,35 40,35 Z"/>
                                        <path d="M65 25 L80 15 M65 25 L80 35"/>
                                   </svg>`;
                    moleculeName = 'Amphetamine (Standard of Care)';
                }
            } else if (state === 'TOURETTES') {
                label = 'Tourette\'s (Motor Tic)';
                targetState = 'TOURETTES';
                if (dashTreatmentClass === 'NOVEL') {
                    drugName = 'DopaReg-D2 (DR-02) Dosage';
                    drugDesc = 'Adjust D2 antagonist dosage to dampen hyper-connected somatomotor loops.';
                    
                    
                    
                    moleculeSVG = `<svg viewBox="0 0 200 100" class="h-full w-auto stroke-indigo-600 fill-none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <text x="5" y="55" font-family="Inter" font-size="12" fill="#10b981" stroke="none" font-weight="bold">F</text>
    <path d="M15,50 L35,50" />
    <polygon points="35,50 45,35 65,35 75,50 65,65 45,65" />
    <path d="M42,48 L48,40 M60,40 L68,48 M60,60 L48,60" stroke-width="1.5" />
    <path d="M75,50 L90,50 L100,35 L120,35" />
    <path d="M90,50 L90,65 M86,50 L86,65" />
    <text x="84" y="78" font-family="Inter" font-size="12" fill="#ef4444" stroke="none" font-weight="bold">O</text>
    <text x="125" y="40" font-family="Inter" font-size="12" fill="currentColor" stroke="none" font-weight="bold">N</text>
    <polygon points="135,35 145,20 165,20 175,35 165,50 145,50" />
    <path d="M175,35 L190,35" />
    <text x="195" y="40" font-family="Inter" font-size="12" fill="#64748b" stroke="none" font-weight="bold">Cl</text>
</svg>`;
                    moleculeName = 'DR-02 (Butyrophenone Analog)';
                } else {
                    drugName = 'Haloperidol Dosage';
                    drugDesc = 'Aggressive D2 antagonism. Rapidly induces severe Parkinsonian rigidity (Tardive Dyskinesia).';
                    
                    
                    
                    moleculeSVG = `<svg viewBox="0 0 100 50" class="h-full w-auto stroke-slate-500 fill-none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polygon points="25,25 35,15 50,15 60,25 50,35 35,35 Z"/>
                                        <path d="M60 25 L80 25"/>
                                   </svg>`;
                    moleculeName = 'Haloperidol (Standard of Care)';
                }
            }

            document.getElementById('active-scenario-label').innerText = label;
            document.getElementById('drug-name-label').innerText = drugName;
            document.getElementById('drug-desc-label').innerText = drugDesc;
            
            const slider = document.getElementById('pharma-slider');
            slider.max = 3;
            slider.step = 1;
            slider.value = 0;
            
            document.getElementById('molecule-svg-container').innerHTML = moleculeSVG;
            document.getElementById('molecule-name').innerText = moleculeName;
            
            updatePharmaEfficacy(0);
            renderDashboardTopology(targetState);
            updateIntegrityUI();
        };

        const updatePharmaEfficacy = (val) => {
            dashPharmaEfficacy = val / 2.0; // 0=0, 1=0.5, 2=1.0, 3=1.5
            document.getElementById('pharma-percent').innerText = ['None', 'Low', 'Mild', 'High'][val];
            updateIntegrityUI();
        };

        const updateIntegrityUI = () => {
            let score = 100;
            let baseScale = 1.0;
            let pharmaBonus = 0;

            if (dashStatus === 'HEALTHY') {
                score = 100;
                baseScale = 1.0;
                pharmaBonus = 0;
            } else if (dashStatus === 'PTSD') {
                score = 24;
                if (dashTreatmentClass === 'NOVEL') {
                    if (dashPharmaEfficacy <= 1) {
                        score += dashPharmaEfficacy * 76;
                        pharmaBonus = dashPharmaEfficacy * 0.8;
                    } else {
                        score = 100 - ((dashPharmaEfficacy - 1) * 60);
                        pharmaBonus = 0.8 - ((dashPharmaEfficacy - 1) * 0.4);
                    }
                    baseScale = 0.4;
                } else {
                    // Conventional (SSRI) - broad dampening, no real repair
                    if (dashPharmaEfficacy <= 1) {
                        score += dashPharmaEfficacy * 20; // Maxes at 44%
                        pharmaBonus = -(dashPharmaEfficacy * 0.2); // Shrinks further
                    } else {
                        score = 44 - ((dashPharmaEfficacy - 1) * 20);
                        pharmaBonus = -0.2 - ((dashPharmaEfficacy - 1) * 0.2);
                    }
                    baseScale = 0.4;
                }
            } else if (dashStatus === 'ADHD') {
                score = 45;
                if (dashTreatmentClass === 'NOVEL') {
                    if (dashPharmaEfficacy <= 1) {
                        score += dashPharmaEfficacy * 55;
                        pharmaBonus = dashPharmaEfficacy * 0.4;
                    } else {
                        score = 100 - ((dashPharmaEfficacy - 1) * 50);
                        pharmaBonus = 0.4 + ((dashPharmaEfficacy - 1) * 0.6); // over-stim
                    }
                    baseScale = 0.6;
                } else {
                    // Conventional (Amphetamine)
                    if (dashPharmaEfficacy <= 1) {
                        score += dashPharmaEfficacy * 45; // Maxes at 90%
                        pharmaBonus = dashPharmaEfficacy * 0.5;
                    } else {
                        score = 90 - ((dashPharmaEfficacy - 1) * 80); // Crashes hard
                        pharmaBonus = 0.5 + ((dashPharmaEfficacy - 1) * 1.5); // Severe over-stim
                    }
                    baseScale = 0.6;
                }
            } else if (dashStatus === 'TOURETTES') {
                score = 35;
                if (dashTreatmentClass === 'NOVEL') {
                    if (dashPharmaEfficacy <= 1) {
                        score += dashPharmaEfficacy * 65;
                        pharmaBonus = -(dashPharmaEfficacy * 0.6); // dampens
                    } else {
                        score = 100 - ((dashPharmaEfficacy - 1) * 40);
                        pharmaBonus = -0.6 - ((dashPharmaEfficacy - 1) * 0.4); // over-dampens
                    }
                    baseScale = 1.6; // hyper-connected base
                } else {
                    // Conventional (Haloperidol)
                    if (dashPharmaEfficacy <= 1) {
                        score += dashPharmaEfficacy * 30; // Maxes at 65%
                        pharmaBonus = -(dashPharmaEfficacy * 1.0); // Heavy dampening
                    } else {
                        score = 65 - ((dashPharmaEfficacy - 1) * 60);
                        pharmaBonus = -1.0 - ((dashPharmaEfficacy - 1) * 0.8); // Severe rigidity
                    }
                    baseScale = 1.6;
                }
            }
            
            const bar = document.getElementById('integrity-bar');
            const txt = document.getElementById('integrity-score');
            score = Math.max(0, Math.min(100, Math.round(score)));
            bar.style.width = score + '%';
            txt.innerText = score + '%';
            
            dashLobeGroup.children.forEach(node => {
                const cliqueParticipation = node.userData.cliques || 1;
                const targetScale = Math.max(0.1, baseScale + pharmaBonus + (cliqueParticipation * 0.05));
                node.userData.targetScale = targetScale;
            });

            if (score > 80) {
                bar.className = 'h-1.5 bg-emerald-500 transition-all duration-500';
                txt.className = 'text-emerald-400 font-mono';
            } else if (score > 50) {
                bar.className = 'h-1.5 bg-amber-500 transition-all duration-500';
                txt.className = 'text-amber-400 font-mono';
            } else {
                bar.className = 'h-1.5 bg-rose-500 transition-all duration-500';
                txt.className = 'text-rose-400 font-mono';
            }

            // Update Dynamic Explanation
            const explanationBox = document.getElementById('dosage-explanation');
            if (explanationBox) {
                let explanation = '';
                if (dashStatus === 'HEALTHY') {
                    explanation = 'The network is operating at baseline optimal synchronization. High-dimensional cliques are forming and dissolving rhythmically. No intervention required.';
                } else if (dashStatus === 'PTSD') {
                    if (dashTreatmentClass === 'NOVEL') {
                        if (dashPharmaEfficacy === 0) explanation = 'Negative State (PTSD Flash). Severe hyperarousal detected. Suggest dosing mild intensity ZB-01 for rapid stabilization, or waiting 12-24 hours to return to baseline naturally.';
                        else if (dashPharmaEfficacy < 1) explanation = 'Sub-therapeutic dosage. ZB-01 is beginning to physically widen Arnold Tongues, but topological repair is incomplete.';
                        else if (dashPharmaEfficacy === 1) explanation = 'Optimal dosage (mild intensity). Arnold Tongues are sufficiently widened, stabilizing the network and allowing 11D cliques to reassemble organically.';
                        else explanation = 'Toxicity (Hyper-synchrony). Excessive coupling has induced pathological rigidity, locking nodes and destroying functional wave dynamics.';
                    } else {
                        if (dashPharmaEfficacy === 0) explanation = 'Negative State (PTSD Flash). Severe hyperarousal detected. Suggest intervention or waiting 12-24 hours to return to baseline.';
                        else if (dashPharmaEfficacy < 1) explanation = 'Broad serotonin reuptake inhibition is dampening network amplitude globally, but failing to restore targeted high-D clique structures.';
                        else if (dashPharmaEfficacy === 1) explanation = 'Maximal SSRI effect. The network is suppressed (dull grey), masking arousal symptoms but leaving underlying topological damage unrepaired.';
                        else explanation = 'SSRI toxicity/Serotonin syndrome. Severe structural blunting and over-suppression.';
                    }
                } else if (dashStatus === 'ADHD') {
                    if (dashTreatmentClass === 'NOVEL') {
                        if (dashPharmaEfficacy === 0) explanation = 'Negative State (ADHD). Hypo-connectivity detected in prefrontal control networks. Suggest dosing mild intensity SS-20 to upregulate dynamics.';
                        else if (dashPharmaEfficacy < 1) explanation = 'Sub-therapeutic dosage. Dopaminergic stimulation is gradually upregulating network activity.';
                        else if (dashPharmaEfficacy === 1) explanation = 'Optimal dosage (mild intensity). Frontal networks are perfectly upregulated, matching healthy baseline wave dynamics without over-stimulation.';
                        else explanation = 'Over-stimulation. Excessive dopamine is causing chaotic, hyper-aroused jittering and signal breakdown.';
                    } else {
                        if (dashPharmaEfficacy === 0) explanation = 'Negative State (ADHD). Hypo-connectivity detected in prefrontal control networks.';
                        else if (dashPharmaEfficacy < 1) explanation = 'Amphetamine salts are aggressively upregulating network activity, accelerating rapidly towards toxicity.';
                        else if (dashPharmaEfficacy === 1) explanation = 'Peak therapeutic effect, but with a highly dangerous, narrow window before severe toxicity onset.';
                        else explanation = 'Amphetamine toxicity. Rapid onset of severe hyper-arousal, erratic jumping, and topological fragmentation.';
                    }
                } else if (dashStatus === 'TOURETTES') {
                    if (dashTreatmentClass === 'NOVEL') {
                        if (dashPharmaEfficacy === 0) explanation = 'Negative State (Tourette\'s). Pathological hyper-connectivity causing tics. Suggest dosing mild intensity DR-02 to dampen loops, or waiting out the tic cluster.';
                        else if (dashPharmaEfficacy < 1) explanation = 'Sub-therapeutic. Targeted D2 antagonism is beginning to soften erratic synchronization spikes.';
                        else if (dashPharmaEfficacy === 1) explanation = 'Optimal dosage (mild intensity). DR-02 has successfully dampened hyper-connectivity back to smooth baseline dynamics.';
                        else explanation = 'Over-dampening. Excessive D2 blockade is leading to network rigidity (Parkinsonian side-effects).';
                    } else {
                        if (dashPharmaEfficacy === 0) explanation = 'Negative State (Tourette\'s). Pathological hyper-connectivity causing sudden, rigid synchronization spikes (tics).';
                        else if (dashPharmaEfficacy < 1) explanation = 'Aggressive D2 antagonism is rapidly crashing network amplitude and freezing nodes.';
                        else if (dashPharmaEfficacy === 1) explanation = 'Tics suppressed, but at the cost of significant network rigidity and structural dampening.';
                        else explanation = 'Haloperidol toxicity. Severe Parkinsonian rigidity (Tardive Dyskinesia). The network is completely frozen.';
                    }
                }
                explanationBox.innerText = explanation;
            }
        };

        const animateDashboard = () => {
            requestAnimationFrame(animateDashboard);
            dashControls.update();
            const time = Date.now() * 0.001;

            // Rotate neural dust
            if (dashParticleSystem) {
                dashParticleSystem.rotation.y += 0.0005;
                dashParticleSystem.rotation.x += 0.0002;
            }

            dashRaycaster.setFromCamera(dashMouse, dashCamera);
            const intersects = dashRaycaster.intersectObjects(dashLobeGroup.children);
            const inspector = document.getElementById('node-inspector-overlay');
            
            if (intersects.length > 0) {
                dashHoveredNode = intersects[0].object;
                document.body.style.cursor = 'pointer';
            } else {
                dashHoveredNode = null;
                document.body.style.cursor = 'default';
            }
            
            if (dashSelectedNode) {
                updateNodeInspector(dashSelectedNode);
            }
            
            dashEdgeGroup.children.forEach(edge => {
                if (dashSelectedNode) {
                    const isConnected = edge.userData.source === dashSelectedNode.userData.id || edge.userData.target === dashSelectedNode.userData.id;
                    edge.material.opacity = isConnected ? 0.8 : 0.05;
                    if (isConnected) edge.material.color.setHex(0x38bdf8);
                    else edge.material.color.setHex(0x4c1d95);
                } else {
                    edge.material.opacity = 0.1;
                    edge.material.color.setHex(0x4c1d95);
                }
            });

            // Animate Signal Packets
            signalPackets.forEach(p => {
                p.t += p.speed;
                if (p.t > 1) p.t = 0;
                p.pos.lerpVectors(p.start, p.end, p.t);
            });

            // Drawing signal pulses (conceptual lines or points)
            // For performance and visual pop, we'll pulse the lobes that are targets of signal flow
            
            dashLobeGroup.children.forEach(node => {
                const dist = node.userData.origin.length();
                const wave = Math.sin(dist * 0.06 - time * 4);
                
                // Smoothed target scale from 11D integrity + pulse
                const targetBaseScale = node.userData.targetScale || 1.0;
                
                node.material.color.setHex(node.userData.baseColor);
                node.material.emissive.setHex(node.userData.baseColor);
                let emissiveInt = 0.4 + wave * 0.3;
                
                if (dashStatus === 'PTSD') {
                    if (dashTreatmentClass === 'NOVEL') {
                        if (dashPharmaEfficacy <= 1) {
                            const jitter = (1 - dashPharmaEfficacy) * 12;
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                            node.position.z = node.userData.origin.z + (Math.random() - 0.5) * jitter;
                            const ptsdScale = targetBaseScale + wave * 0.4;
                            node.scale.setScalar(Math.max(0.2, ptsdScale));
                            emissiveInt = 0.8 + (wave * 0.5) - (dashPharmaEfficacy * 0.4);
                        } else {
                            const overDose = dashPharmaEfficacy - 1;
                            const jitter = overDose * 6; 
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * jitter;
                            node.position.z = node.userData.origin.z + (Math.random() - 0.5) * jitter;
                            const rigidScale = targetBaseScale * (1 - (overDose * 0.5));
                            node.scale.setScalar(Math.max(0.1, rigidScale));
                            emissiveInt = 0.4 + (overDose * 2.0);
                        }
                    } else {
                        const jitter = (1 - Math.min(1, dashPharmaEfficacy)) * 12;
                        node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                        node.position.z = node.userData.origin.z + (Math.random() - 0.5) * jitter;
                        const ssriScale = targetBaseScale + (wave * 0.4 * (1 - Math.min(1, dashPharmaEfficacy)));
                        node.scale.setScalar(Math.max(0.1, ssriScale));
                        
                        if (dashPharmaEfficacy <= 1) {
                            emissiveInt = 0.8 - (dashPharmaEfficacy * 0.6);
                        } else {
                            emissiveInt = 0.1;
                        }
                    }
                } else if (dashStatus === 'ADHD') {
                    if (dashTreatmentClass === 'NOVEL') {
                        if (dashPharmaEfficacy <= 1) {
                            const adhdScale = targetBaseScale + wave * 0.3;
                            node.scale.setScalar(Math.max(0.2, adhdScale));
                            node.position.lerp(node.userData.origin, 0.1);
                            emissiveInt = 0.1 + (dashPharmaEfficacy * 0.5);
                        } else {
                            const overDose = dashPharmaEfficacy - 1;
                            const jitter = overDose * 15;
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * jitter;
                            const overScale = targetBaseScale + wave * 0.8;
                            node.scale.setScalar(Math.max(0.2, overScale));
                            emissiveInt = 0.6 + (overDose * 1.5);
                        }
                    } else {
                        if (dashPharmaEfficacy <= 1) {
                            const adhdScale = targetBaseScale + wave * 0.3;
                            node.scale.setScalar(Math.max(0.2, adhdScale));
                            node.position.lerp(node.userData.origin, 0.1);
                            emissiveInt = 0.1 + (dashPharmaEfficacy * 0.8);
                        } else {
                            const overDose = dashPharmaEfficacy - 1;
                            const jitter = overDose * 25; 
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * jitter;
                            const overScale = targetBaseScale + wave * 1.2;
                            node.scale.setScalar(Math.max(0.2, overScale));
                            emissiveInt = 0.9 + (overDose * 2.0);
                        }
                    }
                } else if (dashStatus === 'TOURETTES') {
                    if (dashTreatmentClass === 'NOVEL') {
                        if (dashPharmaEfficacy <= 1) {
                            const tickJitter = (1 - dashPharmaEfficacy) * 8 * (Math.random() > 0.8 ? 1 : 0); 
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * tickJitter;
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * tickJitter;
                            const touretteScale = targetBaseScale + wave * 0.8;
                            node.scale.setScalar(Math.max(0.2, touretteScale));
                            emissiveInt = 0.8 - (dashPharmaEfficacy * 0.4);
                        } else {
                            const overDose = dashPharmaEfficacy - 1;
                            node.position.lerp(node.userData.origin, 0.2); 
                            const rigidScale = targetBaseScale * (1 - (overDose * 0.6));
                            node.scale.setScalar(Math.max(0.1, rigidScale));
                            emissiveInt = 0.4 - (overDose * 0.3);
                        }
                    } else {
                        if (dashPharmaEfficacy <= 1) {
                            const tickJitter = (1 - dashPharmaEfficacy) * 8 * (Math.random() > 0.8 ? 1 : 0);
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * tickJitter;
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * tickJitter;
                            const rigidScale = targetBaseScale * (1 - (dashPharmaEfficacy * 0.8)); 
                            node.scale.setScalar(Math.max(0.1, rigidScale));
                            emissiveInt = 0.8 - (dashPharmaEfficacy * 0.7);
                        } else {
                            node.position.lerp(node.userData.origin, 0.8); 
                            const overDose = dashPharmaEfficacy - 1;
                            const rigidScale = targetBaseScale * (1 - (overDose * 0.9));
                            node.scale.setScalar(Math.max(0.05, rigidScale));
                            emissiveInt = 0.1;
                        }
                    }
                } else {
                    const healthyScale = targetBaseScale + wave * 0.6;
                    node.scale.setScalar(healthyScale);
                    node.position.lerp(node.userData.origin, 0.1);
                }
                
                node.material.emissiveIntensity = emissiveInt;
                
                if (node === dashHoveredNode) {
                    node.material.emissive.setHex(0xffffff);
                    node.material.emissiveIntensity = 2.0;
                } else {
                    node.material.emissive.copy(node.material.color);
                }
            });

            dashRenderer.render(dashScene, dashCamera);
        };

        // --- 4. Simulated Extraction Dashboard Logic ---
        const terminalOutput = document.getElementById('terminalOutput');
        const runBtn = document.getElementById('runInferenceBtn');
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');
        const scanUpload = document.getElementById('scanUpload');
        const fileMeta = document.getElementById('fileMeta');
        const fingerprintStatus = document.getElementById('fingerprintStatus');
        const vectorSize = document.getElementById('vectorSize');
        const apiStatus = document.getElementById('apiStatus');
        const API_URL = 'https://babel-forge-api-1066096962926.us-central1.run.app/diagnose';
        const FINGERPRINT_LENGTH = 6400;
        const API_TIMEOUT_MS = 15000;
        const MAX_TERMINAL_RESPONSE_LENGTH = 3000;
        const MULBERRY32_STEP = 0x6D2B79F5;
        const HASH_INITIAL_SEED = 2166136261;
        const SPECTRAL_BIN_COUNT = 32;
        const BASE_FEATURE_INTENSITY = 0.025;
        const REGION_WAVE_AMPLITUDE = 0.018;
        const SPECTRAL_NOISE_AMPLITUDE = 0.012;
        const HIGH_FREQUENCY_BIN_THRESHOLD = 24;
        const HIGH_FREQUENCY_LIFT = 0.01;
        const HTML_ESCAPE_ENTITIES = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        const TERMINAL_COLOR_CLASSES = new Set([
            'text-[color:var(--text-0)]',
            'text-[color:var(--text-1)]',
            'text-[color:var(--text-2)]',
            'text-plum-300',
            'text-plum-400',
            'text-emerald-300',
            'text-rose-300',
            'text-rose-400',
            'text-amber-300'
        ]);

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const formatBytes = (bytes) => {
            if (bytes < 0) return 'Invalid size';
            if (bytes === 0) return '0 B';
            const units = ['B', 'KB', 'MB', 'GB'];
            const sizeIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
            return `${(bytes / Math.pow(1024, sizeIndex)).toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
        };
        const sanitizeTerminalText = (value) => String(value).replace(/[&<>"']/g, character => HTML_ESCAPE_ENTITIES[character]);

        const appendTerminalLine = (message = '', colorClass = 'text-[color:var(--text-1)]') => {
            const line = document.createElement('div');
            line.className = TERMINAL_COLOR_CLASSES.has(colorClass) ? colorClass : 'text-[color:var(--text-1)]';
            line.textContent = sanitizeTerminalText(message);
            terminalOutput.appendChild(line);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        };

        const setRunButtonState = (enabled, label) => {
            runBtn.disabled = !enabled;
            btnText.innerText = label;
            if (enabled) {
                runBtn.style.background = '#4f46e5';
                runBtn.style.color = '#ffffff';
                runBtn.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.2)';
                runBtn.style.border = 'none';
                runBtn.style.cursor = 'pointer';
            } else {
                runBtn.style.background = '#f1f5f9';
                runBtn.style.color = '#94a3b8';
                runBtn.style.boxShadow = 'none';
                runBtn.style.border = '1px solid #e2e8f0';
                runBtn.style.cursor = 'not-allowed';
            }
        };

        const isValidScanName = (fileName) => /\.nii(\.gz)?$/i.test(fileName);
        const getApiErrorMessage = (error) => {
            if (error.name === 'AbortError') {
                return `Request timed out after ${API_TIMEOUT_MS / 1000} seconds. The diagnosis service may be starting up or temporarily unavailable.`;
            }
            if (error.name === 'TypeError') {
                return 'Network request failed. Check connectivity, CORS settings, or service availability.';
            }
            return error.message || 'Unexpected API error.';
        };

        const createHashSeed = (seedSource) => {
            return Array.from(seedSource).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) >>> 0, HASH_INITIAL_SEED);
        };

        const createSeededRandom = (seed) => {
            let state = seed >>> 0;
            return () => {
                // Compact deterministic PRNG based on a Mulberry32-style state update for well-distributed 32-bit output.
                state += MULBERRY32_STEP;
                let value = state;
                value = Math.imul(value ^ (value >>> 15), value | 1);
                value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
                return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
            };
        };

        const createMockFingerprint = (file) => {
            const seedSource = `${file.name}:${file.size}:${file.lastModified}`;
            // Lightweight hybrid rolling hash uses the FNV-1a offset basis as a stable unsigned initial seed.
            const seed = createHashSeed(seedSource);
            const random = createSeededRandom(seed);
            return Array.from({ length: FINGERPRINT_LENGTH }, (_, index) => {
                const regionWave = Math.sin(index / SPECTRAL_BIN_COUNT) * REGION_WAVE_AMPLITUDE;
                const spectralNoise = (random() - 0.5) * SPECTRAL_NOISE_AMPLITUDE;
                const highFrequencyLift = index % SPECTRAL_BIN_COUNT > HIGH_FREQUENCY_BIN_THRESHOLD ? HIGH_FREQUENCY_LIFT : 0;
                return Number((BASE_FEATURE_INTENSITY + regionWave + spectralNoise + highFrequencyLift).toFixed(6));
            });
        };

        scanUpload.addEventListener('change', () => {
            const file = scanUpload.files[0];
            fingerprintStatus.textContent = 'Pending';
            vectorSize.textContent = '0 / 6400';
            apiStatus.textContent = 'Idle';
            terminalOutput.textContent = 'Waiting for .nii.gz upload...';

            if (!file) {
                fileMeta.textContent = 'No scan selected.';
                setRunButtonState(false, 'UPLOAD A SCAN TO BEGIN');
                return;
            }

            fileMeta.textContent = `Selected: ${file.name} (${formatBytes(file.size)})`;
            if (!isValidScanName(file.name)) {
                appendTerminalLine(`Unsupported file extension: ${file.name}`, 'text-rose-400');
                appendTerminalLine('Please choose a .nii or .nii.gz scan.', 'text-[color:var(--text-2)]');
                setRunButtonState(false, 'INVALID FILE TYPE');
                return;
            }

            appendTerminalLine(`Loaded local scan metadata for ${file.name}`, 'text-emerald-300');
            appendTerminalLine('Ready to simulate preprocessing and API inference.', 'text-[color:var(--text-2)]');
            setRunButtonState(true, 'RUN SIMULATED EXTRACTION');
        });

        const runInference = async () => {
            const file = scanUpload.files[0];
            if (!file || !isValidScanName(file.name)) return;
            const patientId = file.name.replace(/\.nii(\.gz)?$/i, '') || 'uploaded-scan';
            
            setRunButtonState(false, 'PROCESSING...');
            btnLoader.classList.remove('hidden');
            fingerprintStatus.textContent = 'Generating';
            vectorSize.textContent = '0 / 6400';
            apiStatus.textContent = 'Idle';
            terminalOutput.textContent = '';
            
            appendTerminalLine(`Initialize simulated fMRI pipeline for ${file.name}...`, 'text-plum-300');
            
            await sleep(600);
            appendTerminalLine('Validating NIfTI header and affine matrix... [SIMULATED OK]', 'text-[color:var(--text-2)]');
            
            await sleep(500);
            appendTerminalLine('Skull stripping with BET-style brain mask... [SIMULATED OK]', 'text-[color:var(--text-2)]');
            
            await sleep(700);
            appendTerminalLine('Registering subject volume to MNI152 template... [SIMULATED OK]', 'text-[color:var(--text-2)]');
            
            await sleep(800);
            appendTerminalLine('Applying Schaefer 200-node atlas parcellation... [SIMULATED OK]', 'text-[color:var(--text-2)]');
            
            await sleep(700);
            appendTerminalLine('Computing 32-bin Fourier spectrum per region...', 'text-[color:var(--text-2)]');
            const fingerprint = createMockFingerprint(file);
            fingerprintStatus.textContent = 'Ready';
            vectorSize.textContent = `${fingerprint.length} / 6400`;
            appendTerminalLine(`Generated mock fingerprint: ${fingerprint.length} float features`, 'text-emerald-300');
            appendTerminalLine(`Preview: [${fingerprint.slice(0, 6).join(', ')}, ...]`, 'text-[color:var(--text-2)]');
            
            await sleep(500);
            apiStatus.textContent = 'Calling API';
            appendTerminalLine('');
            appendTerminalLine('POST /diagnose -> live babelForge API', 'text-plum-300');

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patient_id: patientId, fingerprint }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`Server error: API returned HTTP ${response.status}`);
                }

                const result = await response.json();
                const clinicalStatus = result.clinical_status || result.status || result.prediction || 'UNKNOWN';
                const confidence = result.confidence_percent ?? result.confidence ?? 'n/a';
                const normalizedStatus = String(clinicalStatus).toLowerCase();
                const statusClass = normalizedStatus.includes('resistant')
                    ? 'text-rose-400'
                    : normalizedStatus.includes('responsive')
                        ? 'text-emerald-300'
                        : 'text-[color:var(--text-2)]';
                apiStatus.textContent = 'Complete';

                appendTerminalLine('============================================================', 'text-[color:var(--text-2)]');
                appendTerminalLine('LIVE API DIAGNOSIS COMPLETE', 'text-emerald-300');
                appendTerminalLine('------------------------------------------------------------', 'text-[color:var(--text-2)]');
                appendTerminalLine(`patient_id: ${result.patient_id || patientId}`, 'text-[color:var(--text-1)]');
                appendTerminalLine(`clinical_status: ${clinicalStatus}`, statusClass);
                appendTerminalLine(`confidence: ${confidence}${typeof confidence === 'number' ? '%' : ''}`, 'text-[color:var(--text-1)]');
                appendTerminalLine('raw_response:', 'text-[color:var(--text-2)]');
                const rawResponse = JSON.stringify(result, null, 2);
                const displayResponse = rawResponse.length > MAX_TERMINAL_RESPONSE_LENGTH
                    ? `${rawResponse.slice(0, MAX_TERMINAL_RESPONSE_LENGTH)}\n... truncated for display ...`
                    : rawResponse;
                // Each indented JSON line is escaped by appendTerminalLine before it is added to the terminal.
                displayResponse.split('\n')
                    .forEach(line => appendTerminalLine(`  ${line}`, 'text-[color:var(--text-2)]'));
                appendTerminalLine('============================================================', 'text-[color:var(--text-2)]');
            } catch (error) {
                apiStatus.textContent = 'API Error';
                appendTerminalLine('============================================================', 'text-[color:var(--text-2)]');
                appendTerminalLine('LIVE API REQUEST FAILED', 'text-rose-400');
                appendTerminalLine('------------------------------------------------------------', 'text-[color:var(--text-2)]');
                appendTerminalLine(getApiErrorMessage(error), 'text-rose-300');
                appendTerminalLine('The simulated 6,400-feature extraction completed, but the browser could not reach the diagnosis service.', 'text-[color:var(--text-2)]');
                appendTerminalLine('============================================================', 'text-[color:var(--text-2)]');
            }
            
            setRunButtonState(true, 'RUN SIMULATED EXTRACTION');
            btnLoader.classList.add('hidden');
        };

        runBtn.addEventListener('click', runInference);

        // --- Initialization ---
        window.addEventListener('DOMContentLoaded', () => {
            initSciencePaperCharts();
            initCohortChart();
            initMetricsChart();
            initDashboardBrain();
        });

    