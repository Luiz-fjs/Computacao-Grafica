import * as THREE from "three";
import { TABLE } from "./table.js";
import { loadImageTextureSet, PBR_MAPS } from "./textures.js";

export const LAMP_LAYER = 1;

// ==================================================
// ROOM (piso de parquet)
// Textura fotográfica do ambientCG (CC0). O repeat é calculado pelo
// tamanho de cada repetição em unidades do mundo, para os texels ficarem
// quadrados.
// ==================================================

const FLOOR_TEXTURE = "assets/textures/woodfloor070/WoodFloor070_1K-JPG";
const FLOOR_SIZE = 80;
const FLOOR_TILE_SIZE = 6;

export function createRoom() {
    const room = new THREE.Group();
    room.name = "Room";

    const floorRepeat = FLOOR_SIZE / FLOOR_TILE_SIZE;
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE),
        new THREE.MeshStandardMaterial({
            ...loadImageTextureSet(FLOOR_TEXTURE, PBR_MAPS, floorRepeat, floorRepeat),
            roughness: 1,
        })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = TABLE.floorY;
    floor.receiveShadow = true;
    room.add(floor);

    return room;
}

// ==================================================
// HANGING LAMP (fio + cúpula + lâmpada + SpotLight)
// ==================================================

function createHangingLamp(x, z) {
    const lamp = new THREE.Group();
    lamp.name = "Hanging lamp";
    lamp.position.set(x, 6.5, z);

    const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 8, 8),
        new THREE.MeshStandardMaterial({ color: "#222222" })
    );
    cord.position.y = 4.4;
    lamp.add(cord);

    // Cúpula: cilindro aberto (openEnded) em forma de tronco de cone
    const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 1.3, 0.8, 40, 1, true),
        new THREE.MeshStandardMaterial({ color: "#1f5e3a", metalness: 0.4, roughness: 0.4, side: THREE.DoubleSide })
    );
    shade.position.y = 0.4;
    shade.castShadow = true;
    lamp.add(shade);

    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 20, 16),
        new THREE.MeshStandardMaterial({ color: "#fff3c4", emissive: "#ffe9a8", emissiveIntensity: 2 })
    );
    bulb.position.y = 0.15;
    lamp.add(bulb);

    const spot = new THREE.SpotLight("#ffe6b0", 90, 20, 0.62, 0.55, 2);
    spot.position.set(0, 0.1, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0004;
    lamp.add(spot);

    // Alvo da SpotLight: direto para baixo, sobre o campo
    spot.target.position.set(0, -6.5, 0);
    lamp.add(spot.target);

    // Malhas da luminária na camada 1: a câmera superior não enxerga essa
    // camada, assim as cúpulas não tapam a visão de cima do campo
    [cord, shade, bulb].forEach((mesh) => mesh.layers.set(LAMP_LAYER));

    return { lamp, spot, bulb };
}

// ==================================================
// LIGHTS (várias fontes de luz)
// ==================================================

export function createLights(scene) {
    // 1) Luz ambiente hemisférica (céu/chão) para não ter sombras pretas
    const hemisphere = new THREE.HemisphereLight("#cfe3ff", "#5a3b22", 0.55);
    scene.add(hemisphere);

    // 2) Luz direcional "janela", principal geradora de sombras
    const sun = new THREE.DirectionalLight("#fff4e0", 1.3);
    sun.position.set(10, 16, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 50;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    // 3 e 4) Duas luminárias pendentes com SpotLight sobre cada metade
    const lampLeft = createHangingLamp(-3.2, 0);
    const lampRight = createHangingLamp(3.2, 0);
    scene.add(lampLeft.lamp, lampRight.lamp);

    // 5 e 6) PointLights coloridas dentro de cada gol
    const goalOffset = TABLE.fieldLength / 2 + TABLE.wallThickness + 0.4;
    const redGoalLight = new THREE.PointLight("#ff4040", 4, 4, 2);
    redGoalLight.position.set(-goalOffset, 0.5, 0);
    const blueGoalLight = new THREE.PointLight("#4080ff", 4, 4, 2);
    blueGoalLight.position.set(goalOffset, 0.5, 0);
    scene.add(redGoalLight, blueGoalLight);

    // Lista na ordem das teclas 1 a 6, para ligar/desligar cada luz.
    // envWeight = quanto cada luz contribui para o reflexo do ambiente nos
    // metais (soma 1): com tudo apagado, o reflexo também some.
    const switchable = [
        { label: "Ambient (hemisphere)", light: hemisphere, envWeight: 0.3 },
        { label: "Window (directional)", light: sun, envWeight: 0.3 },
        { label: "Left lamp (spot)", light: lampLeft.spot, bulb: lampLeft.bulb, envWeight: 0.15 },
        { label: "Right lamp (spot)", light: lampRight.spot, bulb: lampRight.bulb, envWeight: 0.15 },
        { label: "Red goal (point)", light: redGoalLight, envWeight: 0.05 },
        { label: "Blue goal (point)", light: blueGoalLight, envWeight: 0.05 },
    ];

    return {
        hemisphere,
        sun,
        spots: [lampLeft.spot, lampRight.spot],
        goalLights: [redGoalLight, blueGoalLight],
        switchable,
    };
}

// Liga/desliga uma luz; a lâmpada da luminária apaga junto com a SpotLight
export function toggleLight(entry) {
    entry.light.visible = !entry.light.visible;
    if (entry.bulb) entry.bulb.material.emissiveIntensity = entry.light.visible ? 2 : 0;
}

// ==================================================
// ENVIRONMENT REFLECTION
// Os metais (hastes, traves, expositor, bola pesada) usam um envMap gerado
// a partir do RoomEnvironment. Esse mapa é iluminação baseada em imagem:
// ele não passa pelas luzes da cena, então os metais continuariam brilhando
// com tudo apagado. Aqui a intensidade do reflexo acompanha as luzes acesas.
// ==================================================

export function updateEnvironmentReflection(scene, switchable) {
    const lightLevel = switchable.reduce((sum, entry) => sum + (entry.light.visible ? entry.envWeight : 0), 0);

    scene.traverse((object) => {
        if (!object.isMesh || !object.material.envMap) return;
        const material = object.material;
        // Guarda a intensidade original na primeira vez
        material.userData.baseEnvMapIntensity ??= material.envMapIntensity;
        material.envMapIntensity = material.userData.baseEnvMapIntensity * lightLevel;
    });
}
