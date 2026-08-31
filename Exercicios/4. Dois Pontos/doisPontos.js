const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}


// --------------------------------------------------
// 1. VÉRTICES
// --------------------------------------------------

let vertices = new Float32Array([
    0.0,0.0,
    0.0,0.0,
]);

let colors = new Float32Array([
    0.0,0.0,1.0,
    0.0,0.0,1.0
]);


// --------------------------------------------------
// 2. BUFFER
// --------------------------------------------------

const verticebuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, verticebuffer);

gl.bufferData(
    gl.ARRAY_BUFFER,
    vertices,
    gl.STATIC_DRAW
);

const colorBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

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
    gl_PointSize = 5.0;
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
// 7. LOCAL DO ATRIBUTO
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
// 8. CONFIGURAR ATRIBUTO
// --------------------------------------------------

gl.bindBuffer(gl.ARRAY_BUFFER, verticebuffer);

gl.enableVertexAttribArray(positionLocation);

gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

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
// 9. INTERAÇÃO COM O MOUSE
// --------------------------------------------------
canvas.addEventListener("mousedown",mouseClick,false);
let clicked = 0;
let clickX1, clickY1;
let currentColor = [0.0, 0.0, 1.0];

function mouseClick(event) {
    if (clicked === 0) {
        clickX1 = event.offsetX;
        clickY1 = event.offsetY;
        clicked = 1;
    } else {
        let clickX2 = event.offsetX;
        let clickY2 = event.offsetY;
        clicked = 0;

        let verticesArray = [];
        let colorsArray = [];

        bresenham(clickX1, clickX2, clickY1, clickY2, verticesArray, colorsArray);

        vertices = new Float32Array(verticesArray);
        colors = new Float32Array(colorsArray);

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            verticebuffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            vertices,
            gl.STATIC_DRAW
        );

        gl.bindBuffer(
            gl.ARRAY_BUFFER, 
            colorBuffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            colors,
            gl.STATIC_DRAW
        );

        drawScene();
    }
}

function bresenham(x1, x2, y1, y2, vArray, cArray) {
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);

    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;

    let erro = dx - dy;

    while (true) {

        vArray.push((x1 / canvas.width) * 2 - 1,-((y1 / canvas.height) * 2 - 1));
        cArray.push(...currentColor);

        if (x1 === x2 && y1 === y2) {
            break;
        }

        let e2 = 2 * erro;

        if (e2 > -dy) {
            erro -= dy;
            x1 += sx;
        }

        if (e2 < dx) {
            erro += dx;
            y1 += sy;
        }
    }
}

// --------------------------------------------------
// 10. INTERAÇÃO COM O TECLADO
// --------------------------------------------------

document.addEventListener("keydown", keyboardClick, false);

function keyboardClick(event) {

    switch(event.key) {

        case "0":
            currentColor = [1.0, 1.0, 1.0];
            break;

        case "1":
            currentColor = [1.0, 0.0, 0.0];
            break;

        case "2":
            currentColor = [0.0, 1.0, 0.0];
            break;

        case "3":
            currentColor = [0.0, 0.0, 1.0];
            break;

        case "4":
            currentColor = [1.0, 1.0, 0.0];
            break;

        case "5":
            currentColor = [1.0, 0.0, 1.0];
            break;

        case "6":
            currentColor = [0.0, 1.0, 1.0];
            break;

        case "7":
            currentColor = [1.0, 0.5, 0.0];
            break;

        case "8":
            currentColor = [0.5, 0.0, 1.0];
            break;

        case "9":
            currentColor = [1.0, 0.4, 0.7];
            break;

        default:
            return;
    }

  for (let i = 0; i < colors.length; i += 3) {
        colors[i]     = currentColor[0];
        colors[i + 1] = currentColor[1];
        colors[i + 2] = currentColor[2];
    }

    // Atualizar o buffer de cores
    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        colorBuffer
    );

    gl.bufferData(
        gl.ARRAY_BUFFER,
        colors,
        gl.STATIC_DRAW
    );

    drawScene();
}

// --------------------------------------------------
// 11. LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// 12. DESENHAR
// --------------------------------------------------

gl.useProgram(program);

function drawScene(){
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.drawArrays(
        gl.POINTS,
        0,
        vertices.length / 2
    );
}

drawScene();