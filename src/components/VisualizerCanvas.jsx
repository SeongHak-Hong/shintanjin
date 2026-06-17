import React, { useRef, useEffect } from 'react';

export default function VisualizerCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }

        const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        const fragmentShaderSource = `
            precision highp float;
            uniform vec2 u_resolution;
            uniform float u_time;

            // Pseudo-random generator for noise
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            // Simplex/Perlin noise helper for fluid motion
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ) );
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ;
                m = m*m ;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                vec2 st = gl_FragCoord.xy / u_resolution.xy;
                
                // Adjust for aspect ratio
                st.x *= u_resolution.x / u_resolution.y;

                // Time scaled for slow, calming movement (very slow)
                float t = u_time * 0.05;

                // Soft technical colors based on SBC brand
                vec3 cWhite = vec3(1.0, 1.0, 1.0);
                vec3 cBeige = vec3(0.95, 0.94, 0.92); // Normalized #f1f0eb (Warm Beige)
                vec3 cLightBlue = vec3(0.85, 0.91, 0.99); // Normalized #d3e7ff (Light Blue)
                vec3 cPointBlue = vec3(0.38, 0.54, 0.82); // Normalized #628ad1 (Point Blue)

                // Create fluid displacement using noise
                vec2 pos = st;
                
                float n1 = snoise(pos * 1.2 + vec2(t * 0.4, t * 0.2));
                float n2 = snoise(pos * 1.5 - vec2(t * 0.3, t * 0.5));
                
                // Positions for soft ambient light circles
                float dBeige = distance(st, vec2(0.1 - n2 * 0.1, 0.1 + n1 * 0.1));
                float dLightBlue = distance(st, vec2(1.1 + n1 * 0.1, 0.6 + n2 * 0.1));
                float dPointBlue = distance(st, vec2(0.5 + n1 * 0.15, 0.4 - n2 * 0.15));

                // Smooth blending to create the clean-tech gradient atmosphere
                vec3 color = cWhite;
                color = mix(color, cBeige, smoothstep(1.3, 0.0, dBeige) * 0.7);
                color = mix(color, cLightBlue, smoothstep(1.4, 0.0, dLightBlue) * 0.6);
                color = mix(color, cPointBlue, smoothstep(1.2, 0.0, dPointBlue) * 0.25);

                // Very minimal vertical depth adjustment
                color -= vec3(st.y * 0.015);

                // Extremely subtle, clean grain (smaller to prevent looking dirty)
                float grain = random(gl_FragCoord.xy * 0.01 + u_time * 0.001);
                color -= (grain * 0.012); 

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compile error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
        const timeUniformLocation = gl.getUniformLocation(program, "u_time");

        function resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        let animationFrameId;
        const startTime = Date.now();

        function render() {
            gl.useProgram(program);
            const currentTime = (Date.now() - startTime) / 1000.0;
            gl.uniform1f(timeUniformLocation, currentTime);
            gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animationFrameId = requestAnimationFrame(render);
        }
        
        render();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div id="canvas-container">
            <canvas ref={canvasRef} id="glcanvas"></canvas>
        </div>
    );
}
