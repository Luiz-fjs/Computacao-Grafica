// ==================================================
// CLASS - SCENE
// ==================================================

class Scene {

    constructor(gl, program) {

        this.renderer =
            new Renderer(gl, program);

        // Figura que será exibida
        this.helicopterBody = new HelicopterBody();

        this.helicopterTopShaft = new HelicopterTopShaft();

        this.helicopterTail = new HelicopterTail();

        this.helicopterPropellers = new HelicopterPropellers();

        this.helicopterTailPropeller = new HelicopterTailPropeller();

        this.theta = 0.0;
        this.position = { x: 0.0, y: 0.0 };
        this.moveSpeed = 0.01;
        this.keys = {};

        window.addEventListener("keydown", (event) => {
            if (event.key.startsWith("Arrow")) {
                this.keys[event.key] = true;
                event.preventDefault();
            }
        });

        window.addEventListener("keyup", (event) => {
            if (event.key.startsWith("Arrow")) {
                this.keys[event.key] = false;
                event.preventDefault();
            }
        });

        window.addEventListener("blur", () => {
            this.keys = {};
        });
    }

    update() {
        this.theta += 0.01;

        if (this.keys.ArrowLeft) {
            this.position.x -= this.moveSpeed;
        }
        if (this.keys.ArrowRight) {
            this.position.x += this.moveSpeed;
        }
        if (this.keys.ArrowUp) {
            this.position.y += this.moveSpeed;
        }
        if (this.keys.ArrowDown) {
            this.position.y -= this.moveSpeed;
        }

        const helicopterTransform = m4.translation(
            this.position.x,
            this.position.y,
            0
        );

        // Mantem as partes fixas no lugar.
        this.helicopterBody.update(helicopterTransform);
        this.helicopterTopShaft.update(helicopterTransform);
        this.helicopterTail.update(helicopterTransform);

        // Rotor superior: gira no eixo Y em torno do centro (0, 0.35, 0).
        this.helicopterPropellers.update(
            m4.multiply(
                helicopterTransform,
                m4.multiply(
                    m4.translation(0, 0.35, 0),
                    m4.multiply(
                        m4.yRotation(this.theta),
                        m4.translation(0, -0.35, 0)
                    )
                )
            )
        );

        // Rotor da cauda: gira no eixo Z em torno do centro (0.7, 0, 0.06).
        this.helicopterTailPropeller.update(
            m4.multiply(
                helicopterTransform,
                m4.multiply(
                    m4.translation(0.7, 0, 0.06),
                    m4.multiply(
                        m4.zRotation(this.theta),
                        m4.translation(-0.7, 0, -0.06)
                    )
                )
            )
        );
    }

    draw() {

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        gl.useProgram(program);

        this.helicopterBody.draw(
            this.renderer
        );

        this.helicopterTopShaft.draw(
            this.renderer
        );

        this.helicopterTail.draw(
            this.renderer
        );

        this.helicopterPropellers.draw(
            this.renderer
        );

        this.helicopterTailPropeller.draw(
            this.renderer
        );
    }

    execute() {

        this.update();
        this.draw();

        requestAnimationFrame(
            () => this.execute()
        );
    }

    init() {

        requestAnimationFrame(
            () => this.execute()
        );
    }
}
