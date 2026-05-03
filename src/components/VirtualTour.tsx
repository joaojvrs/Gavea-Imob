import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export interface TourHotspot {
  yaw: number;
  pitch: number;
  targetIndex: number;
  label: string;
}

export interface TourScene {
  image: string;
  roomName: string;
  hotspots: TourHotspot[];
}

interface VirtualTourProps {
  scenes: TourScene[];
  initialIndex?: number;
}

function makeArrowTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const cx = S / 2, cy = S / 2;

  const glow = g.createRadialGradient(cx, cy, 55, cx, cy, 128);
  glow.addColorStop(0, "rgba(255,255,255,0.18)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, S, S);

  g.beginPath();
  g.arc(cx, cy, 84, 0, Math.PI * 2);
  g.fillStyle = "rgba(5,15,40,0.58)";
  g.fill();

  g.beginPath();
  g.arc(cx, cy, 84, 0, Math.PI * 2);
  g.strokeStyle = "rgba(255,255,255,0.95)";
  g.lineWidth = 7;
  g.stroke();

  g.beginPath();
  g.moveTo(cx - 30, cy + 18);
  g.lineTo(cx, cy - 22);
  g.lineTo(cx + 30, cy + 18);
  g.strokeStyle = "white";
  g.lineWidth = 13;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.stroke();

  return new THREE.CanvasTexture(c);
}

function makeLabelTexture(text: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 72;
  const g = c.getContext("2d")!;
  g.font = "600 24px system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const tw = g.measureText(text).width;
  const pw = tw + 52, ph = 52;
  const bx = (512 - pw) / 2, by = 10, r = 26;
  g.beginPath();
  g.moveTo(bx + r, by);
  g.arcTo(bx + pw, by, bx + pw, by + ph, r);
  g.arcTo(bx + pw, by + ph, bx, by + ph, r);
  g.arcTo(bx, by + ph, bx, by, r);
  g.arcTo(bx, by, bx + pw, by, r);
  g.closePath();
  g.fillStyle = "rgba(0,0,0,0.65)";
  g.fill();
  g.fillStyle = "white";
  g.fillText(text, 256, by + ph / 2);
  return new THREE.CanvasTexture(c);
}

function yawPitchToVec(yaw: number, pitch: number, radius: number): THREE.Vector3 {
  const yr = THREE.MathUtils.degToRad(yaw);
  const pr = THREE.MathUtils.degToRad(pitch);
  return new THREE.Vector3(
    radius * Math.cos(pr) * Math.sin(yr),
    radius * Math.sin(pr),
    -radius * Math.cos(pr) * Math.cos(yr)
  );
}

export default function VirtualTour({ scenes, initialIndex = 0 }: VirtualTourProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scenesRef = useRef(scenes);
  const navigateRef = useRef<(index: number) => void>(() => {});
  useEffect(() => { scenesRef.current = scenes; }, [scenes]);

  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentRoom, setCurrentRoom] = useState(scenes[initialIndex]?.roomName ?? "");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth || container.offsetWidth || 800;
    const H = container.clientHeight || container.offsetHeight || 450;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cursor = "grab";
    container.appendChild(renderer.domElement);

    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 2000);
    camera.position.set(0, 0, 0.1);

    const sphereGeo = new THREE.SphereGeometry(500, 64, 40);
    sphereGeo.scale(-1, 1, 1);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    threeScene.add(sphere);

    const fadeGeo = new THREE.SphereGeometry(490, 32, 16);
    fadeGeo.scale(-1, 1, 1);
    const fadeMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0, depthWrite: false,
    });
    threeScene.add(new THREE.Mesh(fadeGeo, fadeMat));

    const hotspotGroup = new THREE.Group();
    threeScene.add(hotspotGroup);

    const arrowTex = makeArrowTexture();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI - 0.15;

    let isTransitioning = false;
    let clickableSprites: THREE.Sprite[] = [];

    function animFade(from: number, to: number, ms: number, done: () => void) {
      const t0 = performance.now();
      const tick = () => {
        const t = Math.min((performance.now() - t0) / ms, 1);
        const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        fadeMat.opacity = from + (to - from) * e;
        if (t < 1) requestAnimationFrame(tick);
        else { fadeMat.opacity = to; done(); }
      };
      requestAnimationFrame(tick);
    }

    function buildHotspots(sd: TourScene) {
      clickableSprites = [];
      while (hotspotGroup.children.length) {
        const s = hotspotGroup.children[0] as THREE.Sprite;
        (s.material as THREE.SpriteMaterial).map?.dispose();
        (s.material as THREE.SpriteMaterial).dispose();
        hotspotGroup.remove(s);
      }
      sd.hotspots.forEach((h) => {
        const am = new THREE.SpriteMaterial({ map: arrowTex, transparent: true, depthTest: false });
        const arrow = new THREE.Sprite(am);
        arrow.position.copy(yawPitchToVec(h.yaw, h.pitch, 200));
        arrow.scale.setScalar(38);
        arrow.renderOrder = 1;
        arrow.userData.targetIndex = h.targetIndex;
        hotspotGroup.add(arrow);
        clickableSprites.push(arrow);

        const lm = new THREE.SpriteMaterial({
          map: makeLabelTexture(h.label), transparent: true, depthTest: false,
        });
        const label = new THREE.Sprite(lm);
        label.position.copy(yawPitchToVec(h.yaw, h.pitch + 9, 200));
        label.scale.set(84, 12, 1);
        label.renderOrder = 2;
        hotspotGroup.add(label);
      });
    }

    function loadScene(idx: number, done: () => void) {
      const sd = scenesRef.current[idx];
      if (!sd) { done(); return; }
      new THREE.TextureLoader().load(
        sd.image,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          sphereMat.map = tex;
          sphereMat.color.set(0xffffff);
          sphereMat.needsUpdate = true;
          buildHotspots(sd);
          done();
        },
        undefined,
        () => done()
      );
    }

    function navigate(targetIdx: number) {
      if (isTransitioning || targetIdx === undefined || targetIdx < 0) return;
      isTransitioning = true;
      animFade(0, 1, 320, () => {
        loadScene(targetIdx, () => {
          setCurrentIndex(targetIdx);
          setCurrentRoom(scenesRef.current[targetIdx]?.roomName ?? "");
          animFade(1, 0, 320, () => { isTransitioning = false; });
        });
      });
    }

    navigateRef.current = navigate;

    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    let pdx = 0, pdy = 0, dragged = false;

    const onDown = (e: PointerEvent) => { pdx = e.clientX; pdy = e.clientY; dragged = false; };
    const onMove = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - pdx, e.clientY - pdy) > 4) dragged = true;
      const rect = renderer.domElement.getBoundingClientRect();
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      renderer.domElement.style.cursor =
        raycaster.intersectObjects(clickableSprites).length ? "pointer" : "grab";
    };
    const onUp = (e: PointerEvent) => {
      if (dragged || isTransitioning) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      const hits = raycaster.intersectObjects(clickableSprites);
      if (hits.length) navigate(hits[0].object.userData.targetIndex as number);
    };

    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);

    let rafId = 0;
    const clock = new THREE.Clock();
    const loop = () => {
      rafId = requestAnimationFrame(loop);
      controls.update();
      const t = clock.getElapsedTime();
      clickableSprites.forEach((s, i) => s.scale.setScalar(34 + 5 * Math.sin(t * 2.5 + i * 1.8)));
      renderer.render(threeScene, camera);
    };
    loop();

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    window.addEventListener("resize", onResize);

    loadScene(initialIndex, () => setLoading(false));

    return () => {
      cancelAnimationFrame(rafId);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      controls.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      fadeGeo.dispose();
      fadeMat.dispose();
      arrowTex.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line

  return (
    <div className="relative h-full w-full bg-black select-none" ref={containerRef}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: `${-0.3 + i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hint — shown briefly on first load */}
      {!loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none animate-fade-out">
          <span className="bg-black/50 backdrop-blur-md text-white/70 text-[10px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-full">
            Arraste para explorar · Clique nas setas para avançar
          </span>
        </div>
      )}

      {/* Current room */}
      {!loading && currentRoom && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span className="bg-black/55 backdrop-blur-md text-white text-[11px] uppercase tracking-[0.3em] font-bold px-4 py-2 rounded-full">
            {currentRoom}
          </span>
        </div>
      )}

      {/* Scene dots — clickable */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        {scenes.map((s, i) => (
          <button
            key={i}
            title={s.roomName}
            onClick={() => navigateRef.current(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "w-2 h-6 bg-white"
                : "w-2 h-2 bg-white/35 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
