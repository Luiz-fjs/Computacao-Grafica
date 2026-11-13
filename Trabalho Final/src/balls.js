import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { TABLE } from "./table.js";
import { applyWorldUVs } from "./uv.js";
import {
    createNormalBallTexture,
    createLightBallTexture,
    loadImageTextureSet,
    PBR_MAPS,
} from "./textures.js";

// ==================================================
// EXTERNAL ASSETS
//   Bola normal: modelo "Football" (Poly Haven, CC0), em glTF
//   Bola pesada: textura PBR "Metal059C" (ambientCG, CC0), 1K JPG
// ==================================================

const FOOTBALL_MODEL_URL = "assets/models/football/football_2k.gltf";
const FOOTBALL_MESH_NAME = "football_inflated"; // o glTF também traz uma bola murcha
const METAL_TEXTURE_DIR = "assets/textures/metal059c/Metal059C_1K-JPG";

// ==================================================
// BALL TYPES
// Parâmetros físicos usados em physics.js
// ==================================================

export const BALL_TYPES = {
    normal: { label: "Normal ball", radius: 0.22, mass: 1.0, friction: 0.6, bounciness: 0.7 },
    heavy: { label: "Heavy ball", radius: 0.18, mass: 3.0, friction: 0.8, bounciness: 0.35 },
    light: { label: "Light ball", radius: 0.3, mass: 0.35, friction: 0.3, bounciness: 0.9 },
};

// Esfera derivada de um cubo ("cube sphere"): cada vértice de um BoxGeometry
// subdividido é empurrado até o raio. Cada uma das 6 faces mantém seu próprio
// quadrado de UV (0..1), então a textura quadrada não se espreme nos polos
// como acontece no mapeamento equirretangular da SphereGeometry.
function createCubeSphereGeometry(radius, segments) {
    const geometry = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < position.count; i++) {
        vertex.fromBufferAttribute(position, i).normalize();
        // Normal exata da esfera (evita "quinas" de sombreamento entre as faces)
        normal.setXYZ(i, vertex.x, vertex.y, vertex.z);
        position.setXYZ(i, vertex.x * radius, vertex.y * radius, vertex.z * radius);
    }

    geometry.computeBoundingSphere();
    return geometry;
}

// Material PBR da bola pesada: cor, relevo (normal map), rugosidade e
// metalicidade vêm de imagens.
function createMetalMaterial(envMap) {
    // Normal map na convenção OpenGL (Y para cima), a mesma do Three.js
    const maps = { ...PBR_MAPS, metalnessMap: "Metalness" };

    return new THREE.MeshStandardMaterial({
        ...loadImageTextureSet(METAL_TEXTURE_DIR, maps),
        metalness: 1,
        roughness: 1, // multiplicadores: os valores reais vêm dos mapas
        envMap,
        envMapIntensity: 0.8,
    });
}

// Troca a esfera provisória da bola normal pela malha do glTF quando carregar.
// O objeto continua o mesmo (posição, física e userData não mudam).
function loadFootballModel(ball) {
    new GLTFLoader().load(
        FOOTBALL_MODEL_URL,
        (gltf) => {
            const source = gltf.scene.getObjectByName(FOOTBALL_MESH_NAME);
            if (!source?.isMesh) {
                console.warn(`Football mesh "${FOOTBALL_MESH_NAME}" not found; keeping fallback sphere.`);
                return;
            }

            // Centraliza na origem e escala para o raio da bola normal
            const geometry = source.geometry.clone();
            geometry.computeBoundingSphere();
            geometry.center();
            const scale = ball.userData.radius / geometry.boundingSphere.radius;
            geometry.scale(scale, scale, scale);
            geometry.computeBoundingSphere();

            source.material.side = THREE.FrontSide;
            ball.geometry.dispose();
            ball.geometry = geometry;
            ball.material = source.material;
        },
        undefined,
        (error) => console.warn("Could not load football model; keeping fallback sphere.", error)
    );
}

export function createBalls(envMap) {
    const materials = {
        // Provisório até o glTF carregar (e alternativa se ele falhar)
        normal: new THREE.MeshStandardMaterial({ map: createNormalBallTexture(), roughness: 0.45 }),
        heavy: createMetalMaterial(envMap),
        light: new THREE.MeshStandardMaterial({ map: createLightBallTexture(), roughness: 0.25 }),
    };

    const balls = {};
    for (const [type, config] of Object.entries(BALL_TYPES)) {
        const geometry = type === "heavy"
            ? createCubeSphereGeometry(config.radius, 24)
            : new THREE.SphereGeometry(config.radius, 48, 32);
        const ball = new THREE.Mesh(geometry, materials[type]);
        ball.name = config.label;
        ball.castShadow = true;
        ball.receiveShadow = true;
        ball.userData = { type, ...config };
        balls[type] = ball;
    }

    loadFootballModel(balls.normal);
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
            if (child.material === woodMaterial) applyWorldUVs(child.geometry);
        }
    });

    stand.userData.slots = slots;
    return stand;
}
