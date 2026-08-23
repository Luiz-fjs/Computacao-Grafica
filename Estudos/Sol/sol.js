const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}


// --------------------------------------------------
// 1. VERTICES
// --------------------------------------------------


function circleVertices() {
    const vertices = [];

    // Center point of the circle
    vertices.push(0.0, 0.0);

    // Calculate circle vertices
    const radius = 0.35;
    const numSides = 40;

    for (let i = 0; i <= numSides; i++) {
        const angle = i * 2 * Math.PI / numSides;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        vertices.push(x, y);
    }

    // Calculate ray vertices
    const externalRadius = 0.8;
    const numRays = 10;

    for (let i = 0; i < numRays; i++) {
        const angle = i * 2 * Math.PI / numRays;

        const angle1 = angle - 0.35;
        const x1 = radius * Math.cos(angle1);
        const y1 = radius * Math.sin(angle1);
        vertices.push(x1, y1);

        const angle2 = angle + 0.35;
        const x2 = radius * Math.cos(angle2);
        const y2 = radius * Math.sin(angle2);
        vertices.push(x2, y2);

        const x = externalRadius * Math.cos(angle);
        const y = externalRadius * Math.sin(angle);
        vertices.push(x, y);

    }
    return new Float32Array(vertices);
}


const vertices_Sun = circleVertices();


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

gl.clearColor(0.5, 0.9, 1, 1);

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
    gl.TRIANGLES,
    42, 
    30
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

// Preto
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
);