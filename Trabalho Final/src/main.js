import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createTable, TABLE } from "./table.js";
import { createBalls, createBallStand, BALL_TYPES } from "./balls.js";
import { createRoom, createLights, LAMP_LAYER } from "./environment.js";
import { createWoodTexture } from "./textures.js";

// ==================================================
// RENDERER + SCENE
// ==================================================

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#1d1a22");
scene.fog = new THREE.Fog("#1d1a22", 30, 70);

// Mapa de ambiente usado só nos materiais metálicos (reflexo das hastes)
const pmrem = new THREE.PMREMGenerator(renderer);
const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ==================================================
// OBJECTS
// ==================================================

const { table, rodLines } = createTable(envMap);
scene.add(table);
scene.add(createRoom());
const lights = createLights(scene);

const standWood = new THREE.MeshStandardMaterial({ map: createWoodTexture("#6b3f1f", "#3a200d"), roughness: 0.55 });
const standMetal = new THREE.MeshStandardMaterial({ color: "#c9ced6", metalness: 0.95, roughness: 0.22, envMap });
const ballStand = createBallStand(standWood, standMetal);
scene.add(ballStand);

const balls = createBalls();
Object.values(balls).forEach((ball) => scene.add(ball));

const ballOrder = Object.keys(BALL_TYPES);
let activeBallIndex = 0;

// Bola ativa no centro do campo; as outras ficam no expositor
function placeBalls() {
    let slot = 0;
    ballOrder.forEach((type, index) => {
        const ball = balls[type];
        if (index === activeBallIndex) {
            ball.position.set(0, ball.userData.radius, 0);
        } else {
            const slotPosition = ballStand.userData.slots[slot++].clone();
            ball.position.copy(ballStand.localToWorld(slotPosition));
            ball.position.y += ball.userData.radius - 0.05;
        }
    });
}

// Eixos e grade para conferir posições/escalas (tecla G)
const helpers = new THREE.Group();
helpers.add(new THREE.AxesHelper(4));
const grid = new THREE.GridHelper(TABLE.fieldLength, TABLE.fieldLength, "#ffffff", "#ffffff");
grid.position.y = 0.02;
grid.material.opacity = 0.25;
grid.material.transparent = true;
helpers.add(grid);
helpers.visible = false;
scene.add(helpers);

// ==================================================
// CAMERA (uma única PerspectiveCamera que transita entre poses)
//   firstHalf  -> lateral elevada, lado das manoplas vermelhas (+Z)
//   secondHalf -> mesma câmera espelhada, lado das manoplas azuis (-Z)
//   topDown    -> power-up "2D": vista de cima, o jogo parece um Pong
// ==================================================

const CAMERA_POSES = {
    firstHalf: {
        label: "1st half",
        position: new THREE.Vector3(0, 11, 11.5),
        target: new THREE.Vector3(0, -0.5, 0.4),
        fov: 50,
    },
    secondHalf: {
        label: "2nd half (mirrored)",
        position: new THREE.Vector3(0, 11, -11.5),
        target: new THREE.Vector3(0, -0.5, -0.4),
        fov: 50,
    },
    topDown: {
        label: "2D power-up (top view)",
        // O pequeno deslocamento em Z mantém a orientação de tela do tempo atual
        position: new THREE.Vector3(0, 17, 0.01),
        target: new THREE.Vector3(0, 0, 0),
        fov: 45,
    },
};

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.layers.enable(LAMP_LAYER);
const cameraTarget = new THREE.Vector3();
let cameraPose = null;

function setCameraPose(name, instant = false) {
    cameraPose = CAMERA_POSES[name];
    const pose = cameraPose;

    // A vista de cima segue o lado do tempo atual
    if (name === "topDown") pose.position.z = match.half === 1 ? 0.01 : -0.01;

    // Luminárias escondidas na vista de cima para não tapar o campo
    if (name === "topDown") camera.layers.disable(LAMP_LAYER);
    else camera.layers.enable(LAMP_LAYER);

    if (instant) {
        camera.position.copy(pose.position);
        cameraTarget.copy(pose.target);
        camera.fov = pose.fov;
        camera.updateProjectionMatrix();
    }
}

// Interpolação suave da câmera até a pose atual
function updateCamera(dt) {
    const t = 1 - Math.exp(-4 * dt);
    camera.position.lerp(cameraPose.position, t);
    cameraTarget.lerp(cameraPose.target, t);
    camera.fov += (cameraPose.fov - camera.fov) * t;
    camera.updateProjectionMatrix();
    camera.lookAt(cameraTarget);
}

// ==================================================
// MATCH STATE
// ==================================================

const HALF_DURATION = 120; // segundos por tempo
const POWER_UP_DURATION = 8; // segundos de visão 2D

const match = {
    half: 1,
    clock: HALF_DURATION,
    score: { red: 0, blue: 0 },
    powerUpTime: 0,
};

const ballVelocity = new THREE.Vector3();

const scoreCounters = {
    red: table.getObjectByName("Red score counter"),
    blue: table.getObjectByName("Blue score counter"),
};

// Contas do ábaco: as marcadas deslizam para a ponta direita do fio
function updateScoreCounters() {
    for (const team of ["red", "blue"]) {
        const beads = scoreCounters[team].userData.beads;
        beads.forEach((bead, i) => {
            const scoredSlot = beads.length - 1 - i;
            bead.position.x = scoredSlot < match.score[team]
                ? 1.0 - scoredSlot * 0.24
                : -1.0 + i * 0.24;
        });
    }
}

// Saída de bola: centro do campo, lado sorteado (+X ou -X) e leve ângulo
function kickOff() {
    const ball = balls[ballOrder[activeBallIndex]];
    ball.position.set(0, ball.userData.radius, 0);

    const side = Math.random() < 0.5 ? -1 : 1;
    const angle = (Math.random() - 0.5) * 0.6;
    const speed = 3 / Math.sqrt(ball.userData.mass); // bola leve sai mais rápido
    ballVelocity.set(side * Math.cos(angle) * speed, 0, Math.sin(angle) * speed);
}

function startHalf(half) {
    match.half = half;
    match.clock = HALF_DURATION;
    match.powerUpTime = 0;
    setCameraPose(half === 1 ? "firstHalf" : "secondHalf");
    kickOff();
    updateHud();
}

function activatePowerUp() {
    match.powerUpTime = POWER_UP_DURATION;
    setCameraPose("topDown");
}

// ==================================================
// BALL MOVEMENT (prévia: atrito + quique nas paredes + gol)
// Colisão com os bonecos ainda não implementada.
// ==================================================

function updateBall(dt) {
    const ball = balls[ballOrder[activeBallIndex]];
    const { radius, friction, bounciness } = ball.userData;
    const halfLength = TABLE.fieldLength / 2;
    const halfWidth = TABLE.fieldWidth / 2;

    ball.position.addScaledVector(ballVelocity, dt);
    ballVelocity.multiplyScalar(Math.exp(-friction * 0.5 * dt));

    // Rolamento visual: gira em torno do eixo perpendicular ao movimento
    ball.rotation.z -= (ballVelocity.x * dt) / radius;
    ball.rotation.x += (ballVelocity.z * dt) / radius;

    // Paredes laterais
    if (Math.abs(ball.position.z) > halfWidth - radius) {
        ball.position.z = Math.sign(ball.position.z) * (halfWidth - radius);
        ballVelocity.z *= -bounciness;
    }

    // Fundo: gol se estiver dentro da boca do gol, senão quica
    if (Math.abs(ball.position.x) > halfLength - radius) {
        const insideGoalMouth = Math.abs(ball.position.z) < TABLE.goalWidth / 2 - radius;
        if (insideGoalMouth) {
            if (Math.abs(ball.position.x) > halfLength + radius) {
                const scorer = ball.position.x < 0 ? "blue" : "red";
                match.score[scorer] = Math.min(match.score[scorer] + 1, 6);
                updateScoreCounters();
                kickOff();
                updateHud();
            }
        } else {
            ball.position.x = Math.sign(ball.position.x) * (halfLength - radius);
            ballVelocity.x *= -bounciness;
        }
    }
}

// ==================================================
// INPUT
// As duas hastes de cada time se movem juntas.
//   Vermelho: W/S desliza, C chuta
//   Azul:     ↑/↓ desliza, J chuta
// "Para cima" é relativo à tela: no 2º tempo a câmera inverte o eixo Z.
// ==================================================

const pressedKeys = new Set();
const teamLines = {
    red: rodLines.filter((line) => line.userData.team === "red"),
    blue: rodLines.filter((line) => line.userData.team === "blue"),
};

const CONTROLS = {
    red: { up: "w", down: "s", kick: "c" },
    blue: { up: "arrowup", down: "arrowdown", kick: "j" },
};

function kick(team) {
    teamLines[team].forEach((line) => {
        if (line.userData.kickTime < 0) line.userData.kickTime = 0;
    });
}

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    pressedKeys.add(key);

    if (key === CONTROLS.red.kick) kick("red");
    if (key === CONTROLS.blue.kick) kick("blue");
    if (key.startsWith("arrow")) event.preventDefault();

    // Teclas de depuração desta etapa
    if (key === "g") helpers.visible = !helpers.visible;
    if (key === "p") activatePowerUp();
    if (key === "t") startHalf(match.half === 1 ? 2 : 1);
    if (key === "r") kickOff();
    if (key === "b") {
        activeBallIndex = (activeBallIndex + 1) % ballOrder.length;
        placeBalls();
        kickOff();
        updateHud();
    }
});
window.addEventListener("keyup", (event) => pressedKeys.delete(event.key.toLowerCase()));

function updateRods(dt) {
    const slideSpeed = 4;
    const screenUp = match.half === 1 ? -1 : 1; // sentido de Z que aparece "para cima"

    for (const team of ["red", "blue"]) {
        const controls = CONTROLS[team];
        let input = 0;
        if (pressedKeys.has(controls.up)) input += screenUp;
        if (pressedKeys.has(controls.down)) input -= screenUp;

        teamLines[team].forEach((line) => {
            const data = line.userData;
            line.position.z = THREE.MathUtils.clamp(line.position.z + input * slideSpeed * dt, data.minZ, data.maxZ);
        });
    }
}

// ==================================================
// HUD
// ==================================================

const hud = document.getElementById("hud-status");

function formatClock(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function updateHud() {
    const ball = BALL_TYPES[ballOrder[activeBallIndex]];
    const powerUp = match.powerUpTime > 0
        ? `<div class="power-up">2D power-up: ${Math.ceil(match.powerUpTime)}s</div>`
        : "";
    hud.innerHTML = `
        <div class="score">
            <span class="red">RED ${match.score.red}</span> × <span class="blue">${match.score.blue} BLUE</span>
        </div>
        <div>Half: <b>${match.half}</b> · Clock: <b>${formatClock(match.clock)}</b></div>
        <div>Camera: <b>${cameraPose.label}</b></div>
        <div>Ball on field: <b>${ball.label}</b></div>
        ${powerUp}
    `;
}

// ==================================================
// ANIMATION
// ==================================================

// Curva do chute: recua, gira para frente rápido e volta ao repouso
function kickAngle(t) {
    if (t < 0.1) return -0.7 * (t / 0.1);
    if (t < 0.22) return -0.7 + 2.1 * ((t - 0.1) / 0.12);
    if (t < 0.5) return 1.4 * (1 - (t - 0.22) / 0.28);
    return 0;
}

const clock = new THREE.Clock();
let hudTimer = 0;

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    // Relógio da partida: ao fim do 1º tempo troca para o 2º
    match.clock -= dt;
    if (match.clock <= 0 && match.half === 1) startHalf(2);

    // Power-up 2D com duração limitada
    if (match.powerUpTime > 0) {
        match.powerUpTime -= dt;
        if (match.powerUpTime <= 0) setCameraPose(match.half === 1 ? "firstHalf" : "secondHalf");
    }

    updateRods(dt);
    updateBall(dt);

    rodLines.forEach((line) => {
        const data = line.userData;
        const direction = data.team === "red" ? 1 : -1;

        if (data.kickTime >= 0) {
            data.kickTime += dt;
            line.rotation.z = direction * kickAngle(data.kickTime);
            if (data.kickTime > 0.5) data.kickTime = -1;
        }

        // Pequena animação ociosa: braços balançando e cabeça olhando ao redor
        data.players.forEach((player, i) => {
            const { parts } = player.userData;
            const phase = time * 2 + i + line.position.x;
            parts.leftArm.shoulder.rotation.x = Math.sin(phase) * 0.12;
            parts.rightArm.shoulder.rotation.x = -Math.sin(phase) * 0.12;
            parts.head.rotation.y = Math.sin(phase * 0.5) * 0.25;
        });
    });

    updateCamera(dt);

    // HUD do relógio atualizado 4x por segundo
    hudTimer += dt;
    if (hudTimer > 0.25) {
        hudTimer = 0;
        updateHud();
    }

    renderer.render(scene, camera);
}

// ==================================================
// START
// ==================================================

placeBalls();
setCameraPose("firstHalf", true);
startHalf(1); // sorteia o lado da saída de bola
animate();

// ==================================================
// RESIZE
// ==================================================

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Exposto para inspeção no console do navegador
window.totobolim = { scene, camera, rodLines, balls, lights, match };
