import * as THREE from "three";

// ==================================================
// POWER-UP TYPES
// Cada tipo tem cor e formato de núcleo próprios para ser reconhecido
// de longe. Por enquanto só existe a "visão 2D"; novos tipos entram aqui.
// ==================================================

export const POWER_UP_TYPES = {
    view2d: {
        label: "2D view",
        color: "#ffd447",
        createCore: (size) => new THREE.OctahedronGeometry(size, 0),
    },
};

// ==================================================
// POWER-UP MODEL (coletável que flutua sobre o campo)
// Origem = ponto no gramado; o item flutua acima dele.
//
// Hierarquia:
//   powerUp
//    ├─ baseGlow (disco no chão, marca onde o item está)
//    └─ floating (sobe e desce)
//         ├─ core (poliedro emissivo que gira)
//         ├─ shell (casca em wireframe ao redor do núcleo)
//         ├─ ring (anel inclinado que gira em outro eixo)
//         └─ orbit ─ 3 orbiters (esferas pequenas girando em volta)
// ==================================================

const FLOAT_HEIGHT = 0.5;

export function createPowerUp(typeKey) {
    const type = POWER_UP_TYPES[typeKey];
    const color = new THREE.Color(type.color);

    const powerUp = new THREE.Group();
    powerUp.name = `Power-up (${type.label})`;

    // ---------- marca no chão ----------
    const baseGlow = new THREE.Mesh(
        new THREE.RingGeometry(0.12, 0.32, 40),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })
    );
    baseGlow.rotation.x = -Math.PI / 2;
    baseGlow.position.y = 0.01;
    powerUp.add(baseGlow);

    // ---------- parte flutuante ----------
    const floating = new THREE.Group();
    floating.position.y = FLOAT_HEIGHT;
    powerUp.add(floating);

    const core = new THREE.Mesh(
        type.createCore(0.16),
        new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.3,
            metalness: 0.3,
            roughness: 0.25,
            flatShading: true, // facetas visíveis, cara de "gema"
        })
    );
    core.castShadow = true;
    floating.add(core);

    const shell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.23, 1),
        new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.35 })
    );
    floating.add(shell);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.018, 10, 48),
        new THREE.MeshStandardMaterial({ color: "#f5f5f5", emissive: color, emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.3 })
    );
    ring.rotation.x = Math.PI / 2.6;
    floating.add(ring);

    const orbit = new THREE.Group();
    floating.add(orbit);
    const orbiterMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: color, emissiveIntensity: 1 });
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const orbiter = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), orbiterMaterial);
        orbiter.position.set(Math.cos(angle) * 0.38, 0, Math.sin(angle) * 0.38);
        orbit.add(orbiter);
    }

    powerUp.userData = { type: typeKey, parts: { baseGlow, floating, core, shell, ring, orbit } };
    return powerUp;
}

// Animação ociosa: flutua, gira e pulsa a marca no chão
export function updatePowerUp(powerUp, time) {
    const { baseGlow, floating, core, shell, ring, orbit } = powerUp.userData.parts;

    floating.position.y = FLOAT_HEIGHT + Math.sin(time * 2) * 0.06;
    core.rotation.y = time * 1.5;
    core.rotation.x = Math.sin(time) * 0.3;
    shell.rotation.y = -time * 0.6;
    ring.rotation.z = time * 0.9;
    orbit.rotation.y = time * 2.2;

    const pulse = 0.85 + Math.sin(time * 3) * 0.15;
    baseGlow.scale.setScalar(pulse);
    baseGlow.material.opacity = 0.3 + 0.2 * pulse;
}
