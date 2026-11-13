// ==================================================
// WORLD-SPACE UVs
// BoxGeometry e CylinderGeometry nascem com UV de 0 a 1 em cada face,
// qualquer que seja o tamanho da face. Com uma textura repetível isso
// estica a imagem em peças compridas. Aqui as UVs são multiplicadas pelas
// dimensões reais de cada face, ficando em unidades do mundo; o material
// usa repeat = 1 / tamanho da repetição, então a textura tem a mesma
// escala em todas as peças. (ExtrudeGeometry já gera UVs nesse formato.)
// ==================================================

// Dimensões (u, v) de cada face do BoxGeometry, na ordem dos grupos:
// +X, -X, +Y, -Y, +Z, -Z
function boxFaceSizes({ width, height, depth }) {
    return [
        [depth, height], [depth, height],
        [width, depth], [width, depth],
        [width, height], [width, height],
    ];
}

function scaleBoxUVs(geometry) {
    const uv = geometry.attributes.uv;
    const sizes = boxFaceSizes(geometry.parameters);
    const done = new Set();

    geometry.groups.forEach((group, face) => {
        const [uSize, vSize] = sizes[face];
        // Veio da madeira sempre ao longo do lado mais comprido da face
        const swap = vSize > uSize;

        for (let i = group.start; i < group.start + group.count; i++) {
            const vertex = geometry.index.getX(i);
            if (done.has(vertex)) continue;
            done.add(vertex);

            const u = uv.getX(vertex);
            const v = uv.getY(vertex);
            if (swap) uv.setXY(vertex, v * vSize, u * uSize);
            else uv.setXY(vertex, u * uSize, v * vSize);
        }
    });
}

function scaleCylinderUVs(geometry) {
    const { radiusTop, radiusBottom, height, radialSegments, heightSegments } = geometry.parameters;
    const circumference = Math.PI * (radiusTop + radiusBottom); // média das duas bordas
    const diameter = 2 * Math.max(radiusTop, radiusBottom);
    const uv = geometry.attributes.uv;

    // O CylinderGeometry cria primeiro os vértices da lateral, depois os das
    // tampas. Lateral: u dá a volta (circunferência), v sobe (altura).
    // Tampas: u, v formam um quadrado de 0 a 1 do tamanho do diâmetro.
    const sideVertexCount = (heightSegments + 1) * (radialSegments + 1);
    for (let vertex = 0; vertex < uv.count; vertex++) {
        const u = uv.getX(vertex);
        const v = uv.getY(vertex);
        if (vertex < sideVertexCount) uv.setXY(vertex, u * circumference, v * height);
        else uv.setXY(vertex, u * diameter, v * diameter);
    }
}

export function applyWorldUVs(geometry) {
    if (geometry.userData.worldUVs) return; // geometria compartilhada: só uma vez
    if (geometry.type === "BoxGeometry") scaleBoxUVs(geometry);
    else if (geometry.type === "CylinderGeometry") scaleCylinderUVs(geometry);
    else return;
    geometry.attributes.uv.needsUpdate = true;
    geometry.userData.worldUVs = true;
}
