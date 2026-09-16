const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}


// ==================================================
// 1. VÉRTICES 
// ==================================================

function verticesCabeca() {

    return new Float32Array([
        -0.46,  0.84,
        -0.46,  0.40,
         0.46,  0.84,

         0.46,  0.84,
        -0.46,  0.40,
         0.46,  0.40,

        -0.10,  0.40,
        0.10,  0.40,
        -0.10,  0.32,

        -0.10,  0.32,
        0.10,  0.40,
         0.10,  0.32
    ]);
}


function verticesCorpo() {

    return new Float32Array([
        -0.41,  0.32,
        -0.41, -0.27,
         0.41,  0.32,

         0.41,  0.32,
        -0.41, -0.27,
         0.41, -0.27
    ]);
}


function verticesPernaEsquerda() {

    return new Float32Array([
        -0.28, -0.27,
        -0.28, -0.67,
        -0.08, -0.27,

        -0.08, -0.27,
        -0.28, -0.67,
        -0.08, -0.67
    ]);
}


function verticesPernaDireita() {

    return new Float32Array([
         0.08, -0.27,
         0.08, -0.67,
         0.28, -0.27,

         0.28, -0.27,
         0.08, -0.67,
         0.28, -0.67
    ]);
}

function verticesBracoDireito() {

    return new Float32Array([
        0.41,  0.20,
         0.41, -0.20,
         0.51,  0.20,

         0.51,  0.20,
         0.41, -0.20,
         0.51, -0.20
    ]);
}

function verticesBracoEsquerdo() {

    return new Float32Array([
        -0.41,  0.20,
        -0.41, -0.20,
        -0.51,  0.20,

        -0.51,  0.20,
        -0.41, -0.20,
        -0.51, -0.20
    ]);
}


function verticesBoca() {

    return new Float32Array([
        -0.10, 0.50,
         0.10, 0.50,
         0.00, 0.39
    ]);
}


// ==================================================
// OLHOS
// ==================================================

function verticesOlhos() {

    let vertices = [];

    const numSides = 40;
    const radiusX = 0.083;
    const radiusY = 0.083;

    const olhos = [
        [-0.23, 0.62],
        [ 0.23, 0.62]
    ];

    for (let olho of olhos) {

        let cx = olho[0];
        let cy = olho[1];

        // Centro
        vertices.push(cx, cy);

        for (let i = 0; i <= numSides; i++) {

            let theta =
                (i / numSides) * 2 * Math.PI;

            vertices.push(
                cx + radiusX * Math.cos(theta),
                cy + radiusY * Math.sin(theta)
            );
        }
    }

    return new Float32Array(vertices);
}


// ==================================================
// 2. CORES
// ==================================================

const corCabeca = new Float32Array([
    0.45, 0.65, 0.90
]);

const corCorpo = new Float32Array([
    0.45, 0.65, 0.90
]);

const corPernaEsquerda = new Float32Array([
    0.90, 0.20, 0.20
]);

const corPernaDireita = new Float32Array([
    0.90, 0.20, 0.20
]);

const corBracoEsquerdo = new Float32Array([
    0.90, 0.20, 0.20
]);

const corBracoDireito = new Float32Array([
    0.90, 0.20, 0.20
]);

const corBoca = new Float32Array([
    0.10, 0.10, 0.10
]);

const corOlhos = new Float32Array([
    0.10, 0.10, 0.10
]);


// ==================================================
// 3. MATRIZES DE TRANSFORMAÇÃO
// ==================================================

let Mcabeca;
let Mcorpo;

let MbracoEsquerdo;
let MbracoDireito;

let MpernaEsquerda;
let MpernaDireita;

let Mboca;
let Molhos;


// ==================================================
// 4. FUNÇÕES DE MATRIZ
// ==================================================

// Matriz identidade
function identidade() {

    return new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    ]);
}


// Translação
function translacao(tx, ty) {

    return new Float32Array([
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1
    ]);
}


// Rotação
function rotacao(angulo) {

    const c = Math.cos(angulo);
    const s = Math.sin(angulo);

    return new Float32Array([
         c, s, 0,
        -s, c, 0,
         0, 0, 1
    ]);
}


// Escala
function escala(sx, sy) {

    return new Float32Array([
        sx, 0, 0,
        0, sy, 0,
        0,  0, 1
    ]);
}


// Multiplicação de matrizes 3x3
// Matrizes em formato column-major,
// que é o formato utilizado pelo WebGL.
function multiplica(A, B) {

    const C = new Float32Array(9);

    for (let coluna = 0; coluna < 3; coluna++) {

        for (let linha = 0; linha < 3; linha++) {

            C[coluna * 3 + linha] =
                A[0 * 3 + linha] * B[coluna * 3 + 0] +
                A[1 * 3 + linha] * B[coluna * 3 + 1] +
                A[2 * 3 + linha] * B[coluna * 3 + 2];
        }
    }

    return C;
}


// ==================================================
// 5. ROTACIONAR EM TORNO DE UM PONTO
// ==================================================

function rotacaoNoPivo(px, py, angulo) {

    const T1 = translacao(px, py);

    const R = rotacao(angulo);

    const T2 = translacao(-px, -py);

    return multiplica(
        T1,
        multiplica(R, T2)
    );
}


// ==================================================
// 6. ANIMAÇÃO
// ==================================================

let anguloCorpo = 0;

let anguloBracoEsquerdo = 0;
let anguloBracoDireito = 0;

let anguloPernaEsquerda = 0;
let anguloPernaDireita = 0;


// Velocidades
let velocidadeCorpo = 0.015;

let velocidadeBracoEsquerdo = 0.035;
let velocidadeBracoDireito = -0.035;

let velocidadePernaEsquerda = -0.025;
let velocidadePernaDireita = 0.025;


function atualizaAnimacao() {

    // ----------------------------------------------
    // CORPO
    // ----------------------------------------------

    anguloCorpo += velocidadeCorpo;

    if (anguloCorpo > 0.20 ||
        anguloCorpo < -0.20) {

        velocidadeCorpo *= -1;
    }


    // ----------------------------------------------
    // BRAÇO ESQUERDO
    // ----------------------------------------------

    anguloBracoEsquerdo += velocidadeBracoEsquerdo;

    if (anguloBracoEsquerdo > 0.7 ||
        anguloBracoEsquerdo < -0.7) {

        velocidadeBracoEsquerdo *= -1;
    }


    // ----------------------------------------------
    // BRAÇO DIREITO
    // ----------------------------------------------

    anguloBracoDireito += velocidadeBracoDireito;

    if (anguloBracoDireito > 0.7 ||
        anguloBracoDireito < -0.7) {

        velocidadeBracoDireito *= -1;
    }


    // ----------------------------------------------
    // PERNA ESQUERDA
    // ----------------------------------------------

    anguloPernaEsquerda += velocidadePernaEsquerda;

    if (anguloPernaEsquerda > 0.35 ||
        anguloPernaEsquerda < -0.35) {

        velocidadePernaEsquerda *= -1;
    }


    // ----------------------------------------------
    // PERNA DIREITA
    // ----------------------------------------------

    anguloPernaDireita += velocidadePernaDireita;

    if (anguloPernaDireita > 0.35 ||
        anguloPernaDireita < -0.35) {

        velocidadePernaDireita *= -1;
    }
}


// ==================================================
// 7. ATUALIZAR MATRIZES DO ROBÔ
// ==================================================

function atualizaTransformacoes() {

    // ==================================================
    // CORPO
    // ==================================================

    // O corpo gira em torno de (0,0).
    //
    // Também colocamos uma pequena escala para
    // utilizar a transformação de escala.
    //
    const escalaCorpo = escala(
        1.0 + 0.03 * Math.sin(anguloCorpo * 3),
        1.0 - 0.03 * Math.sin(anguloCorpo * 3)
    );

    const Rcorpo = rotacao(anguloCorpo);

    Mcorpo = multiplica(
        Rcorpo,
        escalaCorpo
    );


    // ==================================================
    // CABEÇA
    // ==================================================

    // A cabeça acompanha o movimento do corpo.
    Mcabeca = Mcorpo;


    // ==================================================
    // BRAÇO DIREITO
    // ==================================================

    // Ponto onde o braço está conectado ao corpo:
    //
    // aproximadamente (0.10, 0.20)
    //
    const RbracoDireito =
        rotacaoNoPivo(
            0.10,
            0.20,
            anguloBracoDireito
        );

    MbracoDireito = multiplica(
        Mcorpo,
        RbracoDireito
    );


    // ==================================================
    // BRAÇO ESQUERDO
    // ==================================================

    // Ponto de conexão:
    //
    // aproximadamente (-0.10, 0.20)
    //
    const RbracoEsquerdo =
        rotacaoNoPivo(
            -0.10,
            0.20,
            anguloBracoEsquerdo
        );

    MbracoEsquerdo = multiplica(
        Mcorpo,
        RbracoEsquerdo
    );


    // ==================================================
    // PERNA DIREITA
    // ==================================================

    // Ponto de conexão:
    //
    // aproximadamente (0.18, -0.27)
    //
    const RpernaDireita =
        rotacaoNoPivo(
            0.18,
            -0.27,
            anguloPernaDireita
        );

    MpernaDireita = multiplica(
        Mcorpo,
        RpernaDireita
    );


    // ==================================================
    // PERNA ESQUERDA
    // ==================================================

    // Ponto de conexão:
    //
    // aproximadamente (-0.18, -0.27)
    //
    const RpernaEsquerda =
        rotacaoNoPivo(
            -0.18,
            -0.27,
            anguloPernaEsquerda
        );

    MpernaEsquerda = multiplica(
        Mcorpo,
        RpernaEsquerda
    );


    // ==================================================
    // BOCA
    // ==================================================

    Mboca = Mcorpo;


    // ==================================================
    // OLHOS
    // ==================================================

    Molhos = Mcorpo;
}


// ==================================================
// 8. BUFFER
// ==================================================

const verticesBuffer = gl.createBuffer();


// ==================================================
// 9. VERTEX SHADER
// ==================================================

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

void main() {

    vec3 position =
        u_transform *
        vec3(aPosition, 1.0);

    gl_Position =
        vec4(position.xy, 0.0, 1.0);
}
`;


// ==================================================
// 10. FRAGMENT SHADER
// ==================================================

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {

    outColor =
        vec4(uColor, 1.0);
}
`;


// ==================================================
// 11. COMPILAR SHADER
// ==================================================

function createShader(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(
        shader,
        gl.COMPILE_STATUS
    )) {

        const error =
            gl.getShaderInfoLog(shader);

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


// ==================================================
// 12. CRIAR PROGRAMA
// ==================================================

const program = gl.createProgram();

gl.attachShader(
    program,
    vertexShader
);

gl.attachShader(
    program,
    fragmentShader
);

gl.linkProgram(program);


if (!gl.getProgramParameter(
    program,
    gl.LINK_STATUS
)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}


// ==================================================
// 13. LOCALIZAÇÕES
// ==================================================

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );


// IMPORTANTE:
// uColor é uniform, não atributo.
const colorLocation =
    gl.getUniformLocation(
        program,
        "uColor"
    );


const transformLocation =
    gl.getUniformLocation(
        program,
        "u_transform"
    );


// ==================================================
// 14. CONFIGURAÇÃO
// ==================================================

gl.clearColor(
    0.1,
    0.1,
    0.1,
    1.0
);


// ==================================================
// 15. FUNÇÃO AUXILIAR PARA DESENHAR
// ==================================================

function desenharObjeto(
    vertices,
    cor,
    matriz,
    modo = gl.TRIANGLES
) {

    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        verticesBuffer
    );

    gl.bufferData(
        gl.ARRAY_BUFFER,
        vertices,
        gl.STATIC_DRAW
    );


    gl.enableVertexAttribArray(
        positionLocation
    );


    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );


    gl.uniform3fv(
        colorLocation,
        cor
    );


    gl.uniformMatrix3fv(
        transformLocation,
        false,
        matriz
    );


    gl.drawArrays(
        modo,
        0,
        vertices.length / 2
    );
}


// ==================================================
// 16. DESENHAR CABEÇA
// ==================================================

function drawCabeca() {

    desenharObjeto(
        verticesCabeca(),
        corCabeca,
        Mcabeca,
        gl.TRIANGLES
    );
}


// ==================================================
// 17. DESENHAR CORPO
// ==================================================

function drawCorpo() {

    desenharObjeto(
        verticesCorpo(),
        corCorpo,
        Mcorpo,
        gl.TRIANGLES
    );
}


// ==================================================
// 18. DESENHAR BRAÇO ESQUERDO
// ==================================================

function drawBracoEsquerdo() {

    desenharObjeto(
        verticesBracoEsquerdo(),
        corBracoEsquerdo,
        MbracoEsquerdo,
        gl.TRIANGLES
    );
}


// ==================================================
// 19. DESENHAR BRAÇO DIREITO
// ==================================================

function drawBracoDireito() {

    desenharObjeto(
        verticesBracoDireito(),
        corBracoDireito,
        MbracoDireito,
        gl.TRIANGLES
    );
}


// ==================================================
// 20. DESENHAR PERNA ESQUERDA
// ==================================================

function drawPernaEsquerda() {

    desenharObjeto(
        verticesPernaEsquerda(),
        corPernaEsquerda,
        MpernaEsquerda,
        gl.TRIANGLES
    );
}


// ==================================================
// 21. DESENHAR PERNA DIREITA
// ==================================================

function drawPernaDireita() {

    desenharObjeto(
        verticesPernaDireita(),
        corPernaDireita,
        MpernaDireita,
        gl.TRIANGLES
    );
}


// ==================================================
// 22. DESENHAR BOCA
// ==================================================

function drawBoca() {

    desenharObjeto(
        verticesBoca(),
        corBoca,
        Mboca,
        gl.TRIANGLES
    );
}


// ==================================================
// 23. DESENHAR OLHOS
// ==================================================

function drawOlhos() {

    const vertices = verticesOlhos();

    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        verticesBuffer
    );

    gl.bufferData(
        gl.ARRAY_BUFFER,
        vertices,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(
        positionLocation
    );

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corOlhos
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        Molhos
    );


    // Cada olho possui:
    // 1 centro + 41 pontos
    //
    // GL_TRIANGLE_FAN:
    // 42 vértices por olho.

    gl.drawArrays(
        gl.TRIANGLE_FAN,
        0,
        42
    );

    gl.drawArrays(
        gl.TRIANGLE_FAN,
        42,
        42
    );
}


// ==================================================
// 24. DRAW SCENE
// ==================================================

function drawScene() {

    // Atualiza os ângulos
    atualizaAnimacao();


    // Calcula as matrizes
    atualizaTransformacoes();


    // Limpa a tela
    gl.clear(
        gl.COLOR_BUFFER_BIT
    );


    gl.useProgram(program);


    // ------------------------------------------------
    // ROBÔ
    // ------------------------------------------------

    drawPernaEsquerda();

    drawPernaDireita();

    drawCorpo();

    drawBracoEsquerdo();

    drawBracoDireito();

    drawCabeca();

    drawBoca();

    drawOlhos();


    // Próximo frame
    requestAnimationFrame(
        drawScene
    );
}


// ==================================================
// 25. INICIAR
// ==================================================

drawScene();