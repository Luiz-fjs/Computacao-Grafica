import * as THREE from "three";
import { TABLE } from "./table.js";

// ==================================================
// PARAMETERS
// ==================================================

export const BALL_PHYSICS = {
    minSpeed: 1.2, // a bola nunca para: evita travar em cantos
    maxSpeed: 14,
    kickSpeed: 10, // velocidade de um chute perfeito com a bola normal
    minKickAngularVelocity: 3, // rad/s para o contato contar como chute
    maxFootSpeed: 14, // velocidade do pé no auge do chute (normaliza a força)
};

// Área que o boneco ocupa na altura da bola (pernas + chuteiras), no plano XZ
const PLAYER_FOOTPRINT = {
    halfX: 0.11,
    halfZ: 0.17,
    legLength: 1.03, // distância do eixo da haste até a sola
};

// ==================================================
// PLAYER CONTACT
// A haste gira em torno de Z. O ponto da perna que fica na altura do
// centro da bola está a "reach" do eixo, ao longo de (sen θ, -cos θ).
// Se o pé está levantado demais, a bola passa por baixo.
// ==================================================

function getFootContact(line, ballRadius) {
    const theta = line.rotation.z;
    const cos = Math.cos(theta);
    if (cos <= 0) return null;

    const drop = TABLE.rodHeight - ballRadius; // altura do eixo até o centro da bola
    const reach = drop / cos;
    if (reach > PLAYER_FOOTPRINT.legLength) return null;

    return {
        x: line.position.x + Math.sin(theta) * reach,
        // Velocidade tangencial horizontal do ponto de contato: ω × r
        footVelocityX: line.userData.angularVelocity * drop,
    };
}

const normal = new THREE.Vector3();
const playerVelocity = new THREE.Vector3();
const relativeVelocity = new THREE.Vector3();

function collideWithPlayers(ball, velocity, rodLines) {
    const { radius, mass, bounciness } = ball.userData;
    const { halfX, halfZ } = PLAYER_FOOTPRINT;

    for (const line of rodLines) {
        const contact = getFootContact(line, radius);
        if (!contact) continue;

        const data = line.userData;
        const direction = data.team === "red" ? 1 : -1;

        for (const player of data.players) {
            const playerZ = line.position.z + player.position.z;
            const dx = ball.position.x - contact.x;
            const dz = ball.position.z - playerZ;

            // Círculo (bola) contra retângulo (pegada do boneco) no plano XZ
            const nx = dx - THREE.MathUtils.clamp(dx, -halfX, halfX);
            const nz = dz - THREE.MathUtils.clamp(dz, -halfZ, halfZ);
            const distance = Math.hypot(nx, nz);
            if (distance >= radius) continue;

            if (distance > 1e-6) {
                normal.set(nx / distance, 0, nz / distance);
                ball.position.x += normal.x * (radius - distance);
                ball.position.z += normal.z * (radius - distance);
            } else {
                // Centro da bola dentro do boneco: empurra para fora em X
                normal.set(Math.sign(dx) || direction, 0, 0);
                ball.position.x = contact.x + normal.x * (halfX + radius);
            }

            const isKick = data.angularVelocity * direction > BALL_PHYSICS.minKickAngularVelocity;

            if (isKick) {
                // Chute: quanto mais perto do eixo do boneco (dz ≈ 0), mais forte
                // e reto. Longe do eixo é um chute de raspão: fraco e desviado.
                const maxOffset = halfZ + radius;
                const centerFactor = 1 - Math.min(Math.abs(dz) / maxOffset, 1);
                const strength = 0.3 + 0.7 * centerFactor;
                const swing = Math.min(Math.abs(contact.footVelocityX) / BALL_PHYSICS.maxFootSpeed, 1);
                const speed = BALL_PHYSICS.kickSpeed * strength * (0.5 + 0.5 * swing) / Math.sqrt(mass);

                const deflection = Math.sign(dz) * (1 - centerFactor) * 0.9;
                velocity.set(direction, 0, deflection).normalize().multiplyScalar(speed);
                velocity.z += data.slideVelocity * 0.4; // puxar a haste dá efeito
            } else {
                // Rebote: reflete a velocidade relativa ao boneco em movimento
                playerVelocity.set(contact.footVelocityX, 0, data.slideVelocity);
                relativeVelocity.subVectors(velocity, playerVelocity);
                const approach = relativeVelocity.dot(normal);
                if (approach < 0) {
                    relativeVelocity.addScaledVector(normal, -(1 + bounciness) * approach);
                    velocity.addVectors(playerVelocity, relativeVelocity);
                }
            }
        }
    }
}

// ==================================================
// WALLS + GOALS
// ==================================================

function collideWithWalls(ball, velocity, onGoal) {
    const { radius, bounciness } = ball.userData;
    const halfLength = TABLE.fieldLength / 2;
    const halfWidth = TABLE.fieldWidth / 2;

    if (Math.abs(ball.position.z) > halfWidth - radius) {
        ball.position.z = Math.sign(ball.position.z) * (halfWidth - radius);
        velocity.z = -velocity.z * bounciness;
    }

    if (Math.abs(ball.position.x) > halfLength - radius) {
        const insideGoalMouth = Math.abs(ball.position.z) < TABLE.goalWidth / 2 - radius;
        if (insideGoalMouth) {
            if (Math.abs(ball.position.x) > halfLength + radius) {
                onGoal(ball.position.x < 0 ? "blue" : "red");
                return true;
            }
        } else {
            ball.position.x = Math.sign(ball.position.x) * (halfLength - radius);
            velocity.x = -velocity.x * bounciness;
        }
    }
    return false;
}

// Garante velocidade mínima (nunca zero) e máxima
function clampSpeed(velocity) {
    const speed = velocity.length();
    if (speed < 1e-4) {
        const angle = Math.random() * Math.PI * 2;
        velocity.set(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(BALL_PHYSICS.minSpeed);
    } else if (speed < BALL_PHYSICS.minSpeed) {
        velocity.multiplyScalar(BALL_PHYSICS.minSpeed / speed);
    } else if (speed > BALL_PHYSICS.maxSpeed) {
        velocity.multiplyScalar(BALL_PHYSICS.maxSpeed / speed);
    }
}

// ==================================================
// UPDATE
// Subpassos evitam que a bola rápida atravesse um boneco num único frame.
// ==================================================

export function updateBall(ball, velocity, rodLines, dt, onGoal) {
    const { radius, friction } = ball.userData;
    const steps = Math.min(8, Math.max(1, Math.ceil((velocity.length() * dt) / (radius * 0.5))));
    const stepDt = dt / steps;

    for (let i = 0; i < steps; i++) {
        ball.position.addScaledVector(velocity, stepDt);
        velocity.multiplyScalar(Math.exp(-friction * 0.5 * stepDt));

        collideWithPlayers(ball, velocity, rodLines);
        if (collideWithWalls(ball, velocity, onGoal)) return;
        clampSpeed(velocity);
    }

    ball.position.y = radius;

    // Rolamento visual: gira em torno do eixo perpendicular ao movimento
    ball.rotation.z -= (velocity.x * dt) / radius;
    ball.rotation.x += (velocity.z * dt) / radius;
}
