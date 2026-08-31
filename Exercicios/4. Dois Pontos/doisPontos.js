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

function mouseClick(event) {

    if (clicked == 0) {
        vertices[0] = (event.offsetX / canvas.width) * 2 - 1;
        vertices[1] = -((event.offsetY / canvas.height) * 2 - 1);

        clicked = 1;

    } else {
        vertices[2] = (event.offsetX / canvas.width) * 2 - 1;
        vertices[3] = -((event.offsetY / canvas.height) * 2 - 1);

        clicked = 0;

        bresenham(vertices[0], vertices[2], vertices[1], vertices[3])
        
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            verticebuffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            vertices,
            gl.STATIC_DRAW
        );

        drawScene();
    }
    
}

function bresenham (x1, x2, y1, y2){
    let dx,dy, incSup, incInf, p, x, y;
    dx = x2-x1; 
    dy = y2-y1;
    p = 2 * dy - dx; 
    incInf = 2*dy; 
    incSup = 2*(dy-dx); 
    x = x1; 
    y = y1;
     
    
    while (x < x2) {
        if (p < 0) { 
            p = p + incInf;}
        else { 
            p = p + incSup;
            y++;
        } 
        x++;
        vertices.push(x, y);
        colors.push(0.0,0.0,1.0, 0.0,0.0,1.0);
    }
} 

// --------------------------------------------------
// 10. LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// 11. DESENHAR
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