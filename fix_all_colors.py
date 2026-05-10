import re

def update_file(filename, replacement_func):
    with open(filename, 'r') as f:
        content = f.read()
    new_content = replacement_func(content)
    with open(filename, 'w') as f:
        f.write(new_content)

def patch_index(content):
    # Find the node iteration in index.html animateDashboard
    old_logic = r"if \(dashStatus === 'PTSD'\) \{[\s\S]*?if \(node === dashHoveredNode\) \{"
    
    new_logic = """// Set constant anatomical color
                node.material.color.setHex(node.userData.baseColor);
                let emissiveColor = new THREE.Color(node.userData.baseColor);
                let emissiveInt = 0.4 + wave * 0.3;
                
                if (dashStatus === 'PTSD') {
                    if (dashTreatmentClass === 'NOVEL') {
                        if (dashPharmaEfficacy <= 1) {
                            const jitter = (1 - dashPharmaEfficacy) * 12;
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                            node.position.z = node.userData.origin.z + (Math.random() - 0.5) * jitter;
                            const ptsdScale = targetBaseScale + wave * 0.4;
                            node.scale.setScalar(Math.max(0.2, ptsdScale));
                            
                            const ptsdEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0xff0033), 0.7);
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            emissiveColor.lerpColors(ptsdEmissive, repairEmissive, dashPharmaEfficacy);
                            emissiveInt = 0.8 + (wave * 0.5) - (dashPharmaEfficacy * 0.4);
                        } else {
                            const overDose = dashPharmaEfficacy - 1;
                            const jitter = overDose * 6; 
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * jitter;
                            node.position.z = node.userData.origin.z + (Math.random() - 0.5) * jitter;
                            const rigidScale = targetBaseScale * (1 - (overDose * 0.5));
                            node.scale.setScalar(Math.max(0.1, rigidScale));
                            
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            const toxicEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0xe0f2fe), 0.8);
                            emissiveColor.lerpColors(repairEmissive, toxicEmissive, overDose);
                            emissiveInt = 0.4 + (overDose * 2.0);
                        }
                    } else {
                        const jitter = (1 - Math.min(1, dashPharmaEfficacy)) * 12;
                        node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                        node.position.z = node.userData.origin.z + (Math.random() - 0.5) * jitter;
                        const ssriScale = targetBaseScale + (wave * 0.4 * (1 - Math.min(1, dashPharmaEfficacy)));
                        node.scale.setScalar(Math.max(0.1, ssriScale));
                        
                        if (dashPharmaEfficacy <= 1) {
                            const ptsdEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0xff0033), 0.7);
                            const dullEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x334155), 0.8);
                            emissiveColor.lerpColors(ptsdEmissive, dullEmissive, dashPharmaEfficacy);
                            emissiveInt = 0.8 - (dashPharmaEfficacy * 0.6);
                        } else {
                            emissiveColor.copy(new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x334155), 0.8));
                            emissiveInt = 0.1;
                        }
                    }
                } else if (dashStatus === 'ADHD') {
                    if (dashTreatmentClass === 'NOVEL') {
                        if (dashPharmaEfficacy <= 1) {
                            const adhdScale = targetBaseScale + wave * 0.3;
                            node.scale.setScalar(Math.max(0.2, adhdScale));
                            node.position.lerp(node.userData.origin, 0.1);
                            
                            const adhdEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x334155), 0.6);
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            emissiveColor.lerpColors(adhdEmissive, repairEmissive, dashPharmaEfficacy);
                            emissiveInt = 0.1 + (dashPharmaEfficacy * 0.5);
                        } else {
                            const overDose = dashPharmaEfficacy - 1;
                            const jitter = overDose * 15;
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * jitter;
                            const overScale = targetBaseScale + wave * 0.8;
                            node.scale.setScalar(Math.max(0.2, overScale));
                            
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            const toxicEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0xff0033), 0.7);
                            emissiveColor.lerpColors(repairEmissive, toxicEmissive, overDose);
                            emissiveInt = 0.6 + (overDose * 1.5);
                        }
                    } else {
                        if (dashPharmaEfficacy <= 1) {
                            const adhdScale = targetBaseScale + wave * 0.3;
                            node.scale.setScalar(Math.max(0.2, adhdScale));
                            node.position.lerp(node.userData.origin, 0.1);
                            
                            const adhdEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x334155), 0.6);
                            const activeEmissive = new THREE.Color(node.userData.baseColor);
                            emissiveColor.lerpColors(adhdEmissive, activeEmissive, dashPharmaEfficacy);
                            emissiveInt = 0.1 + (dashPharmaEfficacy * 0.8);
                        } else {
                            const overDose = dashPharmaEfficacy - 1;
                            const jitter = overDose * 25; 
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * jitter;
                            const overScale = targetBaseScale + wave * 1.2;
                            node.scale.setScalar(Math.max(0.2, overScale));
                            
                            const activeEmissive = new THREE.Color(node.userData.baseColor);
                            const toxicEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0xff0033), 0.7);
                            emissiveColor.lerpColors(activeEmissive, toxicEmissive, Math.min(1, overDose));
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
                            
                            const tEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x10b981), 0.6);
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            emissiveColor.lerpColors(tEmissive, repairEmissive, dashPharmaEfficacy);
                            emissiveInt = 0.8 - (dashPharmaEfficacy * 0.4);
                        } else {
                            const overDose = dashPharmaEfficacy - 1;
                            node.position.lerp(node.userData.origin, 0.2); 
                            const rigidScale = targetBaseScale * (1 - (overDose * 0.6));
                            node.scale.setScalar(Math.max(0.1, rigidScale));
                            
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            const dullEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x334155), 0.8);
                            emissiveColor.lerpColors(repairEmissive, dullEmissive, overDose);
                            emissiveInt = 0.4 - (overDose * 0.3);
                        }
                    } else {
                        if (dashPharmaEfficacy <= 1) {
                            const tickJitter = (1 - dashPharmaEfficacy) * 8 * (Math.random() > 0.8 ? 1 : 0);
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * tickJitter;
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * tickJitter;
                            const rigidScale = targetBaseScale * (1 - (dashPharmaEfficacy * 0.8)); 
                            node.scale.setScalar(Math.max(0.1, rigidScale));
                            
                            const tEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x10b981), 0.6);
                            const dullEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x334155), 0.8);
                            emissiveColor.lerpColors(tEmissive, dullEmissive, dashPharmaEfficacy);
                            emissiveInt = 0.8 - (dashPharmaEfficacy * 0.7);
                        } else {
                            node.position.lerp(node.userData.origin, 0.8); 
                            const overDose = dashPharmaEfficacy - 1;
                            const rigidScale = targetBaseScale * (1 - (overDose * 0.9));
                            node.scale.setScalar(Math.max(0.05, rigidScale));
                            emissiveColor.copy(new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x334155), 0.8));
                            emissiveInt = 0.1;
                        }
                    }
                } else {
                    const healthyScale = targetBaseScale + wave * 0.6;
                    node.scale.setScalar(healthyScale);
                    node.position.lerp(node.userData.origin, 0.1);
                }
                
                if (node === dashHoveredNode) {"""
    
    return re.sub(old_logic, new_logic, content)

def patch_11d(content):
    old_logic = r"if \(isStimulating\) \{[\s\S]*?if \(node === selectedNode\) \{"
    
    new_logic = """// Set constant anatomical color
                node.material.color.setHex(node.userData.baseColor);
                let emissiveColor = new THREE.Color(node.userData.baseColor);
                let emissiveInt = 0.4 + wave * 0.3;
                
                let baseScale = 1.0;
                
                if (isStimulating) {
                    if (currentStatus === 'RESISTANT') {
                        if (pharmaEfficacy <= 1) {
                            const jitter = (1 - pharmaEfficacy) * 40;
                            const chaoticScale = 1.0 + wave * 2.0 + (Math.random() - 0.5) * (1 - pharmaEfficacy) * 1.5;
                            const pharmaScale = 1.2 + wave * 0.4;
                            baseScale = chaoticScale * (1 - pharmaEfficacy) + pharmaScale * pharmaEfficacy;
                            
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * jitter;
                            
                            const ptsdEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0xff0033), 0.7);
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            emissiveColor.lerpColors(ptsdEmissive, repairEmissive, pharmaEfficacy);
                            emissiveInt = 2.0 - (1.5 * pharmaEfficacy);
                        } else {
                            const overDose = pharmaEfficacy - 1;
                            const jitter = overDose * 6; 
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * jitter;
                            node.position.z = node.userData.origin.z + (Math.random() - 0.5) * jitter;
                            baseScale = 1.2 * (1 - (overDose * 0.5));
                            
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            const toxicEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0xe0f2fe), 0.8);
                            emissiveColor.lerpColors(repairEmissive, toxicEmissive, overDose);
                            emissiveInt = 0.5 + (overDose * 2.0);
                        }
                    } else if (currentStatus === 'ADHD') {
                        if (pharmaEfficacy <= 1) {
                            baseScale = 1.0 + wave * 0.3;
                            node.position.lerp(node.userData.origin, 0.1);
                            
                            const adhdEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x334155), 0.6);
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            emissiveColor.lerpColors(adhdEmissive, repairEmissive, pharmaEfficacy);
                            emissiveInt = 0.1 + (pharmaEfficacy * 0.5);
                        } else {
                            const overDose = pharmaEfficacy - 1;
                            const jitter = overDose * 15;
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * jitter;
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * jitter;
                            baseScale = 1.0 + wave * 0.8;
                            
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            const toxicEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0xff0033), 0.7);
                            emissiveColor.lerpColors(repairEmissive, toxicEmissive, overDose);
                            emissiveInt = 0.6 + (overDose * 1.5);
                        }
                    } else if (currentStatus === 'TOURETTES') {
                        if (pharmaEfficacy <= 1) {
                            const tickJitter = (1 - pharmaEfficacy) * 8 * (Math.random() > 0.8 ? 1 : 0);
                            node.position.y = node.userData.origin.y + (Math.random() - 0.5) * tickJitter;
                            node.position.x = node.userData.origin.x + (Math.random() - 0.5) * tickJitter;
                            baseScale = 1.0 + wave * 0.8;
                            
                            const tEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x10b981), 0.6);
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            emissiveColor.lerpColors(tEmissive, repairEmissive, pharmaEfficacy);
                            emissiveInt = 0.8 - (pharmaEfficacy * 0.4);
                        } else {
                            const overDose = pharmaEfficacy - 1;
                            node.position.lerp(node.userData.origin, 0.2);
                            baseScale = 1.0 * (1 - (overDose * 0.6));
                            
                            const repairEmissive = new THREE.Color(0xfcd34d);
                            const dullEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x334155), 0.8);
                            emissiveColor.lerpColors(repairEmissive, dullEmissive, overDose);
                            emissiveInt = 0.4 - (overDose * 0.3);
                        }
                    } else {
                        baseScale = 1.0 + wave * 0.8;
                        node.position.y = node.userData.origin.y + wave * 10;
                    }
                } else {
                    if (currentStatus === 'RESISTANT') {
                        baseScale = pharmaEfficacy <= 1 ? 0.4 + (0.6 * pharmaEfficacy) : 1.0 - ((pharmaEfficacy - 1) * 0.5);
                        node.position.lerp(node.userData.origin, 0.1);
                        
                        if (pharmaEfficacy <= 1) {
                            const ptsdEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0xef4444), 0.7);
                            emissiveColor.lerpColors(ptsdEmissive, emissiveColor, pharmaEfficacy);
                            emissiveInt = 0.2;
                        } else {
                            const toxicEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0xe0f2fe), 0.8);
                            emissiveColor.lerpColors(emissiveColor, toxicEmissive, pharmaEfficacy - 1);
                            emissiveInt = 0.2 + (pharmaEfficacy - 1);
                        }
                    } else if (currentStatus === 'ADHD') {
                        baseScale = pharmaEfficacy <= 1 ? 0.6 + (0.4 * pharmaEfficacy) : 1.0 - ((pharmaEfficacy - 1) * 0.5);
                        node.position.lerp(node.userData.origin, 0.1);
                        const adhdEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x334155), 0.6);
                        emissiveColor.lerpColors(adhdEmissive, emissiveColor, Math.min(1, pharmaEfficacy));
                        emissiveInt = 0.1;
                    } else if (currentStatus === 'TOURETTES') {
                        baseScale = pharmaEfficacy <= 1 ? 1.6 - (0.6 * pharmaEfficacy) : 1.0 - ((pharmaEfficacy - 1) * 0.5);
                        node.position.lerp(node.userData.origin, 0.1);
                        const tEmissive = new THREE.Color(node.userData.baseColor).lerp(new THREE.Color(0x10b981), 0.6);
                        emissiveColor.lerpColors(tEmissive, emissiveColor, Math.min(1, pharmaEfficacy));
                        emissiveInt = 0.3;
                    } else {
                        node.position.lerp(node.userData.origin, 0.1);
                    }
                }
                
                node.scale.setScalar(Math.max(0.1, baseScale));
                
                if (node === selectedNode) {"""
    return re.sub(old_logic, new_logic, content)

def patch_stack(content):
    old_logic = r"// Color & Emissive[\s\S]*?node\.material\.emissiveIntensity = emissiveInt \+ wave\*0\.2;"
    new_logic = """// Anatomical Base Color Persisted
                node.material.color.setHex(node.userData.baseColor);
                
                let targetEmissive = new THREE.Color(node.userData.baseColor);
                if (v.repair > 0.5 && v.chaos <= 0) targetEmissive.setHex(0xfcd34d);
                else if (v.dampening > 1.0) targetEmissive.lerp(new THREE.Color(0x475569), 0.8);
                else if (v.chaos > 0.5 || v.arousal > 2.0) targetEmissive.lerp(new THREE.Color(0xff0033), 0.8);
                
                let emissiveInt = 0.4;
                if (v.repair > 0) emissiveInt = 0.8;
                if (v.dampening > 1) emissiveInt = 0.1;
                if (v.chaos > 1) emissiveInt = 1.5;
                
                node.material.emissive.lerp(targetEmissive, 0.1);
                node.material.emissiveIntensity = emissiveInt + wave*0.2;"""
    return re.sub(old_logic, new_logic, content)

update_file('index.html', patch_index)
update_file('11d-projection.html', patch_11d)
update_file('stack-simulator.html', patch_stack)
print("Color logic unified to maintain anatomical accuracy via emissive manipulation.")
