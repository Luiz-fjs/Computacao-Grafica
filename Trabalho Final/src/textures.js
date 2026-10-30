import * as THREE from "three";

// ==================================================
// HELPERS
// Todas as texturas são geradas proceduralmente em um
// <canvas> 2D e convertidas em THREE.CanvasTexture.
// Assim nenhum arquivo de imagem externo é necessário.
// ==================================================

function createCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return { canvas, ctx: canvas.getContext("2d") };
}

function toTexture(canvas, repeatX = 1, repeatY = 1) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;

    if (repeatX !== 1 || repeatY !== 1) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
    }

    return texture;
}

// Ruído simples de pontinhos para quebrar cores chapadas
function sprinkleNoise(ctx, width, height, count, colors, maxSize = 2) {
    for (let i = 0; i < count; i++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        const size = 1 + Math.random() * maxSize;
        ctx.fillRect(Math.random() * width, Math.random() * height, size, size);
    }
}

// ==================================================
// FIELD (grama listrada + marcações do campo)
// O canvas tem a mesma proporção do campo (12 x 7).
// ==================================================

export function createFieldTexture(fieldLength, fieldWidth) {
    const width = 1536;
    const height = Math.round(width * fieldWidth / fieldLength);
    const { canvas, ctx } = createCanvas(width, height);

    // Faixas de grama alternadas
    const stripes = 12;
    for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#2f8f3a" : "#38a145";
        ctx.fillRect(i * width / stripes, 0, width / stripes + 1, height);
    }
    sprinkleNoise(ctx, width, height, 40000, ["#2a7f33", "#43ad4f", "#2e8a38"], 2);

    // Marcações em branco
    const px = width / fieldLength; // pixels por unidade do mundo
    const margin = 0.25 * px;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 0.06 * px;

    ctx.strokeRect(margin, margin, width - 2 * margin, height - 2 * margin);

    ctx.beginPath();
    ctx.moveTo(width / 2, margin);
    ctx.lineTo(width / 2, height - margin);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 1.0 * px, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 0.1 * px, 0, Math.PI * 2);
    ctx.fill();

    // Grande área e pequena área dos dois lados
    const bigAreaDepth = 1.6 * px;
    const bigAreaWidth = 4.0 * px;
    const smallAreaDepth = 0.7 * px;
    const smallAreaWidth = 2.4 * px;

    for (const side of [0, 1]) {
        const x = side === 0 ? margin : width - margin;
        const dir = side === 0 ? 1 : -1;

        ctx.strokeRect(
            Math.min(x, x + dir * bigAreaDepth), (height - bigAreaWidth) / 2,
            bigAreaDepth, bigAreaWidth
        );
        ctx.strokeRect(
            Math.min(x, x + dir * smallAreaDepth), (height - smallAreaWidth) / 2,
            smallAreaDepth, smallAreaWidth
        );

        // Marca do pênalti
        ctx.beginPath();
        ctx.arc(x + dir * 1.15 * px, height / 2, 0.07 * px, 0, Math.PI * 2);
        ctx.fill();
    }

    return toTexture(canvas);
}

// ==================================================
// WOOD (veios de madeira, usado na mesa e nos pés)
// ==================================================

export function createWoodTexture(baseColor, grainColor, repeatX = 1, repeatY = 1) {
    const { canvas, ctx } = createCanvas(512, 512);

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Veios ondulados horizontais
    ctx.strokeStyle = grainColor;
    for (let i = 0; i < 70; i++) {
        const y = Math.random() * 512;
        const amplitude = 2 + Math.random() * 6;
        const frequency = 0.01 + Math.random() * 0.02;
        ctx.globalAlpha = 0.15 + Math.random() * 0.35;
        ctx.lineWidth = 0.5 + Math.random() * 2.5;
        ctx.beginPath();
        for (let x = 0; x <= 512; x += 8) {
            const yy = y + Math.sin(x * frequency + i) * amplitude;
            x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
    }

    // Alguns "nós" na madeira
    for (let i = 0; i < 3; i++) {
        const cx = Math.random() * 512;
        const cy = Math.random() * 512;
        for (let r = 4; r < 22; r += 4) {
            ctx.globalAlpha = 0.25;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r * 2.2, r, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;

    return toTexture(canvas, repeatX, repeatY);
}

// ==================================================
// FLOOR (tacos de madeira do piso da sala)
// ==================================================

export function createFloorTexture() {
    const { canvas, ctx } = createCanvas(512, 512);
    const plankHeight = 64;
    const tones = ["#8a5a35", "#7d5030", "#94643d", "#865733"];

    for (let row = 0; row < 512 / plankHeight; row++) {
        const offset = (row % 2) * 128;
        for (let col = -1; col < 3; col++) {
            const x = col * 256 + offset;
            ctx.fillStyle = tones[(row + col + 4) % tones.length];
            ctx.fillRect(x, row * plankHeight, 256, plankHeight);
            ctx.strokeStyle = "#4a2e18";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, row * plankHeight, 256, plankHeight);
        }
    }
    sprinkleNoise(ctx, 512, 512, 6000, ["rgba(60,35,15,0.25)", "rgba(200,150,100,0.15)"], 3);

    return toTexture(canvas, 10, 10);
}

// ==================================================
// RUG (tapete embaixo da mesa)
// ==================================================

export function createRugTexture() {
    const { canvas, ctx } = createCanvas(512, 512);

    ctx.fillStyle = "#6b1f2a";
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = "#e0b45a";
    ctx.lineWidth = 10;
    ctx.strokeRect(24, 24, 464, 464);
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, 416, 416);

    // Losangos decorativos
    ctx.fillStyle = "#24314f";
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const cx = 96 + i * 80;
            const cy = 96 + j * 80;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 22);
            ctx.lineTo(cx + 22, cy);
            ctx.lineTo(cx, cy + 22);
            ctx.lineTo(cx - 22, cy);
            ctx.closePath();
            ctx.fill();
        }
    }
    sprinkleNoise(ctx, 512, 512, 15000, ["rgba(0,0,0,0.2)", "rgba(255,255,255,0.06)"], 2);

    return toTexture(canvas);
}

// ==================================================
// JERSEY (camisa com listras, gola, escudo e número)
// u = 0 é a frente do torso (+Z local) e u = 0.5 as costas.
// ==================================================

export function createJerseyTexture(mainColor, stripeColor, number) {
    const { canvas, ctx } = createCanvas(512, 256);

    ctx.fillStyle = mainColor;
    ctx.fillRect(0, 0, 512, 256);

    // Listras verticais
    ctx.fillStyle = stripeColor;
    for (let x = 16; x < 512; x += 64) {
        ctx.fillRect(x, 0, 18, 256);
    }

    // Gola (parte de cima do torso)
    ctx.fillStyle = "#f4f4f4";
    ctx.fillRect(0, 0, 512, 22);

    // Número nas costas (centro do canvas = costas)
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 6;
    ctx.font = "bold 120px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(String(number), 256, 130);
    ctx.fillText(String(number), 256, 130);

    // Escudo no peito (um pouco ao lado da frente, u ≈ 0.08)
    ctx.fillStyle = "#ffd447";
    ctx.beginPath();
    ctx.arc(44, 80, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(44, 80, 10, 0, Math.PI * 2);
    ctx.fill();

    sprinkleNoise(ctx, 512, 256, 3000, ["rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)"], 2);

    return toTexture(canvas);
}

// ==================================================
// SOCKS (meião com faixas horizontais)
// ==================================================

export function createSockTexture(mainColor, bandColor) {
    const { canvas, ctx } = createCanvas(128, 128);

    ctx.fillStyle = mainColor;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = bandColor;
    ctx.fillRect(0, 10, 128, 12);
    ctx.fillRect(0, 30, 128, 6);

    return toTexture(canvas);
}

// ==================================================
// FACE (rosto desenhado no mapa equiretangular da esfera)
// A frente da SphereGeometry (+Z) fica em u = 0.25.
// ==================================================

export function createFaceTexture(skinColor) {
    const { canvas, ctx } = createCanvas(512, 256);

    ctx.fillStyle = skinColor;
    ctx.fillRect(0, 0, 512, 256);

    const cx = 128;

    // Olhos (branco + íris + brilho)
    for (const dx of [-26, 26]) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(cx + dx, 118, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#3b2414";
        ctx.beginPath();
        ctx.arc(cx + dx, 119, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx + dx + 2, 116, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Sobrancelhas
    ctx.strokeStyle = "#2b1a0f";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (const dx of [-26, 26]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx - 12, 101 + (dx < 0 ? 2 : 0));
        ctx.lineTo(cx + dx + 12, 101 + (dx < 0 ? 0 : 2));
        ctx.stroke();
    }

    // Boca sorrindo
    ctx.strokeStyle = "#7a2a24";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, 146, 16, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Bochechas rosadas
    ctx.fillStyle = "rgba(230,110,110,0.25)";
    for (const dx of [-40, 40]) {
        ctx.beginPath();
        ctx.arc(cx + dx, 140, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    return toTexture(canvas);
}

// ==================================================
// GOAL NET (rede com fundo transparente)
// ==================================================

export function createNetTexture() {
    const { canvas, ctx } = createCanvas(256, 256);

    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 3;

    for (let i = 0; i <= 256; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.stroke();
    }

    return toTexture(canvas, 4, 3);
}

// ==================================================
// HANDLE GRIP (manopla emborrachada com anéis)
// ==================================================

export function createGripTexture(color) {
    const { canvas, ctx } = createCanvas(128, 256);

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 256);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    for (let y = 0; y < 256; y += 16) {
        ctx.fillRect(0, y, 128, 5);
    }

    return toTexture(canvas);
}

// ==================================================
// BALLS (uma textura para cada tipo de bola)
// ==================================================

// Bola normal: branca com "gomos" pretos estilo futebol
export function createNormalBallTexture() {
    const { canvas, ctx } = createCanvas(512, 256);

    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, 512, 256);

    function pentagon(cx, cy, radius, stretch) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = -Math.PI / 2 + i * 2 * Math.PI / 5;
            const x = cx + Math.cos(angle) * radius * stretch;
            const y = cy + Math.sin(angle) * radius;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = "#111111";
    // Polos (esticados horizontalmente para compensar a projeção)
    ctx.fillRect(0, 0, 512, 14);
    ctx.fillRect(0, 242, 512, 14);
    for (let i = 0; i < 5; i++) {
        pentagon(51 + i * 102.4, 64, 22, 1.4);
        pentagon(102 + i * 102.4, 192, 22, 1.4);
    }
    for (let i = 0; i < 5; i++) {
        pentagon(i * 102.4, 128, 20, 1.0);
    }

    // Costuras
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    for (let x = 0; x < 512; x += 51.2) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 25, 256);
        ctx.stroke();
    }

    return toTexture(canvas);
}

// Bola pesada: ferro escuro com faixas e rebites
export function createHeavyBallTexture() {
    const { canvas, ctx } = createCanvas(512, 256);

    ctx.fillStyle = "#3a3d42";
    ctx.fillRect(0, 0, 512, 256);
    sprinkleNoise(ctx, 512, 256, 12000, ["#2a2c30", "#4c5057", "#55595f"], 3);

    // Faixas de reforço
    ctx.fillStyle = "#1f2124";
    ctx.fillRect(0, 118, 512, 20);
    for (let x = 0; x < 512; x += 128) {
        ctx.fillRect(x, 0, 14, 256);
    }

    // Rebites
    ctx.fillStyle = "#9aa0a8";
    for (let x = 16; x < 512; x += 32) {
        ctx.beginPath();
        ctx.arc(x, 128, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Marcação de peso
    ctx.fillStyle = "#f2c94c";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("10KG", 64, 80);
    ctx.fillText("10KG", 320, 80);

    return toTexture(canvas);
}

// Bola leve: bola de praia com gomos coloridos
export function createLightBallTexture() {
    const { canvas, ctx } = createCanvas(512, 256);
    const colors = ["#ff4d4d", "#ffffff", "#ffd23f", "#ffffff", "#3fa7ff", "#ffffff"];

    for (let i = 0; i < colors.length; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(i * 512 / colors.length, 0, 512 / colors.length + 1, 256);
    }

    // Tampas brancas nos polos
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 20);
    ctx.fillRect(0, 236, 512, 20);

    return toTexture(canvas);
}
