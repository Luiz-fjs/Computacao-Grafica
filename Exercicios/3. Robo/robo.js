const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}


// --------------------------------------------------
// 1. VÉRTICES
// --------------------------------------------------

const verticesArray = [];
        const colorsArray = [];

        // Função auxiliar para repetir cores facilmente
        function addColor(r, g, b, count) {
            for (let i = 0; i < count; i++) {
                colorsArray.push(r, g, b);
            }
        }

        // Função auxiliar para criar retângulos (2 triângulos = 6 vértices)
        function addRect(x1, y1, x2, y2, r, g, b) {
            verticesArray.push(
                x1, y1,  x2, y1,  x1, y2,
                x1, y2,  x2, y1,  x2, y2
            );
            addColor(r, g, b, 6);
        }

        // Função auxiliar para criar triângulos soltos
        function addTriangle(x1, y1, x2, y2, x3, y3, r, g, b) {
            verticesArray.push(x1, y1, x2, y2, x3, y3);
            addColor(r, g, b, 3);
        }

        // --- CONSTRUINDO O CORPO DO ROBÔ (via Triângulos) ---
        // Cores em RGB Normalizado (0.0 a 1.0)
        const cGray = [0.85, 0.85, 0.85];
        const cBlack = [0.0, 0.0, 0.0];

        
        // 2. Rosto (Retângulo cinza)
        addRect(-0.46, 0.84, 0.46, 0.40, ...cGray);
        // 3. Pescoço
        addRect(-0.10, 0.40, 0.10, 0.32, ...cGray);
        // 4. Corpo
        addRect(-0.41, 0.32, 0.41, -0.27, ...cGray);
        // 5. Perna Esquerda
        addRect(-0.28, -0.27, -0.08, -0.67, ...cGray);
        // 6. Perna Direita
        addRect(0.08, -0.27, 0.28, -0.67, ...cGray);

        // 7. Braço Esquerdo (2 triângulos para formar o trapézio inclinado)
        addTriangle(-0.41, 0.32, -0.55, 0.32, -0.73, -0.30, ...cGray);
        addTriangle(-0.41, 0.32, -0.73, -0.30, -0.55, -0.33, ...cGray);

        // 8. Braço Direito
        addTriangle(0.41, 0.32, 0.55, 0.32, 0.73, -0.30, ...cGray);
        addTriangle(0.41, 0.32, 0.73, -0.30, 0.55, -0.33, ...cGray);

        // 9. Boca / Nariz
        addTriangle(-0.16, 0.53, 0.16, 0.53, 0.0, 0.41, ...cBlack);

        // Guardamos quantos vértices temos até aqui para desenhar usando gl.TRIANGLES
        const triangleVerticesCount = verticesArray.length / 2;

        // --- CONSTRUINDO OS OLHOS (via Triangle Fan) ---
        const numSides = 40;
        // Ajuste de proporção: como a tela é 600x800, o eixo Y é mais "esticado". 
        // O raio Y precisa ser um pouco menor para o círculo ficar redondo.
        const radiusX = 0.083; 
        const radiusY = 0.062;

        // 10. Olho Esquerdo
        const leftEyeCx = -0.23;
        const leftEyeCy = 0.62;
        verticesArray.push(leftEyeCx, leftEyeCy); // Vértice Central
        addColor(0.0, 0.0, 0.0, 1);
        for (let i = 0; i <= numSides; i++) {
            const angle = (i * 2 * Math.PI) / numSides;
            verticesArray.push(leftEyeCx + radiusX * Math.cos(angle), leftEyeCy + radiusY * Math.sin(angle));
            addColor(0.0, 0.0, 0.0, 1);
        }

        // 11. Olho Direito
        const rightEyeCx = 0.23;
        const rightEyeCy = 0.62;
        verticesArray.push(rightEyeCx, rightEyeCy); // Vértice Central
        addColor(0.0, 0.0, 0.0, 1);
        for (let i = 0; i <= numSides; i++) {
            const angle = (i * 2 * Math.PI) / numSides;
            verticesArray.push(rightEyeCx + radiusX * Math.cos(angle), rightEyeCy + radiusY * Math.sin(angle));
            addColor(0.0, 0.0, 0.0, 1);
        }

        // Finalmente, convertemos para a estrutura forte do WebGL
        const vertices = new Float32Array(verticesArray);
        const colors = new Float32Array(colorsArray);



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
// 9. LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// 10. DESENHAR
// --------------------------------------------------

gl.useProgram(program);

gl.drawArrays(gl.TRIANGLES, 0, triangleVerticesCount);

// Desenha o Olho Esquerdo
let offset = triangleVerticesCount;
const circleVerticesCount = numSides + 2;
gl.drawArrays(gl.TRIANGLE_FAN, offset, circleVerticesCount);

// Desenha o Olho Direito
offset += circleVerticesCount;
gl.drawArrays(gl.TRIANGLE_FAN, offset, circleVerticesCount);