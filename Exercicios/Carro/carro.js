const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}


// --------------------------------------------------
// 1. VERTICES
// --------------------------------------------------

const verticesArray = [
    // 1
    -0.3,  0.4, // 0: parabrisa-cima
    -0.6,  0.2, // 1: parabrisa-baixo      
    0.0,  0.2,  // 2: meio
       
    // 2
    -0.95,  0.1, // capo-cima
    -0.6,  0.2,  // 1: parabrisa-baixo      
    0.0,  0.2,   // 2: meio-cima

    // 3
    -0.95,  0.1, // capo-cima
    -0.95, -0.2, // capo-baixo             
    0.0,  -0.2,  // 2: meio-baixo

    // 4
    -0.95, 0.1, // capo-cima
    0.0,  0.2,  // 2: meio-cima
    0.0,  -0.2, // 2: meio-baixo

    // 5
    0.95,  0.2, // caçamba-cima
    0.0,  0.2,  // 2: meio
    0.0,  -0.2, // 2: meio-baixo

    // 6
    0.95,  0.2, // caçamba-cima
    0.95, -0.2, // caçamba-baixo
    0.0,  -0.2, // meio-baixo

    // 7
    0.0,  0.2,  // meio
    0.2, 0.1,   // cabine baixo
    0.18, 0.4,   // cabine cima

    // 8
    -0.3,  0.4,  // 0: parabrisa-cima
    0.0,  0.2,  // 2: meio
    0.18, 0.4   // cabine cima

];


// Calculate circle vertices
const radius = 0.15;
const numSides = 40;

// Center point of the circle
verticesArray.push(0.55, -0.20);

for (let i = 0; i <= numSides; i++) {
    const angle = i * 2 * Math.PI / numSides;
    const x = 0.55 + radius * Math.cos(angle);
    const y = -0.20 + radius * Math.sin(angle);
    verticesArray.push(x, y);
}

// Center point of the circle
verticesArray.push(-0.65, -0.20);

for (let i = 0; i <= numSides; i++) {
    const angle = i * 2 * Math.PI / numSides;
    const x = -0.65 + radius * Math.cos(angle);
    const y = -0.20 + radius * Math.sin(angle);
    verticesArray.push(x, y);
}


const vertices = new Float32Array(verticesArray);

function createCarColors() {
    const colors = [];

    for (let i = 0; i < 24; i++) {
        colors.push(1.0, 1.0, 1.0); // branco
    }

    for (let i = 0; i <= 84; i++) {
        colors.push(0.0, 0.0, 0.0); // preto
    }

    return new Float32Array(colors);
}

const colors = createCarColors();

// --------------------------------------------------
// 2. BUFFERS
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

gl.bufferData(
    gl.ARRAY_BUFFER,
    vertices,
    gl.STATIC_DRAW
);

const colorsBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);

gl.bufferData(
    gl.ARRAY_BUFFER,
    colors,
    gl.STATIC_DRAW
);


// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;
in vec3 aColor;

out vec3 vColor;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vColor = aColor;
}

`;


// --------------------------------------------------
// 4. FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;

in vec3 vColor;

out vec4 outColor;

void main() {
    outColor = vec4(vColor, 1.0);
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


const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);


// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}


// --------------------------------------------------
// 7. LOCAL DOS ATRIBUTOS
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation = 
    gl.getAttribLocation(
        program,
        "aColor"
    );

// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTOS
// --------------------------------------------------

gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

gl.enableVertexAttribArray(positionLocation);

gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);

gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);

gl.enableVertexAttribArray(colorLocation);

gl.vertexAttribPointer(
    colorLocation,
    3,
    gl.FLOAT,
    false,
    0,
    0
);
// --------------------------------------------------
// 9. LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 0.5);

gl.clear(gl.COLOR_BUFFER_BIT);

// --------------------------------------------------
// 10. DESENHAR
// --------------------------------------------------

gl.useProgram(program);

gl.drawArrays(
    gl.TRIANGLES,
    0, 
    24
);

gl.drawArrays(
    gl.TRIANGLE_FAN,
    24, 
    42
);

gl.drawArrays(
    gl.TRIANGLE_FAN,
    66, 
    42
);