import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface PanoramaViewerProps {
  images: string[];
  activeIndex: number;
}

export default function PanoramaViewer({ images, activeIndex }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    
    // ATUALIZADO: De outputEncoding para outputColorSpace
    renderer.outputColorSpace = THREE.SRGBColorSpace; 
    
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 2000);
    camera.position.set(0, 0, 0.1);
    cameraRef.current = camera;

    const geometry = new THREE.SphereGeometry(500, 64, 40);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    meshRef.current = sphere;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI - 0.1;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const targetImage = images[activeIndex % images.length];
    if (!targetImage || !meshRef.current || !rendererRef.current) return;

    setLoading(true);
    const loader = new THREE.TextureLoader();

    loader.load(
      targetImage,
      (texture) => {
        // ATUALIZADO: De encoding para colorSpace
        texture.colorSpace = THREE.SRGBColorSpace;
        
        texture.anisotropy = rendererRef.current?.capabilities.getMaxAnisotropy() ?? 1;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        if (meshRef.current) {
          meshRef.current.material.map = texture;
          meshRef.current.material.needsUpdate = true;
        }
        setLoading(false);
      },
      undefined,
      () => setLoading(false),
    );
  }, [activeIndex, images]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-black" ref={containerRef}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm tracking-[0.25em] uppercase z-10 pointer-events-none">
          Carregando tour 360...
        </div>
      )}
    </div>
  );
}