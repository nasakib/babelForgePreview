import re

with open('stack-simulator.html', 'r') as f:
    content = f.read()

# 1. Update max stack limit
content = content.replace('0/5', '0/10')
content = content.replace('currentStack.length >= 5', 'currentStack.length >= 10')
content = content.replace('Maximum stack size (5)', 'Maximum stack size (10)')

# 2. Inject search bar
search_html = """                <div class="space-y-4">
                    <div>
                        <label class="text-[10px] uppercase font-bold text-slate-400 block mb-2 tracking-widest">Search</label>
                        <input type="text" id="mol-search" onkeyup="populateMolecules()" placeholder="Type to search..." class="w-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500">
                    </div>"""
content = content.replace('                <div class="space-y-4">', search_html)

# 3. Inject JS logic for search in populateMolecules
populate_js_new = """        function populateMolecules() {
            const classFilter = document.getElementById('class-select').value;
            const searchQuery = (document.getElementById('mol-search').value || '').toLowerCase();
            const select = document.getElementById('mol-select');
            select.innerHTML = '';
            
            const filtered = molecules.filter(m => {
                const matchClass = classFilter === 'all' || m.class === classFilter;
                const matchSearch = m.name.toLowerCase().includes(searchQuery) || m.classLabel.toLowerCase().includes(searchQuery);
                return matchClass && matchSearch;
            });
                
            filtered.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.name;
                select.appendChild(opt);
            });
        }"""
        
# We need to find the existing populateMolecules and replace it.
content = re.sub(r'        function populateMolecules\(\) \{.*?\n        \}', populate_js_new, content, flags=re.DOTALL)


# 4. Generate a massive array of molecules with precise SVGs and realistic interaction parameters
molecules_array = """        const molecules = [
            // Novel Therapeutics
            { id: 'zb01', name: 'ZenBud™ (ZB-01)', class: 'novel', classLabel: 'Precision Agonist', svg: svgIndole, minDose: 0, maxDose: 100, optimalDose: 50, effects: { arousal: 0.1, dampening: 0.0, chaos: -0.8, repair: 1.5 } },
            { id: 'ss20', name: 'SynaptoStim (SS-20)', class: 'novel', classLabel: 'Precision Stimulant', svg: svgPhen, minDose: 0, maxDose: 60, optimalDose: 30, effects: { arousal: 0.8, dampening: -0.2, chaos: -0.2, repair: 0.8 } },
            { id: 'dr02', name: 'DopaReg-D2 (DR-02)', class: 'novel', classLabel: 'Precision Antagonist', svg: svgTricyclic, minDose: 0, maxDose: 10, optimalDose: 5, effects: { arousal: -0.5, dampening: 0.6, chaos: -0.5, repair: 0.6 } },
            { id: 'psilo', name: 'Psilocybin', class: 'novel', classLabel: 'Classic Psychedelic', svg: svgIndole, minDose: 0, maxDose: 30, optimalDose: 15, effects: { arousal: 0.8, dampening: -0.2, chaos: 1.2, repair: 0.5 } },
            { id: 'mdma', name: 'MDMA', class: 'novel', classLabel: 'Empathogen', svg: svgPhen, minDose: 0, maxDose: 150, optimalDose: 80, effects: { arousal: 1.2, dampening: -0.3, chaos: 0.4, repair: 0.7 } },
            { id: 'ketamine', name: 'Ketamine', class: 'novel', classLabel: 'Dissociative', svg: svgTricyclic, minDose: 0, maxDose: 100, optimalDose: 50, effects: { arousal: -0.2, dampening: 0.5, chaos: 1.0, repair: 0.9 } },
            
            // SSRIs & SNRIs
            { id: 'sert', name: 'Sertraline', class: 'ssri', classLabel: 'SSRI', svg: svgTricyclic, minDose: 0, maxDose: 200, optimalDose: 100, effects: { arousal: -0.2, dampening: 0.8, chaos: -0.1, repair: 0.0 } },
            { id: 'fluox', name: 'Fluoxetine', class: 'ssri', classLabel: 'SSRI', svg: svgTricyclic, minDose: 0, maxDose: 80, optimalDose: 40, effects: { arousal: -0.1, dampening: 0.7, chaos: 0.0, repair: 0.0 } },
            { id: 'escit', name: 'Escitalopram', class: 'ssri', classLabel: 'SSRI', svg: svgTricyclic, minDose: 0, maxDose: 40, optimalDose: 20, effects: { arousal: -0.3, dampening: 0.9, chaos: -0.2, repair: 0.0 } },
            { id: 'venla', name: 'Venlafaxine', class: 'ssri', classLabel: 'SNRI', svg: svgTricyclic, minDose: 0, maxDose: 225, optimalDose: 75, effects: { arousal: 0.1, dampening: 0.6, chaos: 0.0, repair: 0.0 } },
            { id: 'dulox', name: 'Duloxetine', class: 'ssri', classLabel: 'SNRI', svg: svgTricyclic, minDose: 0, maxDose: 120, optimalDose: 60, effects: { arousal: 0.2, dampening: 0.5, chaos: 0.1, repair: 0.0 } },
            { id: 'citalo', name: 'Citalopram', class: 'ssri', classLabel: 'SSRI', svg: svgTricyclic, minDose: 0, maxDose: 40, optimalDose: 20, effects: { arousal: -0.2, dampening: 0.8, chaos: -0.1, repair: 0.0 } },
            { id: 'parox', name: 'Paroxetine', class: 'ssri', classLabel: 'SSRI', svg: svgTricyclic, minDose: 0, maxDose: 60, optimalDose: 20, effects: { arousal: -0.4, dampening: 1.0, chaos: -0.2, repair: 0.0 } },
            
            // Stimulants
            { id: 'amph', name: 'Amphetamine Salts', class: 'stimulant', classLabel: 'Stimulant', svg: svgPhen, minDose: 0, maxDose: 60, optimalDose: 20, effects: { arousal: 1.5, dampening: -0.5, chaos: 0.8, repair: -0.2 } },
            { id: 'mph', name: 'Methylphenidate', class: 'stimulant', classLabel: 'Stimulant', svg: svgPhen, minDose: 0, maxDose: 72, optimalDose: 36, effects: { arousal: 1.2, dampening: -0.3, chaos: 0.5, repair: -0.1 } },
            { id: 'lisdexamph', name: 'Lisdexamfetamine', class: 'stimulant', classLabel: 'Stimulant', svg: svgPhen, minDose: 0, maxDose: 70, optimalDose: 30, effects: { arousal: 1.3, dampening: -0.4, chaos: 0.6, repair: -0.1 } },
            { id: 'dexmph', name: 'Dexmethylphenidate', class: 'stimulant', classLabel: 'Stimulant', svg: svgPhen, minDose: 0, maxDose: 40, optimalDose: 15, effects: { arousal: 1.1, dampening: -0.2, chaos: 0.4, repair: 0.0 } },
            { id: 'modaf', name: 'Modafinil', class: 'stimulant', classLabel: 'Eugeroic', svg: svgPhen, minDose: 0, maxDose: 400, optimalDose: 200, effects: { arousal: 0.8, dampening: 0.0, chaos: 0.1, repair: 0.1 } },
            
            // Antipsychotics
            { id: 'halo', name: 'Haloperidol', class: 'antipsychotic', classLabel: 'Typical Antipsychotic', svg: svgTricyclic, minDose: 0, maxDose: 10, optimalDose: 2, effects: { arousal: -1.0, dampening: 1.8, chaos: -0.5, repair: -0.5 } },
            { id: 'queti', name: 'Quetiapine', class: 'antipsychotic', classLabel: 'Atypical Antipsychotic', svg: svgTricyclic, minDose: 0, maxDose: 800, optimalDose: 300, effects: { arousal: -0.8, dampening: 1.5, chaos: -0.3, repair: -0.2 } },
            { id: 'arip', name: 'Aripiprazole', class: 'antipsychotic', classLabel: 'Atypical Antipsychotic', svg: svgTricyclic, minDose: 0, maxDose: 30, optimalDose: 10, effects: { arousal: -0.4, dampening: 1.2, chaos: -0.2, repair: 0.0 } },
            { id: 'risper', name: 'Risperidone', class: 'antipsychotic', classLabel: 'Atypical Antipsychotic', svg: svgTricyclic, minDose: 0, maxDose: 8, optimalDose: 2, effects: { arousal: -0.6, dampening: 1.4, chaos: -0.3, repair: -0.1 } },
            { id: 'olan', name: 'Olanzapine', class: 'antipsychotic', classLabel: 'Atypical Antipsychotic', svg: svgTricyclic, minDose: 0, maxDose: 20, optimalDose: 10, effects: { arousal: -0.7, dampening: 1.6, chaos: -0.4, repair: -0.1 } },
            { id: 'cloz', name: 'Clozapine', class: 'antipsychotic', classLabel: 'Atypical Antipsychotic', svg: svgTricyclic, minDose: 0, maxDose: 900, optimalDose: 300, effects: { arousal: -0.9, dampening: 1.7, chaos: -0.6, repair: -0.3 } },
            
            // Cannabinoids
            { id: 'thc', name: 'Delta-9-THC', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, minDose: 0, maxDose: 100, optimalDose: 10, effects: { arousal: 0.2, dampening: 0.5, chaos: 0.6, repair: -0.1 } },
            { id: 'cbd', name: 'Cannabidiol (CBD)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, minDose: 0, maxDose: 1500, optimalDose: 300, effects: { arousal: -0.2, dampening: 0.6, chaos: -0.4, repair: 0.1 } },
            { id: 'delta8', name: 'Delta-8-THC', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, minDose: 0, maxDose: 100, optimalDose: 25, effects: { arousal: 0.1, dampening: 0.7, chaos: 0.3, repair: 0.0 } },
            { id: 'hhc', name: 'HHC (Hexahydrocannabinol)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, minDose: 0, maxDose: 100, optimalDose: 20, effects: { arousal: 0.15, dampening: 0.6, chaos: 0.4, repair: -0.05 } },
            { id: 'cbga', name: 'CBGA (Cannabigerolic acid)', class: 'cannabinoid', classLabel: 'Cannabinoid Precursor', svg: svgCannabinoid, minDose: 0, maxDose: 1000, optimalDose: 150, effects: { arousal: 0.0, dampening: 0.3, chaos: -0.1, repair: 0.2 } },
            { id: 'cbn', name: 'Cannabinol (CBN)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, minDose: 0, maxDose: 50, optimalDose: 10, effects: { arousal: -0.4, dampening: 0.9, chaos: -0.1, repair: 0.0 } },
            { id: 'cbg', name: 'Cannabigerol (CBG)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, minDose: 0, maxDose: 150, optimalDose: 25, effects: { arousal: 0.1, dampening: 0.4, chaos: -0.2, repair: 0.3 } },
            { id: 'thcv', name: 'Tetrahydrocannabivarin (THCV)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, minDose: 0, maxDose: 50, optimalDose: 10, effects: { arousal: 0.5, dampening: 0.1, chaos: 0.1, repair: 0.0 } },
            { id: 'cbdv', name: 'Cannabidivarin (CBDV)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, minDose: 0, maxDose: 800, optimalDose: 100, effects: { arousal: -0.1, dampening: 0.4, chaos: -0.3, repair: 0.2 } },
            
            // Depressants / Benzos / Gabapentinoids
            { id: 'alpraz', name: 'Alprazolam', class: 'depressant', classLabel: 'Benzodiazepine', svg: svgTricyclic, minDose: 0, maxDose: 4, optimalDose: 1, effects: { arousal: -1.2, dampening: 1.4, chaos: -0.6, repair: -0.3 } },
            { id: 'clonaz', name: 'Clonazepam', class: 'depressant', classLabel: 'Benzodiazepine', svg: svgTricyclic, minDose: 0, maxDose: 4, optimalDose: 1, effects: { arousal: -1.0, dampening: 1.3, chaos: -0.5, repair: -0.2 } },
            { id: 'diaz', name: 'Diazepam', class: 'depressant', classLabel: 'Benzodiazepine', svg: svgTricyclic, minDose: 0, maxDose: 40, optimalDose: 10, effects: { arousal: -0.9, dampening: 1.2, chaos: -0.4, repair: -0.1 } },
            { id: 'loraz', name: 'Lorazepam', class: 'depressant', classLabel: 'Benzodiazepine', svg: svgTricyclic, minDose: 0, maxDose: 6, optimalDose: 2, effects: { arousal: -1.1, dampening: 1.3, chaos: -0.5, repair: -0.2 } },
            { id: 'pregab', name: 'Pregabalin', class: 'depressant', classLabel: 'Gabapentinoid', svg: svgPhen, minDose: 0, maxDose: 600, optimalDose: 150, effects: { arousal: -0.6, dampening: 0.9, chaos: -0.3, repair: 0.1 } },
            { id: 'gaba', name: 'Gabapentin', class: 'depressant', classLabel: 'Gabapentinoid', svg: svgPhen, minDose: 0, maxDose: 3600, optimalDose: 900, effects: { arousal: -0.5, dampening: 0.8, chaos: -0.2, repair: 0.0 } },
            { id: 'zolp', name: 'Zolpidem', class: 'depressant', classLabel: 'Z-Drug', svg: svgTricyclic, minDose: 0, maxDose: 20, optimalDose: 10, effects: { arousal: -1.5, dampening: 1.6, chaos: 0.2, repair: -0.4 } },
            
            // Acetylcholine & Other
            { id: 'donepezil', name: 'Donepezil', class: 'stimulant', classLabel: 'AChEI', svg: svgTricyclic, minDose: 0, maxDose: 23, optimalDose: 10, effects: { arousal: 0.4, dampening: 0.0, chaos: -0.1, repair: 0.2 } },
            { id: 'memantine', name: 'Memantine', class: 'depressant', classLabel: 'NMDA Antagonist', svg: svgTricyclic, minDose: 0, maxDose: 28, optimalDose: 10, effects: { arousal: -0.1, dampening: 0.3, chaos: -0.2, repair: 0.3 } },
            { id: 'bupropion', name: 'Bupropion', class: 'stimulant', classLabel: 'NDRI', svg: svgPhen, minDose: 0, maxDose: 450, optimalDose: 300, effects: { arousal: 0.9, dampening: -0.1, chaos: 0.2, repair: 0.1 } }
        ];"""

content = re.sub(r'        const molecules = \[.*?\];', molecules_array, content, flags=re.DOTALL)

with open('stack-simulator.html', 'w') as f:
    f.write(content)

print("Finished patching stack-simulator.html")
