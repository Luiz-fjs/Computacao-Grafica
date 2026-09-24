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
        this.position = { x: 0.0, y: 0.0, z: 0.0 };
        this.moveSpeed = 0.02;
        this.distanceSpeed = 0.01;
        this.keys = {};

        window.addEventListener("keydown", (event) => {
            const key = event.key.toLowerCase();

            if (key.startsWith("arrow") || key === "w" || key === "s") {
                this.keys[key] = true;
                event.preventDefault();
            }
        });

        window.addEventListener("keyup", (event) => {
            const key = event.key.toLowerCase();

            if (key.startsWith("arrow") || key === "w" || key === "s") {
                this.keys[key] = false;
                event.preventDefault();
            }
        });

        window.addEventListener("blur", () => {
            this.keys = {};
        });
    }

    update() {
        this.theta += 0.01;

        if (this.keys.arrowleft) {
            this.position.x -= this.moveSpeed;
        }
        if (this.keys.arrowright) {
            this.position.x += this.moveSpeed;
        }
        if (this.keys.arrowup) {
            this.position.y += this.moveSpeed;
        }
        if (this.keys.arrowdown) {
            this.position.y -= this.moveSpeed;
        }
        if (this.keys.w) {
            this.position.z += this.distanceSpeed;
        }
        if (this.keys.s) {
            this.position.z = Math.max(
                0.0,
                this.position.z - this.distanceSpeed
            );
        }

        const scale = 1 / (1 + this.position.z);

        const helicopterTransform = m4.multiply(
            m4.translation(
                this.position.x,
                this.position.y,
                this.position.z
            ),
            m4.scaling(scale, scale, scale)
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
