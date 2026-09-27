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
        this.initialPropellerSpeed = 0.05;
        this.propellerSpeed = this.initialPropellerSpeed;
        this.propellerAcceleration = 0.0005;
        this.position = { x: 0.0, y: 0.0, z: 0.0 };
        this.moveSpeed = 0.02;
        this.acceleration = 0.0005;
        this.velocity = { x: 0.0, y: 0.0 };
        this.distanceSpeed = 0.01;
        this.rotationY = 0.0;
        this.rotationX = 0.0;
        this.rotationAcceleration = 0.01;
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
        let targetPropellerSpeed = this.initialPropellerSpeed;

        if (this.keys.arrowup) {
            targetPropellerSpeed = 1.0;
        } else if (this.keys.arrowdown) {
            targetPropellerSpeed = 0.01;
        }

        this.propellerSpeed = this.updateSpeed(
            this.propellerSpeed,
            targetPropellerSpeed
        );

        this.theta += this.propellerSpeed;

        const horizontalDirection =
            (this.keys.arrowright ? 1 : 0) -
            (this.keys.arrowleft ? 1 : 0);
        const verticalDirection =
            (this.keys.arrowup ? 1 : 0) -
            (this.keys.arrowdown ? 1 : 0);
        const distanceDirection =
            (this.keys.w ? 1 : 0) -
            (this.keys.s ? 1 : 0);

        this.velocity.x = this.updateVelocity(
            this.velocity.x,
            horizontalDirection
        );
        this.velocity.y = this.updateVelocity(
            this.velocity.y,
            verticalDirection
        );

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.velocity.x > 0.0001) {
            this.rotationY = Math.PI;
        } else if (this.velocity.x < -0.0001) {
            this.rotationY = 0.0;
        }

        this.position.z = Math.max(
            0.0,
            this.position.z + distanceDirection * this.distanceSpeed
        );

        const scale = 1 / (1 + this.position.z);
        const rotationZ = this.clamp(
            -this.velocity.x * 6,
            -0.15,
            0.15
        );
        const targetRotationX =
            (this.keys.w ? 0.15 : 0.0) -
            (this.keys.s ? 0.15 : 0.0);
        this.rotationX = this.updateRotation(
            this.rotationX,
            targetRotationX
        );

        const helicopterTransform = m4.multiply(
            m4.translation(
                this.position.x,
                this.position.y,
                this.position.z
            ),
            m4.multiply(
                m4.zRotation(rotationZ),
                m4.multiply(
                    m4.xRotation(this.rotationX),
                    m4.multiply(
                        m4.yRotation(this.rotationY),
                        m4.scaling(scale, scale, scale)
                    )
                )
            )
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

    updateVelocity(currentVelocity, direction) {
        const targetVelocity = direction * this.moveSpeed;

        if (currentVelocity < targetVelocity) {
            return Math.min(
                currentVelocity + this.acceleration,
                targetVelocity
            );
        }

        if (currentVelocity > targetVelocity) {
            return Math.max(
                currentVelocity - this.acceleration,
                targetVelocity
            );
        }

        return currentVelocity;
    }

    updateRotation(currentRotation, targetRotation) {
        if (currentRotation < targetRotation) {
            return Math.min(
                currentRotation + this.rotationAcceleration,
                targetRotation
            );
        }

        if (currentRotation > targetRotation) {
            return Math.max(
                currentRotation - this.rotationAcceleration,
                targetRotation
            );
        }

        return currentRotation;
    }

    updateSpeed(currentSpeed, targetSpeed) {
        if (currentSpeed < targetSpeed) {
            return Math.min(
                currentSpeed + this.propellerAcceleration,
                targetSpeed
            );
        }

        if (currentSpeed > targetSpeed) {
            return Math.max(
                currentSpeed - this.propellerAcceleration,
                targetSpeed
            );
        }

        return currentSpeed;
    }

    clamp(value, minimum, maximum) {
        return Math.max(minimum, Math.min(maximum, value));
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
