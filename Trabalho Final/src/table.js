import * as THREE from "three";
import { createPlayer, TEAMS } from "./player.js";
import {
    createFieldTexture,
    createWoodTexture,
    createNetTexture,
    createGripTexture,
} from "./textures.js";

// ==================================================
// DIMENSIONS (unidades do mundo)
// O campo fica no plano XZ, com o tampo em y = 0.
// Eixo X = comprimento (gol vermelho em -X, gol azul em +X).
// Eixo Z = largura (direção das hastes).
// ==================================================

export const TABLE = {
    fieldLength: 12,
    fieldWidth: 7,
    wallHeight: 1.4,
    wallThickness: 0.3,
    goalWidth: 2.2,
    goalHeight: 0.85,
    goalDepth: 0.8,
    rodHeight: 1.05,
    rodRadius: 0.055,
    cabinetHeight: 1.0,
    floorY: -3.6,
};

// Linhas de jogadores intercaladas como num pebolim real:
// defesa (3) perto do próprio gol e ataque (2) mais perto do centro.
export const ROD_LINES = [
    { team: "red", role: "defense", x: -4.5, zSlots: [-2.2, 0, 2.2] },
    { team: "blue", role: "attack", x: -1.5, zSlots: [-1.4, 1.4] },
    { team: "red", role: "attack", x: 1.5, zSlots: [-1.4, 1.4] },
    { team: "blue", role: "defense", x: 4.5, zSlots: [-2.2, 0, 2.2] },
];

function enableShadows(object) {
    object.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

// ==================================================
// TABLE (mesa completa)
// ==================================================

export function createTable(envMap) {
    const table = new THREE.Group();
    table.name = "Table";

    const {
        fieldLength: L, fieldWidth: W, wallHeight, wallThickness: T,
        goalWidth, goalHeight, cabinetHeight, floorY,
    } = TABLE;

    // ---------- materiais ----------
    const woodMaterial = new THREE.MeshStandardMaterial({
        map: createWoodTexture("#6b3f1f", "#3a200d", 2, 1),
        roughness: 0.55,
    });
    const darkWoodMaterial = new THREE.MeshStandardMaterial({
        map: createWoodTexture("#3b2414", "#1c0f06", 1, 2),
        roughness: 0.6,
    });
    const fieldMaterial = new THREE.MeshStandardMaterial({
        map: createFieldTexture(L, W),
        roughness: 0.95,
    });
    const metalMaterial = new THREE.MeshStandardMaterial({
        color: "#c9ced6",
        metalness: 0.95,
        roughness: 0.22,
        envMap,
    });
    const blackPlastic = new THREE.MeshStandardMaterial({ color: "#1b1b1b", roughness: 0.5 });
    const netMaterial = new THREE.MeshStandardMaterial({
        map: createNetTexture(),
        transparent: true,
        alphaTest: 0.3,
        side: THREE.DoubleSide,
        roughness: 1,
    });

    // ---------- campo ----------
    const field = new THREE.Mesh(new THREE.PlaneGeometry(L, W), fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.receiveShadow = true;
    table.add(field);

    // ---------- gabinete (caixa da mesa abaixo do campo) ----------
    const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(L + 2 * T + 1.6, cabinetHeight, W + 2 * T),
        woodMaterial
    );
    cabinet.position.y = -cabinetHeight / 2 - 0.01;
    table.add(cabinet);

    // ---------- paredes laterais (ao longo de X) ----------
    for (const side of [-1, 1]) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(L + 2 * T, wallHeight, T), woodMaterial);
        wall.position.set(0, wallHeight / 2, side * (W / 2 + T / 2));
        table.add(wall);

        // Friso escuro no topo da parede
        const trim = new THREE.Mesh(new THREE.BoxGeometry(L + 2 * T + 0.1, 0.08, T + 0.1), darkWoodMaterial);
        trim.position.set(0, wallHeight + 0.04, side * (W / 2 + T / 2));
        table.add(trim);
    }

    // ---------- paredes do fundo com abertura do gol ----------
    for (const side of [-1, 1]) {
        const x = side * (L / 2 + T / 2);
        const sidePieceWidth = (W - goalWidth) / 2;

        for (const zSide of [-1, 1]) {
            const piece = new THREE.Mesh(new THREE.BoxGeometry(T, wallHeight, sidePieceWidth), woodMaterial);
            piece.position.set(x, wallHeight / 2, zSide * (goalWidth / 2 + sidePieceWidth / 2));
            table.add(piece);
        }

        const lintel = new THREE.Mesh(
            new THREE.BoxGeometry(T, wallHeight - goalHeight, goalWidth),
            woodMaterial
        );
        lintel.position.set(x, goalHeight + (wallHeight - goalHeight) / 2, 0);
        table.add(lintel);

        const trim = new THREE.Mesh(new THREE.BoxGeometry(T + 0.1, 0.08, W + 2 * T + 0.1), darkWoodMaterial);
        trim.position.set(x, wallHeight + 0.04, 0);
        table.add(trim);

        table.add(createGoal(side, metalMaterial, netMaterial, darkWoodMaterial));
    }

    // ---------- rampas de canto (obstáculos que devolvem a bola) ----------
    const rampShape = new THREE.Shape();
    rampShape.moveTo(0, 0);
    rampShape.lineTo(0.7, 0);
    rampShape.lineTo(0, 0.7);
    rampShape.closePath();
    const rampGeometry = new THREE.ExtrudeGeometry(rampShape, { depth: 0.18, bevelEnabled: false });
    rampGeometry.rotateX(Math.PI / 2); // deita o triângulo no plano XZ
    rampGeometry.translate(0, 0.18, 0);

    for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
            // O triângulo nasce no quadrante (+X, +Z); gira em Y para apontar
            // para dentro do campo a partir de cada canto
            const inwardX = -sx;
            const inwardZ = -sz;
            const angle = inwardX > 0 ? (inwardZ > 0 ? 0 : Math.PI / 2) : (inwardZ > 0 ? -Math.PI / 2 : Math.PI);
            const ramp = new THREE.Mesh(rampGeometry, darkWoodMaterial);
            ramp.position.set(sx * L / 2, 0, sz * W / 2);
            ramp.rotation.y = angle;
            table.add(ramp);
        }
    }

    // ---------- pés da mesa ----------
    const legHeight = -cabinetHeight - floorY;
    for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.55, legHeight, 0.55), darkWoodMaterial);
            leg.position.set(sx * (L / 2 + 0.6), floorY + legHeight / 2, sz * (W / 2));
            table.add(leg);

            // Sapata niveladora
            const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.12, 20), blackPlastic);
            foot.position.set(sx * (L / 2 + 0.6), floorY + 0.06, sz * (W / 2));
            table.add(foot);
        }
        // Travessa entre os pés
        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, W), darkWoodMaterial);
        brace.position.set(sx * (L / 2 + 0.6), floorY + 0.8, 0);
        table.add(brace);
    }
    const longBrace = new THREE.Mesh(new THREE.BoxGeometry(L + 1.2, 0.3, 0.3), darkWoodMaterial);
    longBrace.position.set(0, floorY + 0.8, 0);
    table.add(longBrace);

    // ---------- marcadores de gols (ábaco) ----------
    table.add(createScoreCounter("red", -L / 2 + 1.2, W / 2 + T / 2, metalMaterial));
    table.add(createScoreCounter("blue", L / 2 - 1.2, -(W / 2 + T / 2), metalMaterial));

    enableShadows(table);
    field.castShadow = false;
    table.traverse((child) => {
        if (child.material === netMaterial) child.castShadow = false;
    });

    // ---------- hastes com os jogadores ----------
    const rodLines = ROD_LINES.map((line) => createRodLine(line, metalMaterial, blackPlastic));
    rodLines.forEach((rodLine) => table.add(rodLine));

    return { table, rodLines };
}

// ==================================================
// GOAL (trave metálica + caixa de rede atrás da abertura)
// ==================================================

function createGoal(side, metalMaterial, netMaterial, darkWoodMaterial) {
    const { fieldLength: L, wallThickness: T, goalWidth, goalHeight, goalDepth } = TABLE;
    const goal = new THREE.Group();
    goal.name = side < 0 ? "Red goal" : "Blue goal";

    const frontX = side * (L / 2);
    const backX = side * (L / 2 + T + goalDepth);
    const postRadius = 0.05;

    // Traves verticais
    for (const z of [-goalWidth / 2, goalWidth / 2]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 16), metalMaterial);
        post.position.set(frontX, goalHeight / 2, z);
        goal.add(post);
    }

    // Travessão
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 16), metalMaterial);
    crossbar.rotation.x = Math.PI / 2;
    crossbar.position.set(frontX, goalHeight, 0);
    goal.add(crossbar);

    // Piso de madeira dentro do gol
    const floor = new THREE.Mesh(new THREE.BoxGeometry(T + goalDepth, 0.05, goalWidth), darkWoodMaterial);
    floor.position.set((frontX + backX) / 2, -0.025, 0);
    goal.add(floor);

    // Rede: fundo, teto e laterais
    const netBack = new THREE.Mesh(new THREE.PlaneGeometry(goalWidth, goalHeight), netMaterial);
    netBack.rotation.y = Math.PI / 2;
    netBack.position.set(backX, goalHeight / 2, 0);
    goal.add(netBack);

    const netTop = new THREE.Mesh(new THREE.PlaneGeometry(T + goalDepth, goalWidth), netMaterial);
    netTop.rotation.x = Math.PI / 2;
    netTop.position.set((frontX + backX) / 2, goalHeight, 0);
    goal.add(netTop);

    for (const z of [-goalWidth / 2, goalWidth / 2]) {
        const netSide = new THREE.Mesh(new THREE.PlaneGeometry(T + goalDepth, goalHeight), netMaterial);
        netSide.position.set((frontX + backX) / 2, goalHeight / 2, z);
        goal.add(netSide);
    }

    return goal;
}

// ==================================================
// SCORE COUNTER (ábaco com 6 contas = gols para vencer)
// ==================================================

function createScoreCounter(teamKey, x, z, metalMaterial) {
    const counter = new THREE.Group();
    counter.name = `${TEAMS[teamKey].name} score counter`;
    counter.position.set(x, TABLE.wallHeight + 0.2, z);

    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8), metalMaterial);
    wire.rotation.z = Math.PI / 2;
    counter.add(wire);

    const beadMaterial = new THREE.MeshStandardMaterial({ color: TEAMS[teamKey].jersey, roughness: 0.35 });
    const beads = [];
    for (let i = 0; i < 6; i++) {
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), beadMaterial);
        bead.scale.set(0.7, 1, 1);
        bead.position.x = -1.0 + i * 0.24;
        counter.add(bead);
        beads.push(bead);
    }

    // Suportes nas pontas
    for (const sx of [-1.1, 1.1]) {
        const support = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.06), metalMaterial);
        support.position.set(sx, -0.1, 0);
        counter.add(support);
    }

    counter.userData.beads = beads;
    return counter;
}

// ==================================================
// ROD LINE (haste + manopla + para-choques + jogadores)
// O grupo inteiro desliza em Z e gira em torno de Z (chute).
// ==================================================

function createRodLine(line, metalMaterial, blackPlastic) {
    const { fieldWidth: W, wallThickness: T, rodHeight, rodRadius } = TABLE;
    const team = TEAMS[line.team];

    const rodLine = new THREE.Group();
    rodLine.name = `${team.name} ${line.role} rod`;
    rodLine.position.set(line.x, rodHeight, 0);

    // A manopla fica do lado do time: vermelho em +Z, azul em -Z
    const handleSide = line.team === "red" ? 1 : -1;
    const rodLength = W + 2 * T + 2.6;
    const rodOffset = handleSide * 0.7;

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(rodRadius, rodRadius, rodLength, 20), metalMaterial);
    rod.rotation.x = Math.PI / 2; // cilindro nasce em Y; deita ao longo de Z
    rod.position.z = rodOffset;
    rodLine.add(rod);

    // Manopla emborrachada
    const grip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.12, 0.9, 24),
        new THREE.MeshStandardMaterial({ map: createGripTexture(team.handle), roughness: 0.8 })
    );
    grip.rotation.x = Math.PI / 2;
    grip.position.z = rodOffset + handleSide * (rodLength / 2 - 0.45);
    rodLine.add(grip);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 12), blackPlastic);
    cap.scale.set(1, 1, 0.5);
    cap.position.z = rodOffset + handleSide * rodLength / 2;
    rodLine.add(cap);

    // Para-choques de borracha (toro) perto das paredes internas
    const minSlot = Math.min(...line.zSlots);
    const maxSlot = Math.max(...line.zSlots);
    const travel = W / 2 - 0.35 - maxSlot; // folga até a parede
    for (const z of [minSlot - travel - 0.05, maxSlot + travel + 0.05]) {
        const bumper = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.035, 10, 20), blackPlastic);
        bumper.position.z = z;
        rodLine.add(bumper);
    }

    // Jogadores
    const players = line.zSlots.map((z, i) => {
        const number = line.role === "defense" ? 2 + i : 9 + i;
        const variant = (line.team === "red" ? 0 : 3) + i + (line.role === "attack" ? 2 : 0);
        const player = createPlayer(line.team, number, variant);
        player.position.z = z;
        // Modelo nasce olhando para +Z; gira para olhar ao gol adversário
        player.rotation.y = team.direction * Math.PI / 2;
        rodLine.add(player);
        return player;
    });

    enableShadows(rodLine);

    rodLine.userData = {
        team: line.team,
        role: line.role,
        players,
        minZ: -travel,
        maxZ: travel,
        kickTime: -1,
    };
    return rodLine;
}
