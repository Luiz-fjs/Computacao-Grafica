import * as THREE from "three";
import { TABLE } from "./table.js";
import {
    createNormalBallTexture,
    createHeavyBallTexture,
    createLightBallTexture,
} from "./textures.js";

// ==================================================
// BALL TYPES
// Os parâmetros físicos (mass, friction, bounciness) ainda não são
// usados: ficam definidos aqui para a etapa de física.
// ==================================================

export const BALL_TYPES = {
    normal: { label: "Normal ball", radius: 0.22, mass: 1.0, friction: 0.6, bounciness: 0.7 },
    heavy: { label: "Heavy ball", radius: 0.18, mass: 3.0, friction: 0.8, bounciness: 0.35 },
    light: { label: "Light ball", radius: 0.3, mass: 0.35, friction: 0.3, bounciness: 0.9 },
};

export function createBalls() {
    const materials = {
        normal: new THREE.MeshStandardMaterial({ map: createNormalBallTexture(), roughness: 0.45 }),
        heavy: new THREE.MeshStandardMaterial({ map: createHeavyBallTexture(), metalness: 0.75, roughness: 0.35 }),
        light: new THREE.MeshStandardMaterial({ map: createLightBallTexture(), roughness: 0.25 }),
    };

    const balls = {};
    for (const [type, config] of Object.entries(BALL_TYPES)) {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(config.radius, 48, 32), materials[type]);
        ball.name = config.label;
        ball.castShadow = true;
        ball.receiveShadow = true;
        ball.userData = { type, ...config };
        balls[type] = ball;
    }
    return balls;
}

// ==================================================
// BALL STAND (expositor ao lado da mesa com as bolas reservas)
// ==================================================

export function createBallStand(woodMaterial, metalMaterial) {
    const stand = new THREE.Group();
    stand.name = "Ball stand";
    stand.position.set(9.6, TABLE.floorY, -2.5);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.15, 32), woodMaterial);
    base.position.y = 0.075;
    stand.add(base);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.2, 20), metalMaterial);
    pillar.position.y = 1.75;
    stand.add(pillar);

    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 2.6), woodMaterial);
    tray.position.y = 3.4;
    stand.add(tray);

    // Três berços (toros) onde as bolas ficam apoiadas
    const slots = [];
    for (let i = 0; i < 3; i++) {
        const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 10, 24), metalMaterial);
        cradle.rotation.x = Math.PI / 2;
        cradle.position.set(0, 3.5, -0.85 + i * 0.85);
        stand.add(cradle);
        slots.push(new THREE.Vector3(0, 3.5, -0.85 + i * 0.85));
    }

    stand.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    stand.userData.slots = slots;
    return stand;
}
