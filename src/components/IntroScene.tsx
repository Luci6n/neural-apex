import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'

export function IntroScene() {
  return (
    <Canvas camera={{ position: [8, 6.5, 10], fov: 44 }} dpr={[1, 1.4]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 9, 4]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-4, 2, 0]} intensity={18} color="#ff9b62" distance={8} />
      <pointLight position={[0, 2, -3]} intensity={18} color="#54e6ef" distance={8} />
      <pointLight position={[4, 2, 1]} intensity={18} color="#a88cff" distance={8} />
      <StrategyModel />
    </Canvas>
  )
}

function StrategyModel() {
  const rig = useRef<THREE.Group>(null)
  const car = useRef<THREE.Group>(null)
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.2, 0, 0.7), new THREE.Vector3(-2.4, 0.25, -2.5),
    new THREE.Vector3(0.5, 0.05, -3.1), new THREE.Vector3(4.1, 0, -1.4),
    new THREE.Vector3(4.4, 0.1, 1.7), new THREE.Vector3(1.4, 0.25, 3),
    new THREE.Vector3(-2.6, 0, 2.5),
  ], true, 'catmullrom', 0.35), [])
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 100, 0.055, 6, true), [curve])
  const point = useMemo(() => new THREE.Vector3(), [])
  const tangent = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, delta) => {
    if (rig.current) rig.current.rotation.y += delta * 0.055
    if (!car.current) return
    const t = (clock.elapsedTime * 0.055) % 1
    curve.getPointAt(t, point)
    curve.getTangentAt(t, tangent)
    car.current.position.copy(point).add(new THREE.Vector3(0, 0.2, 0))
    car.current.rotation.y = Math.atan2(tangent.x, tangent.z)
  })

  return (
    <group ref={rig} rotation={[-0.15, -0.25, 0]}>
      <mesh geometry={tube}><meshStandardMaterial color="#54e6ef" emissive="#1a8292" emissiveIntensity={1.8} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.18}>
        <cylinderGeometry args={[5.3, 5.3, 0.18, 48]} />
        <meshStandardMaterial color="#081d34" metalness={0.55} roughness={0.38} transparent opacity={0.88} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.07}>
        <ringGeometry args={[4.65, 4.72, 64]} />
        <meshBasicMaterial color="#456e83" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <SignalBeacon position={[-4.1, 0, 0.7]} color="#ff9b62" shape="predict" />
      <SignalBeacon position={[0.5, 0, -3.1]} color="#54e6ef" shape="detect" />
      <SignalBeacon position={[4.2, 0, 1.7]} color="#a88cff" shape="adapt" />
      <OpenWheelCar carRef={car} />
    </group>
  )
}

function SignalBeacon({ position, color, shape }: { position: [number, number, number]; color: string; shape: string }) {
  return (
    <group position={position}>
      <mesh position-y={0.9}><cylinderGeometry args={[0.035, 0.035, 1.8, 6]} /><meshBasicMaterial color={color} transparent opacity={0.7} /></mesh>
      <mesh position-y={1.95} rotation-y={shape === 'adapt' ? 0.7 : 0}>
        {shape === 'predict' ? <octahedronGeometry args={[0.42]} /> : shape === 'detect' ? <icosahedronGeometry args={[0.42, 0]} /> : <torusKnotGeometry args={[0.28, 0.09, 30, 5]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.4} metalness={0.25} roughness={0.25} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}><ringGeometry args={[0.45, 0.58, 24]} /><meshBasicMaterial color={color} transparent opacity={0.65} side={THREE.DoubleSide} /></mesh>
    </group>
  )
}

function OpenWheelCar({ carRef }: { carRef: RefObject<THREE.Group | null> }) {
  return (
    <group ref={carRef} scale={0.48}>
      <mesh position={[0, .28, 0]}><boxGeometry args={[1.3, .24, 3]} /><meshStandardMaterial color="#ff633f" metalness={.4} roughness={.26} /></mesh>
      <mesh position={[0, .36, 1.55]}><boxGeometry args={[.42, .18, 1.4]} /><meshStandardMaterial color="#ff633f" /></mesh>
      <mesh position={[0, .7, -.2]}><sphereGeometry args={[.43, 10, 7]} /><meshStandardMaterial color="#071d31" metalness={.6} roughness={.2} /></mesh>
      <mesh position={[0, .34, 2.15]}><boxGeometry args={[2.3, .12, .38]} /><meshStandardMaterial color="#d9edf0" /></mesh>
      <mesh position={[0, .75, -1.55]}><boxGeometry args={[2, .15, .38]} /><meshStandardMaterial color="#d9edf0" /></mesh>
      {[[-.9,.32,1], [.9,.32,1], [-.95,.34,-1], [.95,.34,-1]].map(([x,y,z], index) => <mesh key={index} position={[x,y,z]} rotation-z={Math.PI/2}><cylinderGeometry args={[.38,.38,.32,10]} /><meshStandardMaterial color="#05090d" /></mesh>)}
    </group>
  )
}
