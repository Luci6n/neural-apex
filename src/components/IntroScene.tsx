import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'

export function IntroScene() {
  return (
    <Canvas
      camera={{ position: [0, 5.5, 8.5], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 10, 6]} intensity={2.8} />
      <FloatingRace />
    </Canvas>
  )
}

export function IntroOrbScene() {
  return (
    <Canvas camera={{ position: [0, 0.4, 7], fov: 38 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 5, 5]} intensity={2.2} />
      <pointLight position={[0.8, 1.2, 3]} color="#54e6ef" intensity={16} distance={7} />
      <StrategySphere />
    </Canvas>
  )
}

function FloatingRace() {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-7, -1.1, 3.4),
          new THREE.Vector3(-4.4, -0.6, 2),
          new THREE.Vector3(-1.4, 0, 0.4),
          new THREE.Vector3(2.2, 0.65, -1.5),
          new THREE.Vector3(5.3, 1.5, -3.3),
          new THREE.Vector3(8, 2.4, -4.8),
        ],
        false,
        'catmullrom',
        0.3,
      ),
    [],
  )
  const road = useMemo(() => createRoadRibbon(curve, 1.35, 90), [curve])

  return (
    <group rotation={[0, -0.16, 0]}>
      <mesh geometry={road}>
        <meshStandardMaterial color="#1c3547" roughness={0.72} metalness={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={road} position-y={-0.16}>
        <meshStandardMaterial color="#071a2c" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <RaceLine curve={curve} />
      <MovingCar curve={curve} offset={0} lane={-0.3} color="#ff633f" />
      <MovingCar curve={curve} offset={0.16} lane={0.3} color="#54e6ef" />
      <MovingCar curve={curve} offset={0.32} lane={-0.1} color="#a88cff" />
      <SignalGate curve={curve} t={0.23} color="#ff9b62" />
      <SignalGate curve={curve} t={0.5} color="#54e6ef" />
      <SignalGate curve={curve} t={0.76} color="#a88cff" />
    </group>
  )
}

function StrategySphere() {
  return (
    <group rotation={[0.15, -0.22, 0]}>
      <mesh>
        <sphereGeometry args={[2.1, 36, 24]} />
        <meshStandardMaterial color="#06192b" metalness={0.42} roughness={0.38} transparent opacity={0.94} />
      </mesh>
      <mesh rotation={[0.35, 0.1, -0.18]}>
        <torusGeometry args={[2.45, 0.025, 6, 90]} />
        <meshBasicMaterial color="#54e6ef" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-0.45, 0.25, 0.5]}>
        <torusGeometry args={[2.32, 0.018, 6, 90]} />
        <meshBasicMaterial color="#a88cff" transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

function MovingCar({ curve, offset, lane, color }: { curve: THREE.CatmullRomCurve3; offset: number; lane: number; color: string }) {
  const ref = useRef<THREE.Group>(null)
  const point = useMemo(() => new THREE.Vector3(), [])
  const tangent = useMemo(() => new THREE.Vector3(), [])
  const normal = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = 1 - ((clock.elapsedTime * 0.07 + offset) % 1)
    curve.getPointAt(t, point)
    curve.getTangentAt(t, tangent).normalize()
    normal.set(-tangent.z, 0, tangent.x)
    ref.current.position.copy(point).addScaledVector(normal, lane)
    ref.current.position.y += 0.14
    // The cars travel from high t to low t, so their nose follows the inverse tangent.
    ref.current.rotation.y = Math.atan2(-tangent.x, -tangent.z)
  })

  return <OpenWheelCar carRef={ref} color={color} />
}

function RaceLine({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 90, 0.025, 5, false), [curve])
  return (
    <mesh geometry={geometry} position-y={0.06}>
      <meshBasicMaterial color="#54e6ef" transparent opacity={0.7} />
    </mesh>
  )
}

function SignalGate({ curve, t, color }: { curve: THREE.CatmullRomCurve3; t: number; color: string }) {
  const placement = useMemo(() => {
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    return { point, rotation: Math.atan2(tangent.x, tangent.z) }
  }, [curve, t])

  return (
    <group position={placement.point} rotation-y={placement.rotation}>
      <mesh position={[-1.5, 1, 0]}><boxGeometry args={[0.05, 2, 0.05]} /><meshBasicMaterial color={color} /></mesh>
      <mesh position={[1.5, 1, 0]}><boxGeometry args={[0.05, 2, 0.05]} /><meshBasicMaterial color={color} /></mesh>
      <mesh position={[0, 2, 0]}><boxGeometry args={[3.05, 0.08, 0.08]} /><meshBasicMaterial color={color} /></mesh>
    </group>
  )
}

function OpenWheelCar({ carRef, color }: { carRef: RefObject<THREE.Group | null>; color: string }) {
  const wheels: Array<[number, number, number]> = [
    [-0.9, 0.32, 1], [0.9, 0.32, 1], [-0.95, 0.34, -1], [0.95, 0.34, -1],
  ]
  return (
    <group ref={carRef} scale={0.54}>
      <mesh position={[0, 0.28, 0]}><boxGeometry args={[1.3, 0.24, 3]} /><meshStandardMaterial color={color} metalness={0.4} roughness={0.26} /></mesh>
      <mesh position={[0, 0.36, 1.55]}><boxGeometry args={[0.42, 0.18, 1.4]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.7, -0.2]}><sphereGeometry args={[0.43, 10, 7]} /><meshStandardMaterial color="#071d31" metalness={0.6} roughness={0.2} /></mesh>
      <mesh position={[0, 0.34, 2.15]}><boxGeometry args={[2.3, 0.12, 0.38]} /><meshStandardMaterial color="#d9edf0" /></mesh>
      <mesh position={[0, 0.75, -1.55]}><boxGeometry args={[2, 0.15, 0.38]} /><meshStandardMaterial color="#d9edf0" /></mesh>
      {wheels.map(([x, y, z], index) => (
        <mesh key={index} position={[x, y, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.38, 0.38, 0.32, 10]} />
          <meshStandardMaterial color="#05090d" />
        </mesh>
      ))}
    </group>
  )
}

function createRoadRibbon(curve: THREE.CatmullRomCurve3, halfWidth: number, segments: number) {
  const vertices: number[] = []
  const indices: number[] = []
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
    const left = point.clone().addScaledVector(normal, -halfWidth)
    const right = point.clone().addScaledVector(normal, halfWidth)
    vertices.push(left.x, left.y, left.z, right.x, right.y, right.z)
    if (index < segments) {
      const base = index * 2
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
