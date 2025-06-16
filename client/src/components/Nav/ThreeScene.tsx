import '../../index.css'
import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import Background from 'three/src/renderers/common/Background.js';

interface ThreeSceneProps {
    scrollProgress: number;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvasRef.current,
        });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.setZ(50); 
        camera.position.setY(10);
        camera.position.setX(10);

        const geometry = new THREE.SphereGeometry(8, 32, 32);

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const fragmentShader = `
            uniform float u_time;
            varying vec2 vUv;
            void main() {
                float t = u_time * 0.15;
                vec3 color1 = vec3(0.9 + 0.1*sin(t), 0.2 + 0.8*cos(t*1.2), 0.6 + 0.4*sin(t*1.5));
                vec3 color2 = vec3(0.2 + 0.8*cos(t*0.7), 0.9 + 0.1*sin(t*1.3), 0.3 + 0.7*cos(t*1.7));
                vec3 color3 = vec3(0.7 + 0.3*sin(t*1.8), 0.4 + 0.6*cos(t*1.1), 0.9 + 0.1*sin(t*2.1));
                vec3 color4 = vec3(0.3 + 0.7*cos(t*1.4), 0.6 + 0.4*sin(t*1.6), 0.8 + 0.2*cos(t*2.3));
                float g1 = smoothstep(0.0, 0.5, fract(vUv.x + t));
                float g2 = smoothstep(0.0, 0.5, fract(vUv.y - t));
                float g3 = smoothstep(0.0, 0.5, fract(vUv.x + vUv.y + t*0.5));
                float g4 = smoothstep(0.0, 0.5, fract(vUv.x - vUv.y - t*0.7));
                vec3 color = mix(color1, color2, g1);
                color = mix(color, color3, g2);
                color = mix(color, color4, g3 * g4);
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_time: { value: 0 }
            },
            side: THREE.DoubleSide,
            wireframe: false
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.y = 6;
        sphere.position.z = 0; 
        scene.add(sphere);

        const pointLight = new THREE.PointLight(0xffffff);
        pointLight.position.set(10, 10, 10);
        const ambientLight = new THREE.AmbientLight(0xffffff);
        scene.add(pointLight, ambientLight);

        


        const textureLoader = new THREE.TextureLoader();
        const spaceTexture = textureLoader.load('/red gradient.png');
        scene.background = spaceTexture;


        // function Star() {
        //     const starGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        //     const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        //     const star = new THREE.Mesh(starGeometry, starMaterial);
        //     const [x, y, z] = Array(3).fill(0).map(() => THREE.MathUtils.randFloatSpread(200));
        //     star.position.set(x, y, z);
        //     scene.add(star);
        // }
        // Array.from({ length: 1000 }).forEach(Star);

        // let blackholeMixer: THREE.AnimationMixer | undefined;
        // const clock = new THREE.Clock();
        // const gltfLoader = new GLTFLoader();
        // gltfLoader.load('/blackhole.glb', (gltf: any) => {
        //     const blackhole = gltf.scene;
        //     blackhole.position.set(0, 0, 0);
        //     blackhole.scale.set(20, 20, 20);
        //     scene.add(blackhole);
        //     if (gltf.animations && gltf.animations.length > 0) {
        //         blackholeMixer = new THREE.AnimationMixer(blackhole);
        //         gltf.animations.forEach((clip: THREE.AnimationClip) => {
        //             blackholeMixer!.clipAction(clip).play();
        //         });
        //     }
        // });

        // scene.fog = new THREE.FogExp2(0x05010a, 0.008);

        // const controls = new OrbitControls(camera, renderer.domElement);
        // controls.enableZoom = false;
        // controls.enablePan = false;
        // controls.enableRotate = false;

        function animate(time: number = 0) {
            requestAnimationFrame(animate);
            // const delta = clock.getDelta();
            // if (blackholeMixer) blackholeMixer.update(delta);
            (sphere.material as THREE.ShaderMaterial).uniforms.u_time.value = time * 0.001;
            
            const baseDistance = 50;
            const maxZoomOut = 150;
            const zoomDistance = baseDistance + (maxZoomOut - baseDistance) * scrollProgress;
            camera.position.z = zoomDistance;
            camera.position.y = 10 + (30 * scrollProgress);
            camera.position.x = 10;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
            sphere.rotation.x += 0.01;
            sphere.rotation.y += 0.005;
            sphere.rotation.z += 0.01;
        }
        animate();

        return () => {
            renderer.dispose();
        }
    }, [scrollProgress])
    
    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 0
            }}
        />
    );
}

export default ThreeScene;