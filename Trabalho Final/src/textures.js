import * as THREE from "three";

// ==================================================
// HELPERS
// A maior parte das texturas é gerada proceduralmente em um <canvas> 2D
// e convertida em THREE.CanvasTexture. As fotográficas (PBR do ambientCG)
// são carregadas de arquivos por loadImageTextureSet.
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
// IMAGE TEXTURE SET (PBR do ambientCG: cor, normal e rugosidade)
// basePath sem sufixo, ex.: "assets/textures/grass005/Grass005_1K-JPG".
// Só o mapa de cor fica em sRGB; normal/rugosidade são dados lineares.
// ==================================================

const imageLoader = new THREE.TextureLoader();

export function loadImageTextureSet(basePath, maps, repeatX = 1, repeatY = 1) {
    const set = {};
    for (const [slot, suffix] of Object.entries(maps)) {
        const texture = imageLoader.load(`${basePath}_${suffix}.jpg`);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.anisotropy = 8;
        if (slot === "map") texture.colorSpace = THREE.SRGBColorSpace;
        set[slot] = texture;
    }
    return set;
}

// Mapas usados pelas texturas do ambientCG neste projeto
export const PBR_MAPS = { map: "Color", normalMap: "NormalGL", roughnessMap: "Roughness" };

// ==================================================
// FIELD MARKINGS (camada transparente sobre a grama fotográfica)
// Faixas de corte translúcidas + linhas brancas do campo. O canvas tem a
// mesma proporção do campo (12 x 7), então cobre o plano sem esticar.
// ==================================================

export function createFieldMarkingsTexture(fieldLength, fieldWidth) {
    const width = 1536;
    const height = Math.round(width * fieldWidth / fieldLength);
    const { canvas, ctx } = createCanvas(width, height);

    // Faixas de corte da grama: clareiam/escurecem levemente a foto embaixo
    const stripes = 12;
    for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
        ctx.fillRect(i * width / stripes, 0, width / stripes + 1, height);
    }

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
// WOOD (fotográficas do ambientCG, CC0)
//   light: Wood026, madeira clara da mesa e do expositor
//   dark:  Wood051, madeira escura dos pés, frisos, rampas e piso do gol
// As peças usam UVs em unidades do mundo (uv.js), então repeat = 1 / tamanho
// da repetição deixa a madeira na mesma escala em todas elas.
// ==================================================

export const WOOD_TEXTURES = {
    light: "assets/textures/wood026/Wood026_1K-JPG",
    dark: "assets/textures/wood051/Wood051_1K-JPG",
};
export const WOOD_TILE_SIZE = 2.5;

export function loadWoodTextures(kind) {
    return loadImageTextureSet(WOOD_TEXTURES[kind], PBR_MAPS, 1 / WOOD_TILE_SIZE, 1 / WOOD_TILE_SIZE);
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

// ==================================================
// UV CHECKER (grade de depuração do mapeamento, tecla U)
// Colunas A–H crescem com U (esquerda → direita) e linhas 1–8 crescem
// com V (baixo → cima). Com flipY, a base do canvas corresponde a v = 0.
// A cor muda com U (matiz) e com V (claridade), então dá para ler a
// orientação e perceber esticamentos em qualquer parte do modelo.
// ==================================================

export function createUvCheckerTexture() {
    const size = 512;
    const cells = 8;
    const cell = size / cells;
    const { canvas, ctx } = createCanvas(size, size);

    for (let col = 0; col < cells; col++) {
        for (let row = 0; row < cells; row++) {
            const hue = (col / cells) * 300;
            const lightness = 30 + (row / (cells - 1)) * 40;
            const dark = (col + row) % 2 === 0;
            ctx.fillStyle = `hsl(${hue}, 70%, ${dark ? lightness - 12 : lightness}%)`;
            const y = size - (row + 1) * cell; // linha 1 na base (v = 0)
            ctx.fillRect(col * cell, y, cell, cell);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 22px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${String.fromCharCode(65 + col)}${row + 1}`, col * cell + cell / 2, y + cell / 2);
        }
    }

    // Moldura indicando as bordas u = 0/1 e v = 0/1
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    return toTexture(canvas);
}
