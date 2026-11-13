import { TABLE } from "./table.js";
import { TEAMS, SKIN_TONES } from "./player.js";
import {
    createFieldMarkingsTexture,
    createJerseyTexture,
    createSockTexture,
    createFaceTexture,
    createNetTexture,
    createGripTexture,
    createNormalBallTexture,
    createLightBallTexture,
    createUvCheckerTexture,
} from "./textures.js";

// ==================================================
// GENERATED TEXTURES
// Mesmos parâmetros usados em table.js, player.js e balls.js.
// Cada textura é gerada em um canvas; a página mostra o canvas e
// permite salvá-lo como PNG.
// ==================================================

const GENERATED = [
    { file: "field-markings", title: "Field markings (transparent)", usedOn: "Overlay plane above the grass", create: () => createFieldMarkingsTexture(TABLE.fieldLength, TABLE.fieldWidth) },
    { file: "jersey-red-9", title: "Red jersey #9", usedOn: "Red players' torso (one per number)", create: () => createJerseyTexture(TEAMS.red.jersey, TEAMS.red.stripe, 9) },
    { file: "jersey-blue-3", title: "Blue jersey #3", usedOn: "Blue players' torso (one per number)", create: () => createJerseyTexture(TEAMS.blue.jersey, TEAMS.blue.stripe, 3) },
    { file: "sock-red", title: "Red socks", usedOn: "Red players' shins", create: () => createSockTexture(TEAMS.red.sock, TEAMS.red.sockBand) },
    { file: "sock-blue", title: "Blue socks", usedOn: "Blue players' shins", create: () => createSockTexture(TEAMS.blue.sock, TEAMS.blue.sockBand) },
    ...SKIN_TONES.map((tone, i) => ({
        file: `face-${i + 1}`,
        title: `Face (skin tone ${i + 1})`,
        usedOn: "Players' head sphere",
        create: () => createFaceTexture(tone),
    })),
    { file: "net", title: "Goal net (transparent)", usedOn: "Goal net planes (repeat 4 × 3)", create: () => createNetTexture() },
    { file: "grip-red", title: "Red handle grip", usedOn: "Red rods' handles", create: () => createGripTexture(TEAMS.red.handle) },
    { file: "grip-blue", title: "Blue handle grip", usedOn: "Blue rods' handles", create: () => createGripTexture(TEAMS.blue.handle) },
    { file: "ball-normal-fallback", title: "Normal ball (fallback)", usedOn: "Normal ball while the glTF model loads", create: () => createNormalBallTexture() },
    { file: "ball-light", title: "Light ball (beach ball)", usedOn: "Light ball sphere", create: () => createLightBallTexture() },
    { file: "uv-checker", title: "UV checker", usedOn: "Debug grid shown with the U key", create: () => createUvCheckerTexture() },
];

const EXTERNAL = [
    { src: "assets/textures/wood026/Wood026_1K-JPG_Color.jpg", title: "Wood026 – Color", usedOn: "Light table wood: walls, cabinet, ball stand (one repeat per 2.5 units)" },
    { src: "assets/textures/wood026/Wood026_1K-JPG_NormalGL.jpg", title: "Wood026 – Normal (OpenGL)", usedOn: "Light wood grain relief" },
    { src: "assets/textures/wood026/Wood026_1K-JPG_Roughness.jpg", title: "Wood026 – Roughness", usedOn: "Light wood" },
    { src: "assets/textures/wood051/Wood051_1K-JPG_Color.jpg", title: "Wood051 – Color", usedOn: "Dark wood: legs, trims, ramps, goal floor (one repeat per 2.5 units)" },
    { src: "assets/textures/wood051/Wood051_1K-JPG_NormalGL.jpg", title: "Wood051 – Normal (OpenGL)", usedOn: "Dark wood grain relief" },
    { src: "assets/textures/wood051/Wood051_1K-JPG_Roughness.jpg", title: "Wood051 – Roughness", usedOn: "Dark wood" },
    { src: "assets/textures/grass005/Grass005_1K-JPG_Color.jpg", title: "Grass005 – Color", usedOn: "Field grass (repeat 6 × 3.5)" },
    { src: "assets/textures/grass005/Grass005_1K-JPG_NormalGL.jpg", title: "Grass005 – Normal (OpenGL)", usedOn: "Field grass relief" },
    { src: "assets/textures/grass005/Grass005_1K-JPG_Roughness.jpg", title: "Grass005 – Roughness", usedOn: "Field grass" },
    { src: "assets/textures/woodfloor070/WoodFloor070_1K-JPG_Color.jpg", title: "WoodFloor070 – Color", usedOn: "Room floor (repeat 13.3 × 13.3)" },
    { src: "assets/textures/woodfloor070/WoodFloor070_1K-JPG_NormalGL.jpg", title: "WoodFloor070 – Normal (OpenGL)", usedOn: "Room floor relief" },
    { src: "assets/textures/woodfloor070/WoodFloor070_1K-JPG_Roughness.jpg", title: "WoodFloor070 – Roughness", usedOn: "Room floor" },
    { src: "assets/textures/metal059c/Metal059C_1K-JPG_Color.jpg", title: "Metal059C – Color", usedOn: "Heavy ball (base color)" },
    { src: "assets/textures/metal059c/Metal059C_1K-JPG_NormalGL.jpg", title: "Metal059C – Normal (OpenGL)", usedOn: "Heavy ball (relief under light)" },
    { src: "assets/textures/metal059c/Metal059C_1K-JPG_Roughness.jpg", title: "Metal059C – Roughness", usedOn: "Heavy ball (glossiness)" },
    { src: "assets/textures/metal059c/Metal059C_1K-JPG_Metalness.jpg", title: "Metal059C – Metalness", usedOn: "Heavy ball (metal areas)" },
    { src: "assets/models/football/textures/football_diff_2k.jpg", title: "Football – Diffuse", usedOn: "Normal ball glTF (base color)" },
    { src: "assets/models/football/textures/football_arm_2k.jpg", title: "Football – AO/Roughness/Metal", usedOn: "Normal ball glTF (roughness in G)" },
];

// ==================================================
// RENDER
// ==================================================

function createCard({ title, usedOn, preview, meta, download }) {
    const card = document.createElement("article");
    card.className = "card";

    const frame = document.createElement("div");
    frame.className = "frame";
    frame.appendChild(preview);

    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `<h3>${title}</h3><p>${usedOn}</p><p class="meta">${meta}</p>`;
    if (download) info.appendChild(download);

    card.append(frame, info);
    return card;
}

const generatedGrid = document.getElementById("generated");
const generatedCanvases = {};

for (const entry of GENERATED) {
    const canvas = entry.create().image;
    generatedCanvases[entry.file] = canvas;

    const link = document.createElement("a");
    link.textContent = "Download PNG";
    link.download = `${entry.file}.png`;
    link.href = "#";
    link.addEventListener("click", () => {
        link.href = canvas.toDataURL("image/png");
    });

    generatedGrid.appendChild(createCard({
        title: entry.title,
        usedOn: entry.usedOn,
        preview: canvas,
        meta: `${canvas.width} × ${canvas.height} px · src/textures.js`,
        download: link,
    }));
}

const externalGrid = document.getElementById("external");

for (const entry of EXTERNAL) {
    const image = new Image();
    image.src = entry.src;
    const card = createCard({ title: entry.title, usedOn: entry.usedOn, preview: image, meta: entry.src });
    image.addEventListener("load", () => {
        card.querySelector(".meta").textContent = `${image.naturalWidth} × ${image.naturalHeight} px · ${entry.src}`;
    });
    externalGrid.appendChild(card);
}

// Exposto para inspeção e exportação pelo console
window.textureGallery = { canvases: generatedCanvases };
