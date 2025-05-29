import './index.css'
import * as THREE from 'three';
import { useRef, useEffect } from 'react';

const ThreeScene = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvasRef.current 
        });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.setZ(30);

        renderer.render(scene, camera);

        // Handle cleanup
        return () => {
            renderer.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0 }} />;
}

export default ThreeScene;