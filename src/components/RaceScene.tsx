import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { advanceRace, createRace, resolveDecision } from '../game/simulation'
import { createTrackCurve } from '../game/tracks'
import type { RaceConfig, RaceDecision, RaceSnapshot, StrategyCommand } from '../game/types'

interface RaceSceneProps {
  config: RaceConfig
  strategy: StrategyCommand
  decision: RaceDecision | null
  paused: boolean
  onSnapshot: (snapshot: RaceSnapshot) => void
  onNeedDecision: () => void
  onFinish: (snapshot: RaceSnapshot) => void
}

export function RaceScene(props: RaceSceneProps) {
  return (
    <Canvas
      className="race-canvas"
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [0, 8, 12], fov: 52, near: 0.1, far: 240 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <RaceWorld {...props} />
    </Canvas>
  )
}

function RaceWorld({
  config,
  strategy,
  decision,
  paused,
  onSnapshot,
  onNeedDecision,
  onFinish,
}: RaceSceneProps) {
  const curve = useMemo(() => createTrackCurve(config.circuit), [config.circuit])
  const road = useMemo(() => createStripGeometry(curve, -3.6, 3.6, 300), [curve])
  const innerCurb = useMemo(() => createStripGeometry(curve, -4, -3.6, 300), [curve])
  const outerCurb = useMemo(() => createStripGeometry(curve, 3.6, 4, 300), [curve])
  const racingLine = useMemo(() => createStripGeometry(curve, -0.065, 0.065, 240), [curve])
  const terrain = useMemo(() => createTerrainGeometry(curve), [curve])
  const simulation = useRef(createRace(config))
  const carRefs = useRef<Array<THREE.Group | null>>([])
  const snapshotClock = useRef(0)
  const frameCount = useRef(0)
  const finishSent = useRef(false)
  const decisionSent = useRef(false)
  const appliedDecision = useRef<RaceDecision | null>(null)
  const { camera, gl } = useThree()
  const desiredCamera = useMemo(() => new THREE.Vector3(), [])
  const lookAt = useMemo(() => new THREE.Vector3(), [])
  const point = useMemo(() => new THREE.Vector3(), [])
  const tangent = useMemo(() => new THREE.Vector3(), [])
  const normal = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.1
    gl.shadowMap.type = THREE.PCFSoftShadowMap
  }, [gl])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qa = params.get('qa')
    const qaRace = qa === 'race' || qa === 'ardennes' || qa === 'british' || qa === 'catalunya'
    if (!qaRace && params.get('qaHooks') !== '1') return
    window.__THREE_GAME_TEST_HOOKS__ = {
      seed: () => undefined,
      setState: (name: string) => {
        const state = simulation.current
        if (name === 'decision') {
          state.racers[0].progress = 0.619
          state.playerProgress = 0.619
          state.lapProgress = 0.619
          state.needsDecision = false
          state.decision = null
          decisionSent.current = false
        }
        if (name === 'finish') {
          state.racers[0].progress = state.totalLaps - 0.001
          state.playerProgress = state.totalLaps - 0.001
          state.lapProgress = 0.999
          state.needsDecision = false
          finishSent.current = false
        }
      },
    }
    return () => {
      delete window.__THREE_GAME_TEST_HOOKS__
    }
  }, [])

  useEffect(() => {
    if (decision && appliedDecision.current !== decision) {
      resolveDecision(simulation.current, decision)
      appliedDecision.current = decision
      onSnapshot(cloneSnapshot(simulation.current))
    }
  }, [decision, onSnapshot])

  useFrame((_, delta) => {
    frameCount.current += 1
    const state = simulation.current
    if (!paused) advanceRace(state, config, strategy, delta)

    state.racers.forEach((racer, index) => {
      const car = carRefs.current[index]
      if (!car) return
      placeOnTrack(car, curve, racer.progress, racer.lane, point, tangent, normal)
    })

    const player = state.racers[0]
    const trackT = THREE.MathUtils.euclideanModulo(player.progress, 1)
    curve.getPointAt(trackT, point)
    curve.getTangentAt(trackT, tangent).normalize()
    normal.set(-tangent.z, 0, tangent.x)
    point.addScaledVector(normal, player.lane * 2.35)
    desiredCamera.copy(point).addScaledVector(tangent, -14).add(new THREE.Vector3(0, 11.5, 0))
    lookAt.copy(point).addScaledVector(tangent, 10).add(new THREE.Vector3(0, 0.5, 0))
    camera.position.lerp(desiredCamera, 1 - Math.exp(-delta * 2.8))
    camera.lookAt(lookAt)

    snapshotClock.current += delta
    if (snapshotClock.current > 0.12) {
      snapshotClock.current = 0
      onSnapshot(cloneSnapshot(state))
    }
    if (state.needsDecision && !decisionSent.current) {
      decisionSent.current = true
      onNeedDecision()
    }
    if (state.finished && !finishSent.current) {
      finishSent.current = true
      onFinish(cloneSnapshot(state))
    }

    const diagnostics = {
      frame: frameCount.current,
      phase: state.finished ? 'finished' : state.needsDecision ? 'decision' : 'racing',
      lap: state.lap,
      position: state.position,
      progress: state.playerProgress,
      complete: state.finished,
      fail: false,
      player: {
        x: state.racers[0].lane,
        y: 0,
        z: state.playerProgress,
      },
      renderer: {
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
      },
    }
    window.__NEURAL_APEX__ = diagnostics
    window.__THREE_GAME_DIAGNOSTICS__ = diagnostics
  })

  const state = simulation.current
  return (
    <>
      <color attach="background" args={[state.rain > 0.2 ? '#728aa0' : '#9ed8ec']} />
      <fog attach="fog" args={[state.rain > 0.2 ? '#728aa0' : '#9ed8ec', 48, 105]} />
      <ambientLight intensity={1.25} color="#dff7ff" />
      <directionalLight
        castShadow
        position={[22, 35, 14]}
        intensity={2.4}
        color="#fff1ca"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={90}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
      />
      <hemisphereLight args={['#bfeaff', '#547b43', 1.2]} />

      <mesh geometry={terrain} receiveShadow>
        <meshStandardMaterial color="#5e963e" roughness={1} />
      </mesh>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial color={state.rain > 0.12 ? '#172a38' : '#273745'} roughness={state.rain > 0.12 ? 0.48 : 0.86} metalness={state.rain > 0.12 ? 0.18 : 0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={innerCurb} position-y={0.025} receiveShadow>
        <meshStandardMaterial color="#f1e4c5" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={outerCurb} position-y={0.025} receiveShadow>
        <meshStandardMaterial color="#f46b47" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={racingLine} position-y={0.045}>
        <meshBasicMaterial color="#54e6ef" transparent opacity={0.42} side={THREE.DoubleSide} />
      </mesh>

      <WorldKit curve={curve} circuit={config.circuit} rain={state.rain} windKph={state.windKph} />
      {state.racers.map((racer, index) => (
        <BlockCar
          key={racer.id}
          color={racer.color}
          player={index === 0}
          damage={racer.damage}
          retired={racer.retired}
          carRef={(node) => {
            carRefs.current[index] = node
          }}
        />
      ))}
      <Rain intensity={state.rain} windKph={state.windKph} />
    </>
  )
}

function BlockCar({
  color,
  player,
  damage,
  retired,
  carRef,
}: {
  color: string
  player: boolean
  damage: RaceSnapshot['racers'][number]['damage']
  retired: boolean
  carRef: (node: THREE.Group | null) => void
}) {
  return (
    <group ref={carRef} scale={player ? 1 : 0.93}>
      <mesh castShadow={player} position={[0, 0.34, -0.05]}>
        <boxGeometry args={[1.45, 0.12, 3.85]} />
        <meshStandardMaterial color="#101820" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh castShadow={player} position={[0, 0.61, -0.22]}>
        <boxGeometry args={[0.86, 0.48, 2.55]} />
        <meshStandardMaterial color={retired ? '#4b5358' : color} roughness={0.3} metalness={0.34} />
      </mesh>
      <mesh castShadow={player} position={[0, 0.52, 1.78]}>
        <boxGeometry args={[0.4, 0.24, 1.75]} />
        <meshStandardMaterial color={color} roughness={0.28} metalness={0.36} />
      </mesh>
      {[-0.68, 0.68].map((x) => (
        <mesh key={'pod-' + x} castShadow={player} position={[x, 0.62, -0.25]} rotation-y={x * -0.08}>
          <boxGeometry args={[0.55, 0.46, 1.5]} />
          <meshStandardMaterial color={color} roughness={0.34} metalness={0.3} />
        </mesh>
      ))}
      <mesh castShadow={player} position={[0, 0.94, -0.18]} scale={[1, 0.62, 1.25]}>
        <sphereGeometry args={[0.5, 12, 8]} />
        <meshStandardMaterial color="#071d31" roughness={0.18} metalness={0.48} />
      </mesh>
      <mesh castShadow={player} position={[0, 1.1, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.065, 6, 12, Math.PI * 1.7]} />
        <meshStandardMaterial color="#d9edf0" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh castShadow={player} position={[0, 0.5, 2.48]} rotation-z={damage === 'minor' ? 0.08 : damage === 'major' ? 0.2 : 0}>
        <boxGeometry args={[2.55, 0.11, 0.48]} />
        <meshStandardMaterial color="#0d2235" roughness={0.4} />
      </mesh>
      <mesh castShadow={player} position={[0, 1.06, -1.82]}>
        <boxGeometry args={[2.15, 0.16, 0.42]} />
        <meshStandardMaterial color="#0d2235" roughness={0.4} />
      </mesh>
      <mesh castShadow={player} position={[0, 0.73, -1.76]}>
        <boxGeometry args={[0.22, 0.7, 0.24]} />
        <meshStandardMaterial color="#0d2235" roughness={0.45} />
      </mesh>
      <WheelSet castShadow={player} />
      {damage !== 'none' && <mesh position={[0.45, 1.5, -0.6]}><dodecahedronGeometry args={[damage === 'major' ? 0.36 : 0.2, 0]} /><meshStandardMaterial color="#343b40" transparent opacity={0.72} /></mesh>}
      {player && (
        <mesh position={[0, 1.48, -0.05]}>
          <octahedronGeometry args={[0.16]} />
          <meshBasicMaterial color="#54e6ef" />
        </mesh>
      )}
    </group>
  )
}

function WheelSet({ castShadow }: { castShadow: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    if (!ref.current) return
    const dummy = new THREE.Object3D()
    const wheels = [
      [-1.02, 0.45, 1.22, 0.86],
      [1.02, 0.45, 1.22, 0.86],
      [-1.05, 0.48, -1.2, 1.08],
      [1.05, 0.48, -1.2, 1.08],
    ]
    wheels.forEach(([x, y, z, scale], index) => {
      dummy.position.set(x, y, z)
      dummy.rotation.z = Math.PI / 2
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      ref.current?.setMatrixAt(index, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 4]} castShadow={castShadow}>
      <cylinderGeometry args={[0.43, 0.43, 0.34, 12]} />
      <meshStandardMaterial color="#0b1118" roughness={0.78} />
    </instancedMesh>
  )
}

function WorldKit({ curve, circuit, rain, windKph }: { curve: THREE.CatmullRomCurve3; circuit: RaceConfig['circuit']; rain: number; windKph: number }) {
  const trees = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => {
        const t = index / 22
        const p = curve.getPointAt(t)
        const tangent = curve.getTangentAt(t).normalize()
        const side = index % 2 === 0 ? 1 : -1
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
        return p.addScaledVector(normal, side * (9 + (index % 4) * 1.6)).setY(0)
      }),
    [curve],
  )
  return (
    <>
      <InstancedForest positions={trees} />
      <PitComplex curve={curve} circuit={circuit} />
      <CircuitBackdrop circuit={circuit} rain={rain} />
      <MovingClouds rain={rain} windKph={windKph} />
      <Checkpoint curve={curve} t={0.02} color="#ff633f" />
      <Checkpoint curve={curve} t={0.49} color="#54e6ef" />
    </>
  )
}

function InstancedForest({ positions }: { positions: THREE.Vector3[] }) {
  const trunks = useRef<THREE.InstancedMesh>(null)
  const crowns = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    const dummy = new THREE.Object3D()
    positions.forEach((position, index) => {
      dummy.position.copy(position).add(new THREE.Vector3(0, 1.15, 0)); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); trunks.current?.setMatrixAt(index, dummy.matrix)
      dummy.position.copy(position).add(new THREE.Vector3(0, 3.2, 0)); dummy.rotation.y = index * .9; dummy.scale.set(1 + index % 3 * .08, 1, 1 + index % 2 * .08); dummy.updateMatrix(); crowns.current?.setMatrixAt(index, dummy.matrix)
    })
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true
    if (crowns.current) crowns.current.instanceMatrix.needsUpdate = true
  }, [positions])
  return <><instancedMesh ref={trunks} args={[undefined, undefined, positions.length]} castShadow><boxGeometry args={[.55, 2.3, .55]} /><meshStandardMaterial color="#80533b" /></instancedMesh><instancedMesh ref={crowns} args={[undefined, undefined, positions.length]} castShadow><icosahedronGeometry args={[1.55, 0]} /><meshStandardMaterial color="#31824a" roughness={1} /></instancedMesh></>
}

function PitComplex({ curve, circuit }: { curve: THREE.CatmullRomCurve3; circuit: RaceConfig['circuit'] }) {
  const placement = useMemo(() => {
    const settings = circuit === 'ardennes' ? [.965, -12] : circuit === 'british' ? [.96, 12] : [.035, -12]
    return trackPlacement(curve, settings[0], settings[1])
  }, [circuit, curve])
  return <group position={placement.position} rotation-y={placement.rotation}>
    <mesh receiveShadow position={[0, .06, 0]}><boxGeometry args={[2.6, .12, 19]} /><meshStandardMaterial color="#56636d" /></mesh>
    <mesh castShadow position={[4.4, 1.75, 0]}><boxGeometry args={[4.8, 3.5, 19]} /><meshStandardMaterial color="#e7e0c9" roughness={.75} /></mesh>
    {[-7,-3.5,0,3.5,7].map((z) => <mesh key={z} position={[1.95, 1.05, z]}><boxGeometry args={[.12, 1.8, 2.7]} /><meshStandardMaterial color="#102e4d" /></mesh>)}
    <mesh castShadow position={[0, 4.1, 0]}><boxGeometry args={[11, .35, .8]} /><meshStandardMaterial color="#54e6ef" /></mesh>
    <mesh castShadow position={[-4.6, 1.4, 0]}><boxGeometry args={[5.8, 2.8, 11]} /><meshStandardMaterial color="#d4dae0" /></mesh>
  </group>
}

function CircuitBackdrop({ circuit, rain }: { circuit: RaceConfig['circuit']; rain: number }) {
  const city = circuit === 'catalunya'
  return <>
    <group position={[0, 0, -62]}>
      {[-48,-31,-14,5,24,43].map((x, index) => <mesh key={x} position={[x, 7 + index % 2 * 3, index % 2 * -3]} rotation-y={index * .45}><coneGeometry args={[12 + index % 3 * 3, 18 + index % 2 * 6, 6]} /><meshStandardMaterial color={rain > .3 ? '#536d70' : circuit === 'ardennes' ? '#47785c' : '#71836c'} roughness={1} /></mesh>)}
    </group>
    {city && <group position={[52, 0, 25]}>{[0,1,2,3,4,5,6].map((index) => <mesh key={index} position={[(index % 3) * 6, 3 + index % 3 * 1.5, Math.floor(index / 3) * 7]}><boxGeometry args={[4.5, 6 + index % 3 * 3, 4.5]} /><meshStandardMaterial color={index % 2 ? '#d9d1b8' : '#b9c8ce'} /></mesh>)}</group>}
    <mesh position={[-42, 28, -58]}><sphereGeometry args={[5.5, 16, 12]} /><meshBasicMaterial color={rain > .35 ? '#b6c3ca' : '#fff0a8'} transparent opacity={rain > .35 ? .25 : .95} /></mesh>
  </>
}

function MovingClouds({ rain, windKph }: { rain: number; windKph: number }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => { if (group.current) group.current.position.x = THREE.MathUtils.euclideanModulo(group.current.position.x + delta * windKph * .06 + 70, 140) - 70 })
  const color = rain > .25 ? '#718493' : '#eef7f4'
  return <group ref={group} position={[0, 22, -32]}>{[-44,-17,12,39].map((x, index) => <group key={x} position={[x, index % 2 * 3, index % 2 * 17]}>{[-2,0,2].map((offset) => <mesh key={offset} position={[offset * 1.7, Math.abs(offset) * -.4, 0]}><dodecahedronGeometry args={[2.8 + (offset === 0 ? 1.2 : 0), 0]} /><meshStandardMaterial color={color} transparent opacity={.82} roughness={1} /></mesh>)}</group>)}</group>
}

function trackPlacement(curve: THREE.CatmullRomCurve3, t: number, side: number) {
  const point = curve.getPointAt(t)
  const tangent = curve.getTangentAt(t).normalize()
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
  return { position: point.clone().addScaledVector(normal, side), rotation: Math.atan2(tangent.x, tangent.z) }
}

function Checkpoint({ curve, t, color }: { curve: THREE.CatmullRomCurve3; t: number; color: string }) {
  const group = useMemo(() => {
    const p = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    return { p, rotation: Math.atan2(tangent.x, tangent.z) }
  }, [curve, t])
  return (
    <group position={group.p} rotation-y={group.rotation}>
      <mesh castShadow position={[-5.2, 2.4, 0]}>
        <boxGeometry args={[0.4, 4.8, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[5.2, 2.4, 0]}>
        <boxGeometry args={[0.4, 4.8, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 4.6, 0]}>
        <boxGeometry args={[10.8, 0.55, 0.45]} />
        <meshStandardMaterial color="#eef4ed" />
      </mesh>
    </group>
  )
}

function Rain({ intensity, windKph }: { intensity: number; windKph: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const array = new Float32Array(420 * 3)
    for (let i = 0; i < array.length; i += 3) {
      array[i] = (Math.random() - 0.5) * 70
      array[i + 1] = Math.random() * 28
      array[i + 2] = (Math.random() - 0.5) * 70
    }
    return array
  }, [])
  useFrame((_, delta) => {
    if (!pointsRef.current || intensity <= 0) return
    const attribute = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 1; i < attribute.array.length; i += 3) {
      attribute.array[i] = (attribute.array[i] as number) - delta * 24
      attribute.array[i - 1] = (attribute.array[i - 1] as number) + delta * windKph * 0.08
      if ((attribute.array[i] as number) < 0) attribute.array[i] = 28
      if ((attribute.array[i - 1] as number) > 35) attribute.array[i - 1] = -35
    }
    attribute.needsUpdate = true
  })
  if (intensity <= 0.02) return null
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d7f5ff" size={0.08 + intensity * 0.06} transparent opacity={0.55} />
    </points>
  )
}

function createStripGeometry(curve: THREE.CatmullRomCurve3, inner: number, outer: number, segments: number) {
  const vertices: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    const p = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
    const a = p.clone().addScaledVector(normal, inner)
    const b = p.clone().addScaledVector(normal, outer)
    vertices.push(a.x, a.y, a.z, b.x, b.y, b.z)
    if (i < segments) {
      const base = i * 2
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function createTerrainGeometry(curve: THREE.CatmullRomCurve3) {
  const size = 230
  const segments = 58
  const samples = curve.getSpacedPoints(180)
  const vertices: number[] = []
  const indices: number[] = []
  for (let zIndex = 0; zIndex <= segments; zIndex += 1) {
    for (let xIndex = 0; xIndex <= segments; xIndex += 1) {
      const x = (xIndex / segments - .5) * size
      const z = (zIndex / segments - .5) * size
      let nearestDistance = Number.POSITIVE_INFINITY
      let trackHeight = 0
      samples.forEach((sample) => {
        const distance = (sample.x - x) ** 2 + (sample.z - z) ** 2
        if (distance < nearestDistance) { nearestDistance = distance; trackHeight = sample.y }
      })
      const support = Math.exp(-nearestDistance / 250)
      const distantRoll = (Math.sin(x * .045) + Math.cos(z * .052)) * .45 * (1 - support)
      vertices.push(x, trackHeight * support - .2 + distantRoll, z)
      if (xIndex < segments && zIndex < segments) {
        const row = segments + 1
        const base = zIndex * row + xIndex
        indices.push(base, base + row, base + 1, base + 1, base + row, base + row + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function placeOnTrack(
  object: THREE.Group,
  curve: THREE.CatmullRomCurve3,
  progress: number,
  lane: number,
  point: THREE.Vector3,
  tangent: THREE.Vector3,
  normal: THREE.Vector3,
) {
  const t = THREE.MathUtils.euclideanModulo(progress, 1)
  curve.getPointAt(t, point)
  curve.getTangentAt(t, tangent).normalize()
  normal.set(-tangent.z, 0, tangent.x)
  object.position.copy(point).addScaledVector(normal, lane * 2.35)
  object.position.y += 0.12
  object.rotation.y = Math.atan2(tangent.x, tangent.z)
}

function cloneSnapshot(state: RaceSnapshot): RaceSnapshot {
  return {
    ...state,
    racers: state.racers.map((racer) => ({ ...racer })),
    eventLog: [...state.eventLog],
  }
}

declare global {
  interface Window {
    __NEURAL_APEX__?: Record<string, unknown>
    __THREE_GAME_DIAGNOSTICS__?: Record<string, unknown>
    __THREE_GAME_TEST_HOOKS__?: {
      seed?: (seed: number) => void
      setState?: (name: string) => void
    }
  }
}
