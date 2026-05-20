// Shared Molecular Database
const svgIndole = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class="w-full h-full"><path d="M30 70 L30 40 L55 25 L80 40 L80 70 L55 85 Z"/><path d="M30 40 L10 25 L10 50 Z"/><circle cx="55" cy="55" r="10"/></svg>`;
const svgPhen = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class="w-full h-full"><path d="M20 50 L40 20 L70 20 L90 50 L70 80 L40 80 Z"/><line x1="20" y1="50" x2="5" y2="50"/><line x1="40" y1="80" x2="30" y2="95"/></svg>`;
const svgTricyclic = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class="w-full h-full"><path d="M10 50 L30 20 L60 20 L80 50 L60 80 L30 80 Z"/><path d="M60 20 L80 10 L100 30 L80 50"/><circle cx="45" cy="50" r="12"/></svg>`;
const svgCannabinoid = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class="w-full h-full"><polygon points="30,35 40,20 55,20 65,35 55,50 40,50" /><polygon points="65,35 75,20 90,20 100,35 90,50 75,50" /><path d="M55,20 L75,20" /><path d="M20,25 L30,35 L20,45" /><circle cx="65" cy="35" r="5" /></svg>`;

export const molecules = [
    // Novel Therapeutics
    { id: 'zb01', name: 'ZenBud™ (ZB-01)', class: 'novel', classLabel: 'Precision Agonist', isBabelForge: true, svg: svgIndole, halfLife: 'medium', effects: { arousal: 0.1, dampening: 0.0, chaos: -0.8, repair: 1.5 } },
    { id: 'll07', name: 'LimbicLink™ (LL-07)', class: 'novel', classLabel: 'DMN Modulator', isBabelForge: true, svg: svgTricyclic, halfLife: 'long', effects: { arousal: -0.2, dampening: 0.3, chaos: 0.4, repair: 1.2 } },
    { id: 'ss20', name: 'SynaptoStim™ (SS-20)', class: 'novel', classLabel: 'Targeted DRI', isBabelForge: true, svg: svgPhen, halfLife: 'short', effects: { arousal: 1.5, dampening: 0.0, chaos: -0.2, repair: 0.5 } },
    { id: 'dr02', name: 'DopaReg™ (DR-02)', class: 'novel', classLabel: 'Precision Antagonist', isBabelForge: true, svg: svgPhen, halfLife: 'medium', effects: { arousal: -0.5, dampening: 1.2, chaos: -0.4, repair: 0.2 } },
    { id: 'nx44', name: 'NeuroX™ (NX-44)', class: 'novel', classLabel: 'BDNF Enhancer', isBabelForge: true, svg: svgIndole, halfLife: 'long', effects: { arousal: 0.2, dampening: 0.1, chaos: -0.5, repair: 2.5 } },
    { id: 'psilo', name: 'Psilocybin', class: 'novel', classLabel: 'Classic Psychedelic', isBabelForge: true, svg: svgIndole, halfLife: 'medium', effects: { arousal: 0.8, dampening: -0.2, chaos: 1.2, repair: 0.5 } },
    { id: 'mdma', name: 'MDMA', class: 'novel', classLabel: 'Empathogen', isBabelForge: true, svg: svgPhen, halfLife: 'medium', effects: { arousal: 1.2, dampening: -0.3, chaos: 0.4, repair: 0.7 } },
    { id: 'ketamine', name: 'Ketamine', class: 'novel', classLabel: 'Dissociative', isBabelForge: true, svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.2, dampening: 0.5, chaos: 1.0, repair: 0.9 } },
    { id: 'lsd', name: 'LSD', class: 'novel', classLabel: 'Classic Psychedelic', isBabelForge: true, svg: svgIndole, halfLife: 'medium', effects: { arousal: 0.7, dampening: -0.1, chaos: 1.4, repair: 0.4 } },
    
    // SSRIs, SNRIs & Antidepressants
    { id: 'sert', name: 'Sertraline', class: 'ssri', classLabel: 'SSRI', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.2, dampening: 0.8, chaos: -0.1, repair: 0.0 } },
    { id: 'fluox', name: 'Fluoxetine', class: 'ssri', classLabel: 'SSRI', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.1, dampening: 0.7, chaos: 0.0, repair: 0.0 } },
    { id: 'escit', name: 'Escitalopram', class: 'ssri', classLabel: 'SSRI', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.3, dampening: 0.9, chaos: -0.2, repair: 0.0 } },
    { id: 'venla', name: 'Venlafaxine', class: 'ssri', classLabel: 'SNRI', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: 0.1, dampening: 0.6, chaos: 0.0, repair: 0.0 } },
    { id: 'dulox', name: 'Duloxetine', class: 'ssri', classLabel: 'SNRI', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: 0.2, dampening: 0.5, chaos: 0.1, repair: 0.0 } },
    { id: 'citalo', name: 'Citalopram', class: 'ssri', classLabel: 'SSRI', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.2, dampening: 0.8, chaos: -0.1, repair: 0.0 } },
    { id: 'parox', name: 'Paroxetine', class: 'ssri', classLabel: 'SSRI', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.4, dampening: 1.0, chaos: -0.2, repair: 0.0 } },
    { id: 'fluvox', name: 'Fluvoxamine', class: 'ssri', classLabel: 'SSRI', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.5, dampening: 1.1, chaos: -0.1, repair: 0.0 } },
    { id: 'bupropion', name: 'Bupropion', class: 'stimulant', classLabel: 'NDRI', svg: svgPhen, halfLife: 'medium', effects: { arousal: 0.9, dampening: -0.1, chaos: 0.2, repair: 0.1 } },
    { id: 'mirtaz', name: 'Mirtazapine', class: 'ssri', classLabel: 'TeCA / NaSSA', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.8, dampening: 1.2, chaos: -0.1, repair: 0.1 } },
    { id: 'traz', name: 'Trazodone', class: 'ssri', classLabel: 'SARI', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -1.0, dampening: 1.4, chaos: 0.1, repair: 0.0 } },
    
    // Stimulants & Wakefulness
    { id: 'amph', name: 'Amphetamine Salts', class: 'stimulant', classLabel: 'Stimulant', svg: svgPhen, halfLife: 'medium', addictionPotential: 0.7, effects: { arousal: 1.5, dampening: -0.5, chaos: 0.8, repair: -0.2 } },
    { id: 'mph', name: 'Methylphenidate', class: 'stimulant', classLabel: 'Stimulant', svg: svgPhen, halfLife: 'medium', addictionPotential: 0.4, effects: { arousal: 1.2, dampening: -0.3, chaos: 0.5, repair: -0.1 } },
    { id: 'lisdexamph', name: 'Lisdexamfetamine', class: 'stimulant', classLabel: 'Stimulant', svg: svgPhen, halfLife: 'medium', addictionPotential: 0.6, effects: { arousal: 1.3, dampening: -0.4, chaos: 0.6, repair: -0.1 } },
    { id: 'dexmph', name: 'Dexmethylphenidate', class: 'stimulant', classLabel: 'Stimulant', svg: svgPhen, halfLife: 'medium', addictionPotential: 0.4, effects: { arousal: 1.1, dampening: -0.2, chaos: 0.4, repair: 0.0 } },
    { id: 'modaf', name: 'Modafinil', class: 'stimulant', classLabel: 'Eugeroic', svg: svgPhen, halfLife: 'medium', addictionPotential: 0.1, effects: { arousal: 0.8, dampening: 0.0, chaos: 0.1, repair: 0.1 } },
    { id: 'armodaf', name: 'Armodafinil', class: 'stimulant', classLabel: 'Eugeroic', svg: svgPhen, halfLife: 'medium', addictionPotential: 0.1, effects: { arousal: 0.9, dampening: 0.0, chaos: 0.1, repair: 0.1 } },
    { id: 'caffeine', name: 'Caffeine', class: 'stimulant', classLabel: 'Xanthine', svg: svgPhen, halfLife: 'medium', effects: { arousal: 0.6, dampening: 0.0, chaos: 0.3, repair: 0.0 } },
    { id: 'nicotine', name: 'Nicotine', class: 'stimulant', classLabel: 'Alkaloid Stimulant', svg: svgPhen, halfLife: 'medium', addictionPotential: 0.9, effects: { arousal: 0.5, dampening: 0.1, chaos: 0.2, repair: 0.0 } },
    { id: 'meth', name: 'Methamphetamine', class: 'stimulant', classLabel: 'Potent Releaser', svg: svgPhen, halfLife: 'long', addictionPotential: 0.9, effects: { arousal: 2.8, dampening: -1.2, chaos: 2.5, repair: -1.0 } },
    { id: 'coke', name: 'Cocaine', class: 'stimulant', classLabel: 'DRI / SNDRI', svg: svgPhen, halfLife: 'short', addictionPotential: 0.85, effects: { arousal: 2.2, dampening: -0.8, chaos: 1.8, repair: -0.5 } },
    
    // Antipsychotics & Mood Stabilizers
    { id: 'halo', name: 'Haloperidol', class: 'antipsychotic', classLabel: 'Typical Antipsychotic', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -1.0, dampening: 1.8, chaos: -0.5, repair: -0.5 } },
    { id: 'queti', name: 'Quetiapine', class: 'antipsychotic', classLabel: 'Atypical Antipsychotic', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.8, dampening: 1.5, chaos: -0.3, repair: -0.2 } },
    { id: 'arip', name: 'Aripiprazole', class: 'antipsychotic', classLabel: 'Atypical Antipsychotic', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.4, dampening: 1.2, chaos: -0.2, repair: 0.0 } },
    { id: 'risper', name: 'Risperidone', class: 'antipsychotic', classLabel: 'Atypical Antipsychotic', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.6, dampening: 1.4, chaos: -0.3, repair: -0.1 } },
    { id: 'olan', name: 'Olanzapine', class: 'antipsychotic', classLabel: 'Atypical Antipsychotic', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.7, dampening: 1.6, chaos: -0.4, repair: -0.1 } },
    { id: 'cloz', name: 'Clozapine', class: 'antipsychotic', classLabel: 'Atypical Antipsychotic', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.9, dampening: 1.7, chaos: -0.6, repair: -0.3 } },
    { id: 'lithium', name: 'Lithium', class: 'antipsychotic', classLabel: 'Mood Stabilizer', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.2, dampening: 0.8, chaos: -0.7, repair: 0.4 } },
    { id: 'lamo', name: 'Lamotrigine', class: 'antipsychotic', classLabel: 'Mood Stabilizer', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: 0.0, dampening: 0.5, chaos: -0.5, repair: 0.2 } },
    
    // Cannabinoids & Endocannabinoid Modulators
    { id: 'thc', name: 'Delta-9-THC', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', addictionPotential: 0.3, effects: { arousal: 0.2, dampening: 0.5, chaos: 0.6, repair: -0.1 } },
    { id: 'cbd', name: 'Cannabidiol (CBD)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: -0.2, dampening: 0.6, chaos: -0.4, repair: 0.1 } },
    { id: 'delta8', name: 'Delta-8-THC', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', addictionPotential: 0.2, effects: { arousal: 0.1, dampening: 0.7, chaos: 0.3, repair: 0.0 } },
    { id: 'hhc', name: 'HHC (Hexahydrocannabinol)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: 0.15, dampening: 0.6, chaos: 0.4, repair: -0.05 } },
    { id: 'cbga', name: 'CBGA (Cannabigerolic acid)', class: 'cannabinoid', classLabel: 'Cannabinoid Precursor', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: 0.0, dampening: 0.3, chaos: -0.1, repair: 0.2 } },
    { id: 'cbn', name: 'Cannabinol (CBN)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: -0.4, dampening: 0.9, chaos: -0.1, repair: 0.0 } },
    { id: 'cbg', name: 'Cannabigerol (CBG)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: 0.1, dampening: 0.4, chaos: -0.2, repair: 0.3 } },
    { id: 'thcv', name: 'Tetrahydrocannabivarin (THCV)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: 0.5, dampening: 0.1, chaos: 0.1, repair: 0.0 } },
    { id: 'cbdv', name: 'Cannabidivarin (CBDV)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: -0.1, dampening: 0.4, chaos: -0.3, repair: 0.2 } },
    { id: 'thcp', name: 'THC-P (Tetrahydrocannabiphorol)', class: 'cannabinoid', classLabel: 'Potent Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: 0.3, dampening: 0.7, chaos: 0.8, repair: -0.2 } },
    { id: 'thco', name: 'THC-O-Acetate', class: 'cannabinoid', classLabel: 'Synthetic Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: 0.4, dampening: 0.8, chaos: 1.0, repair: -0.3 } },
    { id: 'delta10', name: 'Delta-10-THC', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: 0.25, dampening: 0.4, chaos: 0.35, repair: -0.05 } },
    { id: 'cbc', name: 'Cannabichromene (CBC)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: 0.0, dampening: 0.4, chaos: -0.1, repair: 0.2 } },
    { id: 'cbl', name: 'Cannabicyclol (CBL)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: -0.1, dampening: 0.5, chaos: 0.0, repair: 0.1 } },
    { id: 'cbdp', name: 'Cannabidiphorol (CBDP)', class: 'cannabinoid', classLabel: 'Cannabinoid', svg: svgCannabinoid, halfLife: 'medium', effects: { arousal: -0.3, dampening: 0.8, chaos: -0.2, repair: 0.2 } },
    
    // Depressants / Benzos / Gabapentinoids / Z-Drugs / Opioids
    { id: 'alpraz', name: 'Alprazolam', class: 'depressant', classLabel: 'Benzodiazepine', svg: svgTricyclic, halfLife: 'medium', addictionPotential: 0.8, effects: { arousal: -1.2, dampening: 1.4, chaos: -0.6, repair: -0.3 } },
    { id: 'clonaz', name: 'Clonazepam', class: 'depressant', classLabel: 'Benzodiazepine', svg: svgTricyclic, halfLife: 'medium', addictionPotential: 0.7, effects: { arousal: -1.0, dampening: 1.3, chaos: -0.5, repair: -0.2 } },
    { id: 'diaz', name: 'Diazepam', class: 'depressant', classLabel: 'Benzodiazepine', svg: svgTricyclic, halfLife: 'medium', addictionPotential: 0.6, effects: { arousal: -0.9, dampening: 1.2, chaos: -0.4, repair: -0.1 } },
    { id: 'loraz', name: 'Lorazepam', class: 'depressant', classLabel: 'Benzodiazepine', svg: svgTricyclic, halfLife: 'medium', addictionPotential: 0.75, effects: { arousal: -1.1, dampening: 1.3, chaos: -0.5, repair: -0.2 } },
    { id: 'pregab', name: 'Pregabalin', class: 'depressant', classLabel: 'Gabapentinoid', svg: svgPhen, halfLife: 'medium', addictionPotential: 0.4, effects: { arousal: -0.6, dampening: 0.9, chaos: -0.3, repair: 0.1 } },
    { id: 'gaba', name: 'Gabapentin', class: 'depressant', classLabel: 'Gabapentinoid', svg: svgPhen, halfLife: 'medium', effects: { arousal: -0.5, dampening: 0.8, chaos: -0.2, repair: 0.0 } },
    { id: 'zolp', name: 'Zolpidem', class: 'depressant', classLabel: 'Z-Drug', svg: svgTricyclic, halfLife: 'medium', addictionPotential: 0.6, effects: { arousal: -1.5, dampening: 1.6, chaos: 0.2, repair: -0.4 } },
    { id: 'zopic', name: 'Zopiclone', class: 'depressant', classLabel: 'Z-Drug', svg: svgTricyclic, halfLife: 'medium', addictionPotential: 0.6, effects: { arousal: -1.4, dampening: 1.5, chaos: 0.1, repair: -0.3 } },
    { id: 'alc', name: 'Ethanol (Alcohol)', class: 'depressant', classLabel: 'GABAergic', svg: svgPhen, halfLife: 'medium', addictionPotential: 0.8, effects: { arousal: -0.5, dampening: 1.0, chaos: 1.2, repair: -0.8 } },
    { id: 'fent', name: 'Fentanyl', class: 'depressant', classLabel: 'Mu-Opioid Agonist', svg: svgTricyclic, halfLife: 'short', addictionPotential: 1.0, effects: { arousal: -1.5, dampening: 2.5, chaos: 0.2, repair: 1.2 } },
    { id: 'oxy', name: 'Oxycodone', class: 'depressant', classLabel: 'Mu-Opioid Agonist', svg: svgTricyclic, halfLife: 'medium', addictionPotential: 0.8, effects: { arousal: -0.8, dampening: 1.8, chaos: 0.3, repair: 1.0 } },
    
    // Acetylcholine, NMDA & Other
    { id: 'donepezil', name: 'Donepezil', class: 'stimulant', classLabel: 'AChEI', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: 0.4, dampening: 0.0, chaos: -0.1, repair: 0.2 } },
    { id: 'memantine', name: 'Memantine', class: 'depressant', classLabel: 'NMDA Antagonist', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: -0.1, dampening: 0.3, chaos: -0.2, repair: 0.3 } },
    { id: 'dextro', name: 'Dextromethorphan (DXM)', class: 'depressant', classLabel: 'NMDA Antagonist', svg: svgTricyclic, halfLife: 'medium', effects: { arousal: 0.1, dampening: 0.6, chaos: 0.9, repair: 0.1 } },

    // Novel & Conventional Withdrawal & Corrective Treatments
    { id: 'sr17', name: 'SR17-018', class: 'corrective', classLabel: 'Biased Opioid Agonist', isBlue: true, svg: svgIndole, halfLife: 'long', isCure: true, targetAddiction: 'depressant', reversesClass: 'depressant', reversalEfficacy: 0.9, effects: { arousal: 0.1, dampening: 0.2, chaos: -1.5, repair: 2.0 } },
    { id: 'nrg01', name: 'NRG-01 (DopaRestore)', class: 'corrective', classLabel: 'DA Plasticity Enhancer', isBabelForge: true, svg: svgPhen, halfLife: 'long', isCure: true, targetAddiction: 'stimulant', reversesClass: 'stimulant', reversalEfficacy: 0.95, effects: { arousal: 0.4, dampening: 0.0, chaos: -0.5, repair: 2.2 } },
    { id: 'methadone', name: 'Methadone', class: 'depressant', classLabel: 'Mu-Opioid Agonist', svg: svgTricyclic, halfLife: 'long', addictionPotential: 0.5, isCure: true, targetAddiction: 'depressant', effects: { arousal: -0.5, dampening: 1.5, chaos: -0.8, repair: 0.5 } },
    { id: 'buprenorphine', name: 'Buprenorphine', class: 'depressant', classLabel: 'Partial Opioid Agonist', svg: svgTricyclic, halfLife: 'long', addictionPotential: 0.3, isCure: true, targetAddiction: 'depressant', effects: { arousal: -0.2, dampening: 1.0, chaos: -1.0, repair: 0.8 } },
    { id: 'clonidine', name: 'Clonidine', class: 'corrective', classLabel: 'Alpha-2 Agonist', svg: svgPhen, halfLife: 'medium', isCure: true, targetAddiction: 'stimulant', reversesClass: 'stimulant', reversalEfficacy: 0.75, effects: { arousal: -0.8, dampening: 0.9, chaos: -0.6, repair: 0.1 } },
    { id: 'acamprosate', name: 'Acamprosate', class: 'corrective', classLabel: 'GABA/Glu Modulator', svg: svgPhen, halfLife: 'medium', isCure: true, targetAddiction: 'depressant', reversesClass: 'depressant', reversalEfficacy: 0.8, effects: { arousal: -0.1, dampening: 0.4, chaos: -0.8, repair: 0.3 } },
    { id: 'flumazenil', name: 'Flumazenil', class: 'corrective', classLabel: 'GABA-A Antagonist', svg: svgTricyclic, halfLife: 'short', targetClass: 'depressant', reversesClass: 'depressant', reversalEfficacy: 0.8, effects: { arousal: 0.5, dampening: -0.4, chaos: 0.3, repair: 1.0 } },
    { id: 'nac', name: 'N-Acetylcysteine (NAC)', class: 'corrective', classLabel: 'Glutamate Modulator', svg: svgPhen, halfLife: 'short', targetClass: 'multiple', reversesClass: 'multiple', reversalEfficacy: 0.6, effects: { arousal: 0.0, dampening: 0.2, chaos: -0.4, repair: 1.2 } },
    { id: 'agmatine', name: 'Agmatine Sulfate', class: 'corrective', classLabel: 'NMDA Modulator / NOSI', svg: svgPhen, halfLife: 'medium', targetClass: 'multiple', reversesClass: 'multiple', reversalEfficacy: 0.7, effects: { arousal: -0.1, dampening: 0.3, chaos: -0.3, repair: 1.4 } },
    { id: 'galantamine', name: 'Galantamine', class: 'corrective', classLabel: 'AChE Inhibitor / PAM', svg: svgTricyclic, halfLife: 'long', targetClass: 'cannabinoid', reversesClass: 'cannabinoid', reversalEfficacy: 0.75, effects: { arousal: 0.4, dampening: 0.0, chaos: -0.1, repair: 1.1 } },

    // Lifestyle & Vanilla Interventions (Holistic & Physical Health)
    { id: 'z2cardio', name: 'Zone 2 Cardio', class: 'lifestyle', classLabel: 'Aerobic Exercise', isLifestyle: true, svg: svgPhen, halfLife: 'medium', effects: { arousal: 0.4, dampening: -0.2, chaos: -0.4, repair: 0.8 } },
    { id: 'hiit', name: 'HIIT', class: 'lifestyle', classLabel: 'Anaerobic Exercise', isLifestyle: true, svg: svgPhen, halfLife: 'short', effects: { arousal: 1.2, dampening: -0.1, chaos: 0.2, repair: 0.5 } },
    { id: 'meditation', name: 'Mindfulness Meditation', class: 'lifestyle', classLabel: 'Contemplative Practice', isLifestyle: true, svg: svgIndole, halfLife: 'short', effects: { arousal: -0.3, dampening: 0.5, chaos: -0.6, repair: 0.7 } },
    { id: 'cbt', name: 'CBT / Talk Therapy', class: 'lifestyle', classLabel: 'Psychotherapy', isLifestyle: true, svg: svgTricyclic, halfLife: 'long', effects: { arousal: 0.1, dampening: 0.1, chaos: -0.9, repair: 1.2 } },
    { id: 'keto', name: 'Ketogenic Diet', class: 'lifestyle', classLabel: 'Metabolic Therapy', isLifestyle: true, svg: svgPhen, halfLife: 'long', effects: { arousal: 0.2, dampening: 0.3, chaos: -0.3, repair: 0.6 } },
    { id: 'sleep', name: 'Optimized Sleep (8hr+)', class: 'lifestyle', classLabel: 'Circadian Rhythm', isLifestyle: true, svg: svgIndole, halfLife: 'long', effects: { arousal: -0.2, dampening: 0.4, chaos: -1.0, repair: 1.8 } },
    { id: 'omega3', name: 'Omega-3 (EPA/DHA)', class: 'lifestyle', classLabel: 'Nutritional Support', isLifestyle: true, svg: svgPhen, halfLife: 'long', effects: { arousal: 0.1, dampening: 0.1, chaos: -0.2, repair: 0.4 } },
    { id: 'sauna', name: 'Sauna / Heat Therapy', class: 'lifestyle', classLabel: 'Thermal Stress', isLifestyle: true, svg: svgTricyclic, halfLife: 'short', effects: { arousal: 0.3, dampening: 0.4, chaos: -0.1, repair: 0.6 } },
    { id: 'hbot', name: 'Hyperbaric Oxygen (HBOT)', class: 'lifestyle', classLabel: 'Oxygen Therapy', isLifestyle: true, svg: svgTricyclic, halfLife: 'long', effects: { arousal: 0.1, dampening: 0.1, chaos: -0.5, repair: 1.6 } },
    { id: 'coldplunge', name: 'Cold Plunge / Immersion', class: 'lifestyle', classLabel: 'Thermal Stress', isLifestyle: true, svg: svgPhen, halfLife: 'short', effects: { arousal: 0.8, dampening: -0.2, chaos: -0.3, repair: 0.9 } },
    { id: 'breathwork', name: 'Somatic Breathwork', class: 'lifestyle', classLabel: 'Contemplative Practice', isLifestyle: true, svg: svgIndole, halfLife: 'short', effects: { arousal: -0.5, dampening: 0.8, chaos: -0.7, repair: 1.0 } },
    { id: 'lionmane', name: 'Lion\'s Mane Mushroom', class: 'lifestyle', classLabel: 'Nutritional Support', isLifestyle: true, svg: svgIndole, halfLife: 'long', effects: { arousal: 0.2, dampening: 0.0, chaos: -0.2, repair: 1.4 } },

    // Surgical & Neuromodulatory Procedures
    { id: 'tms', name: 'Transcranial Magnetic Stimulation', class: 'novel', classLabel: 'Neuromodulation', isBlue: true, svg: svgPhen, halfLife: 'long', effects: { arousal: 0.8, dampening: -0.1, chaos: -0.5, repair: 1.5 } },
    { id: 'dbs', name: 'Deep Brain Stimulation (DBS)', class: 'novel', classLabel: 'Surgical Implant', isBlue: true, svg: svgTricyclic, halfLife: 'long', effects: { arousal: 1.0, dampening: 1.2, chaos: -1.0, repair: 0.5 } },
    { id: 'vns', name: 'Vagus Nerve Stimulation (VNS)', class: 'novel', classLabel: 'Surgical Implant', isBlue: true, svg: svgIndole, halfLife: 'long', effects: { arousal: -0.2, dampening: 0.6, chaos: -0.8, repair: 0.8 } },
    { id: 'ect', name: 'Electroconvulsive Therapy (ECT)', class: 'novel', classLabel: 'Neuromodulation', svg: svgPhen, halfLife: 'medium', effects: { arousal: -0.5, dampening: 1.5, chaos: 1.0, repair: 2.0 } },
    { id: 'tcca', name: 'Targeted Cliques-Complex Ablation', class: 'novel', classLabel: 'HIFU Ablation', isBabelForge: true, svg: svgIndole, halfLife: 'long', effects: { arousal: -1.5, dampening: 1.5, chaos: -2.0, repair: 0.0 } },
];