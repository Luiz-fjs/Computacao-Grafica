import * as THREE from "three";
import {
    createJerseyTexture,
    createSockTexture,
    createFaceTexture,
} from "./textures.js";

// ==================================================
// TEAM STYLES
// ==================================================

export const TEAMS = {
    red: {
        name: "Red",
        jersey: "#c62828",
        stripe: "#8e1b1b",
        shorts: "#f5f5f5",
        sock: "#c62828",
        sockBand: "#ffffff",
        handle: "#d32f2f",
        direction: 1, // ataca no sentido +X
    },
    blue: {
        name: "Blue",
        jersey: "#1e5bd6",
        stripe: "#123c93",
        shorts: "#0f1f45",
        sock: "#ffffff",
        sockBand: "#1e5bd6",
        handle: "#1e5bd6",
        direction: -1, // ataca no sentido -X
    },
};

const SKIN_TONES = ["#f1c7a5", "#d9a17a", "#a8714d", "#7a4b2e", "#e8b896"];
const HAIR_COLORS = ["#2b1a0f", "#111111", "#6b3e1f", "#d9b25c", "#3d2314"];

// ==================================================
// CUSTOM GEOMETRIES
// ==================================================

// Torso por revolução (LatheGeometry): cintura estreita e ombros largos.
// Os pontos são (raio, altura) no plano XY e giram em torno do eixo Y.
function createTorsoGeometry() {
    const profile = [
        new THREE.Vector2(0.0, -0.12),
        new THREE.Vector2(0.165, -0.12),
        new THREE.Vector2(0.175, 0.0),
        new THREE.Vector2(0.195, 0.15),
        new THREE.Vector2(0.235, 0.31),
        new THREE.Vector2(0.225, 0.39),
        new THREE.Vector2(0.15, 0.45),
        new THREE.Vector2(0.07, 0.47),
        new THREE.Vector2(0.0, 0.47),
    ];
    return new THREE.LatheGeometry(profile, 40);
}

// Chuteira por extrusão (ExtrudeGeometry) de um perfil lateral 2D.
// No Shape, x = frente do pé e y = altura.
function createBootGeometry() {
    const shape = new THREE.Shape();
    shape.moveTo(-0.08, 0.0);
    shape.lineTo(0.15, 0.0);
    shape.quadraticCurveTo(0.205, 0.0, 0.2, 0.045);
    shape.quadraticCurveTo(0.19, 0.08, 0.08, 0.085);
    shape.lineTo(0.03, 0.12);
    shape.lineTo(-0.075, 0.12);
    shape.quadraticCurveTo(-0.1, 0.06, -0.08, 0.0);

    const depth = 0.11;
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 3,
        curveSegments: 10,
    });

    // Centraliza a extrusão e gira para que o bico aponte para +Z
    geometry.translate(0, 0, -depth / 2);
    geometry.rotateY(-Math.PI / 2);
    return geometry;
}

const sharedGeometries = {
    torso: createTorsoGeometry(),
    boot: createBootGeometry(),
};

// ==================================================
// PLAYER
// Origem do modelo = ponto onde a haste atravessa o peito.
// Frente do modelo = +Z local (a rotação para o time é feita fora).
//
// Hierarquia:
//   player
//    ├─ torso, shorts, neck, rodBolts
//    ├─ head ─ face, hair, ears, nose
//    ├─ leftArm/rightArm (ombro) ─ upperArm, sleeve, elbow ─ forearm, hand
//    └─ leftLeg/rightLeg (quadril) ─ thigh, knee ─ shin(meião), boot, studs
// ==================================================

export function createPlayer(teamKey, number, variant = 0) {
    const team = TEAMS[teamKey];
    const skinColor = SKIN_TONES[variant % SKIN_TONES.length];
    const hairColor = HAIR_COLORS[(variant * 2 + 1) % HAIR_COLORS.length];

    // ---------- materiais ----------
    const jerseyMaterial = new THREE.MeshStandardMaterial({
        map: createJerseyTexture(team.jersey, team.stripe, number),
        roughness: 0.75,
    });
    const sleeveMaterial = new THREE.MeshStandardMaterial({ color: team.jersey, roughness: 0.75 });
    const shortsMaterial = new THREE.MeshStandardMaterial({ color: team.shorts, roughness: 0.8 });
    const sockMaterial = new THREE.MeshStandardMaterial({
        map: createSockTexture(team.sock, team.sockBand),
        roughness: 0.85,
    });
    const skinMaterial = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
    const faceMaterial = new THREE.MeshStandardMaterial({
        map: createFaceTexture(skinColor),
        roughness: 0.6,
    });
    const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });
    const bootMaterial = new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.4 });
    const studMaterial = new THREE.MeshStandardMaterial({ color: "#dddddd", metalness: 0.6, roughness: 0.3 });
    const boltMaterial = new THREE.MeshStandardMaterial({ color: "#b0b6bd", metalness: 0.9, roughness: 0.25 });

    const player = new THREE.Group();
    player.name = `${team.name} #${number}`;

    // ---------- tronco ----------
    const torso = new THREE.Mesh(sharedGeometries.torso, jerseyMaterial);
    torso.scale.set(1, 1, 0.72); // achata o peito (seção elíptica)
    player.add(torso);

    const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.2, 0.24, 32), shortsMaterial);
    shorts.position.y = -0.2;
    shorts.scale.z = 0.78;
    player.add(shorts);

    // Parafusos que prendem o boneco na haste (um de cada lado)
    for (const side of [-1, 1]) {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16), boltMaterial);
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(side * 0.185, 0, 0);
        player.add(bolt);
    }

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 16), skinMaterial);
    neck.position.y = 0.5;
    player.add(neck);

    // ---------- cabeça ----------
    const head = new THREE.Group();
    head.position.y = 0.68;
    player.add(head);

    const face = new THREE.Mesh(new THREE.SphereGeometry(0.17, 40, 24), faceMaterial);
    head.add(face);

    // Cabelo: calota esférica (thetaLength parcial) inclinada para trás
    const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.42),
        hairMaterial
    );
    hair.rotation.x = -0.35;
    head.add(hair);

    for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), skinMaterial);
        ear.scale.set(0.5, 1, 0.8);
        ear.position.set(side * 0.168, 0, 0);
        head.add(ear);
    }

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), skinMaterial);
    nose.scale.set(1, 1.2, 1);
    nose.position.set(0, -0.015, 0.168);
    head.add(nose);

    // ---------- braços ----------
    function createArm(side) {
        const shoulder = new THREE.Group();
        shoulder.position.set(side * 0.25, 0.36, 0);
        shoulder.rotation.z = side * 0.14; // levemente afastado do corpo

        const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.07, 0.13, 16), sleeveMaterial);
        sleeve.position.y = -0.04;
        shoulder.add(sleeve);

        const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.16, 6, 16), skinMaterial);
        upperArm.position.y = -0.13;
        shoulder.add(upperArm);

        const elbow = new THREE.Group();
        elbow.position.y = -0.26;
        elbow.rotation.x = -0.35; // antebraço um pouco à frente
        shoulder.add(elbow);

        const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.047, 0.15, 6, 16), skinMaterial);
        forearm.position.y = -0.11;
        elbow.add(forearm);

        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 16, 12), skinMaterial);
        hand.scale.set(0.85, 1.1, 0.85);
        hand.position.y = -0.24;
        elbow.add(hand);

        player.add(shoulder);
        return { shoulder, elbow };
    }

    // ---------- pernas ----------
    function createLeg(side) {
        const hip = new THREE.Group();
        hip.position.set(side * 0.095, -0.28, 0);

        const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.2, 6, 16), skinMaterial);
        thigh.position.y = -0.16;
        hip.add(thigh);

        const knee = new THREE.Group();
        knee.position.y = -0.33;
        hip.add(knee);

        const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.066, 0.2, 6, 16), sockMaterial);
        shin.position.y = -0.15;
        knee.add(shin);

        const boot = new THREE.Mesh(sharedGeometries.boot, bootMaterial);
        boot.position.y = -0.4;
        knee.add(boot);

        // Travas da chuteira
        for (const [x, z] of [[-0.03, -0.04], [0.03, -0.04], [-0.03, 0.12], [0.03, 0.12]]) {
            const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), studMaterial);
            stud.position.set(x, -0.412, z);
            knee.add(stud);
        }

        player.add(hip);
        return { hip, knee };
    }

    const parts = {
        head,
        leftArm: createArm(1),
        rightArm: createArm(-1),
        leftLeg: createLeg(1),
        rightLeg: createLeg(-1),
    };

    player.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    player.userData = { team: teamKey, number, parts };
    return player;
}
