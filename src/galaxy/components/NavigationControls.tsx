import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  speed?: number;
}

export function KeyboardControls({ speed = 2.0 }: Props) {
  const { camera, controls } = useThree();
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const k = keys.current;
    const onDown = (e: KeyboardEvent) => k.add(e.code);
    const onUp = (e: KeyboardEvent) => k.delete(e.code);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const moveVector = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  useFrame((state, delta) => {
    const k = keys.current;
    if (k.size === 0) return;

    // OrbitControls usually attaches itself to the state, especially with makeDefault
    const orbit = (state.controls as any) || (controls as any);
    if (!orbit) return;

    const moveX = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
    const moveZ = (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) - (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0);
    const moveY = (k.has("Space") ? 1 : 0) - (k.has("ShiftLeft") ? 1 : 0);

    if (moveX !== 0 || moveZ !== 0 || moveY !== 0) {
      // Get camera forward/right vectors projected on XZ plane
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      
      right.crossVectors(forward, camera.up);
      right.y = 0;
      right.normalize();

      moveVector.set(0, 0, 0);
      moveVector.addScaledVector(right, moveX);
      moveVector.addScaledVector(forward, -moveZ); // W is forward
      moveVector.y += moveY;

      const moveSpeed = speed * delta * 60 * (camera.position.y / 100); // Scale with height
      const finalVector = moveVector.normalize().multiplyScalar(moveSpeed);

      camera.position.add(finalVector);
      orbit.target.add(finalVector);
      orbit.update();
    }
  });

  return null;
}
