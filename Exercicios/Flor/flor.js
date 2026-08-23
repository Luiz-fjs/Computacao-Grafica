const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}


// --------------------------------------------------
// 1. VERTICES
// --------------------------------------------------


function ShapeVertices() {
    const vertices = [];

    // Center point of the circle
    vertices.push(0.0, 0.0);

    // Calculate circle vertices
    const radius = 0.3;
    const numSides = 40;

    for (let i = 0; i <= numSides; i++) {
        const angle = i * 2 * Math.PI / numSides;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        vertices.push(x, y);
    }

    // Calculate petals vertices
    const externalRadius = 0.6;
    const numRays = 5;

    for (let i = 0; i < numRays; i++) {
        // Centro da Elipse 
        const angle = i * 2 * Math.PI / numRays;

        const centerX = externalRadius * Math.cos(angle);
        const centerY = externalRadius * Math.sin(angle);
        vertices.push(centerX, centerY);

        // Calculate elipse vertices
        const numSides = 40;

        for (let j = 0; j <= numSides; j++) {
            const petalAngle = j * 2 * Math.PI / numSides;

            const x = 0.15 * Math.cos(petalAngle);
            const y = 0.35 * Math.sin(petalAngle);

            const xRot = x * Math.cos(petalAngle) - y * Math.sin(petalAngle);
            const yRot = x * Math.sin(petalAngle) + y * Math.cos(petalAngle);
            vertices.push(centerX + xRot, centerY + yRot);
        }

    }
    return new Float32Array(vertices);
}


const vertices_Sun = ShapeVertices();


// --------------------------------------------------
// 2. BUFFERS
// --------------------------------------------------

const verticesBuffer_Sun = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer_Sun);

gl.bufferData(
    gl.ARRAY_BUFFER,
    vertices_Sun,
    gl.STATIC_DRAW
);


// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource_Sun = `#version 300 es

in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

`;


// --------------------------------------------------
// 4. FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource_Sun = `#version 300 es

precision mediump float;

uniform vec4 uColor;

out vec4 outColor;

void main() {
    outColor = uColor;
}

`;


// --------------------------------------------------
// 5. COMPILAR SHADERS
// --------------------------------------------------

function createShader(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

        const error = gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);

        throw new Error(error);
    }

    return shader;
}


const vertexShader_Sun= createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource_Sun
);

const fragmentShader_Sun = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource_Sun
);


// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------

const program_Sun = gl.createProgram();

gl.attachShader(program_Sun, vertexShader_Sun);
gl.attachShader(program_Sun, fragmentShader_Sun);

gl.linkProgram(program_Sun);

if (!gl.getProgramParameter(program_Sun, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program_Sun)
    );
}


// --------------------------------------------------
// 7. LOCAL DOS ATRIBUTOS
// --------------------------------------------------

const positionLocation_Sun =
    gl.getAttribLocation(
        program_Sun,
        "aPosition"
    );

const colorLocation_Sun =
    gl.getUniformLocation(
        program_Sun,
        "uColor"
    );

// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTOS
// --------------------------------------------------

gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer_Sun);

gl.enableVertexAttribArray(positionLocation_Sun);

gl.vertexAttribPointer(
    positionLocation_Sun,
    2,
    gl.FLOAT,
    false,
    0,
    0
);



// --------------------------------------------------
// 9. LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.0, 0.0, 0.0, 0.1);

gl.clear(gl.COLOR_BUFFER_BIT);

// --------------------------------------------------
// 10. DESENHAR
// --------------------------------------------------

gl.useProgram(program_Sun);

gl.uniform4f(
    colorLocation_Sun,
    1.0, 
    0.5, 
    0.0, 
    1.0, 
)

gl.drawArrays(
    gl.TRIANGLE_FAN,
    42, 
    210
);

gl.uniform4f(
    colorLocation_Sun,
    1.0, 
    1.0, 
    0.0, 
    1.0, 
)

gl.drawArrays(
    gl.TRIANGLE_FAN,
    0, 
    42
);

/* //Preto
gl.uniform4f(
    colorLocation_Sun,
    0.0,
    0.0,
    0.0,
    1.0
);

// Borda do círculo
gl.drawArrays(
    gl.LINE_LOOP,
    1,
    41
);*/