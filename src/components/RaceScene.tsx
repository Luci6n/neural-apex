import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { advanceRace, cancelPitStop, createRace, evaluateSystemAdvice, requestPitStop, resolveDecision } from '../game/simulation'
import { createPitLaneLayout, createTrackCurve, racingLineOffsetAt } from '../game/tracks'
import type { RaceConfig, RaceDecision, RaceSnapshot, StrategyCommand, TyreCompound } from '../game/types'

interface RaceSceneProps {
  config: RaceConfig
  strategy: StrategyCommand
  decision: RaceDecision | null
  pitCommand: { id: number; tyre: TyreCompound | null }
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
  pitCommand,
  paused,
  onSnapshot,
  onNeedDecision,
  onFinish,
}: RaceSceneProps) {
  const curve = useMemo(() => createTrackCurve(config.circuit), [config.circuit])
  const pitLayout = useMemo(() => createPitLaneLayout(curve), [curve])
  const pitCurve = pitLayout.curve
  const pitSide = pitLayout.side
  const road = useMemo(() => createStripGeometry(curve, -3.6, 3.6, 300), [curve])
  const innerCurb = useMemo(() => createStripGeometry(curve, -3.58, -3.18, 360), [curve])
  const outerCurb = useMemo(() => createStripGeometry(curve, 3.18, 3.58, 360), [curve])
  const racingLine = useMemo(() => createRacingLineGeometry(curve, config.circuit, 240), [curve, config.circuit])
  const pitRoad = useMemo(() => createTaperedStripGeometry(pitCurve, 1.6, 90), [pitCurve])
  const terrain = useMemo(() => createTerrainGeometry(curve), [curve])
  const simulation = useRef(createRace(config))
  const carRefs = useRef<Array<THREE.Group | null>>([])
  const snapshotClock = useRef(0)
  const frameCount = useRef(0)
  const finishSent = useRef(false)
  const decisionSent = useRef(false)
  const appliedDecision = useRef<RaceDecision | null>(null)
  const appliedPitCommand = useRef(0)
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
          state.needsDecision = true
          state.decision = null
          state.strategyWindowCount = Math.max(1, state.strategyWindowCount)
          state.adviceAlignment = evaluateSystemAdvice(state, config).alignment
          decisionSent.current = false
        }
        if (name === 'finish') {
          state.racers[0].progress = state.totalLaps - 0.001
          state.playerProgress = state.totalLaps - 0.001
          state.lapProgress = 0.999
          state.needsDecision = false
          state.decisionPoint = state.totalLaps + 1
          state.strategyWindowCount = state.strategyWindowLimit
          finishSent.current = false
        }
        if (name === 'pit-entry' && state.pitRequested && state.pitEntryProgress !== null) {
          state.racers[0].progress = state.pitEntryProgress + 0.001
          state.playerProgress = state.racers[0].progress
          state.lapProgress = THREE.MathUtils.euclideanModulo(state.racers[0].progress, 1)
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

  useEffect(() => {
    if (pitCommand.id === 0 || pitCommand.id === appliedPitCommand.current) return
    if (pitCommand.tyre) requestPitStop(simulation.current, pitCommand.tyre)
    else cancelPitStop(simulation.current)
    appliedPitCommand.current = pitCommand.id
    onSnapshot(cloneSnapshot(simulation.current))
  }, [pitCommand, onSnapshot])

  useFrame((_, delta) => {
    frameCount.current += 1
    const state = simulation.current
    if (!paused) advanceRace(state, config, strategy, delta)

    state.racers.forEach((racer, index) => {
      const car = carRefs.current[index]
      if (!car) return
      if (racer.inPit) placeOnTrack(car, pitCurve, racer.pitLanePhase || 0, 0, point, tangent, normal, false, 0.21)
      else placeOnTrack(car, curve, racer.progress, racer.lane, point, tangent, normal)
    })

    const player = state.racers[0]
    const viewCurve = player.inPit ? pitCurve : curve
    const trackT = player.inPit ? player.pitLanePhase || 0 : THREE.MathUtils.euclideanModulo(player.progress, 1)
    viewCurve.getPointAt(trackT, point)
    viewCurve.getTangentAt(trackT, tangent).normalize()
    normal.set(-tangent.z, 0, tangent.x)
    if (!player.inPit) point.addScaledVector(normal, player.lane * 2.35)
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
      appliedDecision.current = null
      onNeedDecision()
    }
    if (!state.needsDecision) decisionSent.current = false
    if (state.finished && !finishSent.current) {
      finishSent.current = true
      onFinish(cloneSnapshot(state))
    }

    const playerObject = carRefs.current[0]
    const diagnostics = {
      frame: frameCount.current,
      phase: state.finished ? 'finished' : state.needsDecision ? 'decision' : 'racing',
      lap: state.lap,
      position: state.position,
      progress: state.playerProgress,
      complete: state.finished,
      fail: false,
      player: {
        x: playerObject?.position.x ?? 0,
        y: playerObject?.position.y ?? 0,
        z: playerObject?.position.z ?? 0,
        inPit: state.racers[0].inPit,
        pitLanePhase: state.racers[0].pitLanePhase ?? 0,
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
      <mesh geometry={road} position-y={0.22} receiveShadow renderOrder={2}>
        <meshStandardMaterial color={state.rain > 0.12 ? '#172a38' : '#273745'} roughness={state.rain > 0.12 ? 0.48 : 0.86} metalness={state.rain > 0.12 ? 0.18 : 0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={innerCurb} position-y={0.245} receiveShadow><meshStandardMaterial color="#f1e4c5" roughness={0.82} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={outerCurb} position-y={0.245} receiveShadow><meshStandardMaterial color="#f46b47" roughness={0.82} side={THREE.DoubleSide} /></mesh>
      {config.mode === 'guided' && <mesh geometry={racingLine} position-y={0.265}>
        <meshBasicMaterial color="#54e6ef" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>}
      <mesh geometry={pitRoad} position-y={0.21} receiveShadow renderOrder={1}><meshStandardMaterial color="#394750" roughness={0.82} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} /></mesh>

      <WorldKit curve={curve} pitCurve={pitCurve} pitSide={pitSide} circuit={config.circuit} rain={state.rain} windKph={state.windKph} />
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

function WorldKit({ curve, pitCurve, pitSide, circuit, rain, windKph }: { curve: THREE.CatmullRomCurve3; pitCurve: THREE.Curve<THREE.Vector3>; pitSide: 1 | -1; circuit: RaceConfig['circuit']; rain: number; windKph: number }) {
  const trees = useMemo(
    () => {
      const terrainSamples = curve.getSpacedPoints(180)
      const roadSamples = [...curve.getSpacedPoints(300), ...pitCurve.getSpacedPoints(120)]
      return Array.from({ length: 16 }, (_, index) => {
        const t = index / 16
        const origin = curve.getPointAt(t)
        const tangent = curve.getTangentAt(t).normalize()
        const preferredSide = index % 2 === 0 ? 1 : -1
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
        let p = origin.clone()
        let bestClearance = -1
        let found = false
        for (const side of [preferredSide, -preferredSide]) {
          for (let distance = 16 + (index % 3) * 2; distance <= 52; distance += 4) {
            const candidate = origin.clone().addScaledVector(normal, side * distance)
            const clearance = nearestHorizontalDistance(candidate, roadSamples)
            if (clearance > bestClearance) { p = candidate; bestClearance = clearance }
            if (clearance >= 10) { p = candidate; found = true; break }
          }
          if (found) break
        }
        p.y = terrainHeightAt(p.x, p.z, terrainSamples)
        return p
      })
    },
    [curve, pitCurve],
  )
  return (
    <>
      <InstancedForest positions={trees} />
      <PitComplex curve={pitCurve} side={pitSide} />
      <TracksideGrandstand curve={curve} />
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
      dummy.position.copy(position).add(new THREE.Vector3(0, 2.9, 0)); dummy.rotation.y = index * .9; dummy.scale.set(.8 + index % 3 * .06, .85, .8 + index % 2 * .06); dummy.updateMatrix(); crowns.current?.setMatrixAt(index, dummy.matrix)
    })
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true
    if (crowns.current) crowns.current.instanceMatrix.needsUpdate = true
  }, [positions])
  return <><instancedMesh ref={trunks} args={[undefined, undefined, positions.length]} castShadow frustumCulled={false}><boxGeometry args={[.55, 2.3, .55]} /><meshStandardMaterial color="#80533b" /></instancedMesh><instancedMesh ref={crowns} args={[undefined, undefined, positions.length]} castShadow frustumCulled={false}><icosahedronGeometry args={[1.55, 0]} /><meshStandardMaterial color="#31824a" roughness={1} /></instancedMesh></>
}

function PitComplex({ curve, side }: { curve: THREE.Curve<THREE.Vector3>; side: 1 | -1 }) {
  const placement = useMemo(() => trackPlacement(curve, .54, 0), [curve])
  return <group position={placement.position} rotation-y={placement.rotation}>
    <mesh receiveShadow position={[0, .06, 0]}><boxGeometry args={[2.6, .12, 19]} /><meshStandardMaterial color="#56636d" /></mesh>
    <mesh castShadow position={[-side * 4.2, 1.4, 0]}><boxGeometry args={[4.4, 2.8, 19]} /><meshStandardMaterial color="#e7e0c9" roughness={.75} /></mesh>
    {[-7,-3.5,0,3.5,7].map((z) => <mesh key={z} position={[-side * 1.95, .9, z]}><boxGeometry args={[.12, 1.55, 2.7]} /><meshStandardMaterial color="#102e4d" /></mesh>)}
    <mesh castShadow position={[0, 3.6, 0]}><boxGeometry args={[10.2, .3, .72]} /><meshStandardMaterial color="#54e6ef" /></mesh>
    <mesh castShadow position={[-side * 7.5, 1.2, 0]}><boxGeometry args={[2.4, 2.4, 10]} /><meshStandardMaterial color="#d4dae0" /></mesh>
  </group>
}

function TracksideGrandstand({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const placement = useMemo(() => {
    const samples = curve.getSpacedPoints(120)
    const centroid = samples.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / samples.length)
    const t = .2
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
    const outside = normal.dot(point.clone().sub(centroid)) >= 0 ? 1 : -1
    return trackPlacement(curve, t, outside * 15)
  }, [curve])
  const spectatorColors = ['#ff633f', '#54e6ef', '#ffd65a', '#a88cff', '#e8f4f2']
  return <group position={placement.position} rotation-y={placement.rotation}>
    {[-7,-2.3,2.3,7].map((z) => <mesh key={'support-' + z} position={[1.8, -2.1, z]}><boxGeometry args={[.45, 4.4, .45]} /><meshStandardMaterial color="#536b78" /></mesh>)}
    {[0,1,2].map((row) => <mesh key={row} castShadow position={[row * 1.25, .55 + row * .72, 0]}><boxGeometry args={[2.1, .7, 18]} /><meshStandardMaterial color={row % 2 ? '#c4ced0' : '#e4dfcf'} roughness={.85} /></mesh>)}
    <mesh castShadow position={[3.1, 4.2, 0]}><boxGeometry args={[5.7, .3, 19.5]} /><meshStandardMaterial color="#173651" /></mesh>
    {Array.from({ length: 18 }, (_, index) => <mesh key={index} position={[.25 + (index % 3) * 1.25, 1.2 + (index % 3) * .72, -7.5 + Math.floor(index / 3) * 3]}><sphereGeometry args={[.16, 6, 4]} /><meshStandardMaterial color={spectatorColors[index % spectatorColors.length]} /></mesh>)}
    <mesh position={[-2.2, 1.2, 0]}><boxGeometry args={[.18, 2.4, 20]} /><meshStandardMaterial color="#617783" /></mesh>
  </group>
}

function CircuitBackdrop({ circuit, rain }: { circuit: RaceConfig['circuit']; rain: number }) {
  const cityPalette = circuit === 'catalunya' ? ['#d9d1b8', '#b9c8ce'] : circuit === 'british' ? ['#b8c7c9', '#d6d2c3'] : ['#9daaa5', '#c8c1ac']
  return <>
    <group position={[0, -2.5, -108]}>
      {[-58,-38,-17,6,29,52].map((x, index) => <mesh key={x} position={[x, 6 + index % 2 * 3, index % 2 * -5]} rotation-y={index * .45}><coneGeometry args={[15 + index % 3 * 4, 17 + index % 2 * 7, 7]} /><meshStandardMaterial color={rain > .3 ? '#536d70' : circuit === 'ardennes' ? '#47785c' : circuit === 'british' ? '#6c8069' : '#7d866c'} roughness={1} /></mesh>)}
    </group>
    <group position={circuit === 'catalunya' ? [54, 0, 28] : circuit === 'british' ? [-62, 0, 34] : [58, 0, -12]}>{Array.from({ length: circuit === 'catalunya' ? 10 : 6 }, (_, index) => <mesh key={index} position={[(index % 4) * 5.5, 2.5 + index % 3 * 1.4, Math.floor(index / 4) * 6]}><boxGeometry args={[4.2, 5 + index % 3 * 2.8, 4.2]} /><meshStandardMaterial color={cityPalette[index % 2]} roughness={.8} /></mesh>)}</group>
    <group position={[-86, 0, -82]}>{[0,1,2,3,4].map((index) => <mesh key={index} position={[index * 7, 1.2 + index % 2, index % 2 * 5]}><dodecahedronGeometry args={[3.2 + index % 2 * .6, 0]} /><meshStandardMaterial color={rain > .3 ? '#516d58' : '#3f7d4d'} roughness={1} /></mesh>)}</group>
    <mesh position={[-42, 28, -58]}><sphereGeometry args={[5.5, 16, 12]} /><meshBasicMaterial color={rain > .35 ? '#b6c3ca' : '#fff0a8'} transparent opacity={rain > .35 ? .25 : .95} /></mesh>
  </>
}

function MovingClouds({ rain, windKph }: { rain: number; windKph: number }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => { if (group.current) group.current.position.x = THREE.MathUtils.euclideanModulo(group.current.position.x + delta * windKph * .06 + 70, 140) - 70 })
  const color = rain > .25 ? '#718493' : '#eef7f4'
  return <group ref={group} position={[0, 22, -32]}>{[-44,-17,12,39].map((x, index) => <group key={x} position={[x, index % 2 * 3, index % 2 * 17]}>{[-2,0,2].map((offset) => <mesh key={offset} position={[offset * 1.7, Math.abs(offset) * -.4, 0]}><dodecahedronGeometry args={[2.8 + (offset === 0 ? 1.2 : 0), 0]} /><meshStandardMaterial color={color} transparent opacity={.82} roughness={1} /></mesh>)}</group>)}</group>
}

function trackPlacement(curve: THREE.Curve<THREE.Vector3>, t: number, side: number) {
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

function createStripGeometry(curve: THREE.Curve<THREE.Vector3>, inner: number, outer: number, segments: number) {
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

function createRacingLineGeometry(curve: THREE.Curve<THREE.Vector3>, circuit: RaceConfig['circuit'], segments: number) {
  const vertices: number[] = []
  const indices: number[] = []
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
    const target = point.clone().addScaledVector(normal, racingLineOffsetAt(circuit, t) * 2.35)
    const left = target.clone().addScaledVector(normal, -0.055)
    const right = target.clone().addScaledVector(normal, 0.055)
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

function createTaperedStripGeometry(curve: THREE.Curve<THREE.Vector3>, halfWidth: number, segments: number) {
  const vertices: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    const p = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
    const taper = Math.sin(Math.PI * t) ** .55
    const width = .08 + halfWidth * taper
    const a = p.clone().addScaledVector(normal, -width)
    const b = p.clone().addScaledVector(normal, width)
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
      vertices.push(x, terrainHeightAt(x, z, samples), z)
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

function terrainHeightAt(x: number, z: number, samples: THREE.Vector3[]) {
  let nearestDistance = Number.POSITIVE_INFINITY
  let trackHeight = 0
  samples.forEach((sample) => {
    const distance = (sample.x - x) ** 2 + (sample.z - z) ** 2
    if (distance < nearestDistance) { nearestDistance = distance; trackHeight = sample.y }
  })
  const support = Math.exp(-nearestDistance / 250)
  const distantRoll = (Math.sin(x * .045) + Math.cos(z * .052)) * .45 * (1 - support)
  return trackHeight * support - .2 + distantRoll
}

function nearestHorizontalDistance(point: THREE.Vector3, samples: THREE.Vector3[]) {
  let nearest = Number.POSITIVE_INFINITY
  samples.forEach((sample) => {
    nearest = Math.min(nearest, Math.hypot(point.x - sample.x, point.z - sample.z))
  })
  return nearest
}

function placeOnTrack(
  object: THREE.Group,
  curve: THREE.Curve<THREE.Vector3>,
  progress: number,
  lane: number,
  point: THREE.Vector3,
  tangent: THREE.Vector3,
  normal: THREE.Vector3,
  wrap = true,
  surfaceOffset = 0.22,
) {
  const t = wrap ? THREE.MathUtils.euclideanModulo(progress, 1) : THREE.MathUtils.clamp(progress, 0, 1)
  curve.getPointAt(t, point)
  curve.getTangentAt(t, tangent).normalize()
  normal.set(-tangent.z, 0, tangent.x)
  object.position.copy(point).addScaledVector(normal, lane * 2.35)
  const worldUp = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize()
  const surfaceUp = new THREE.Vector3().crossVectors(tangent, right).normalize()
  const basis = new THREE.Matrix4().makeBasis(right, surfaceUp, tangent)
  object.quaternion.setFromRotationMatrix(basis)
  // The lowest rear-tyre point is 0.0156 above the model origin.
  object.position.addScaledVector(worldUp, surfaceOffset).addScaledVector(surfaceUp, -0.0156)
}

function cloneSnapshot(state: RaceSnapshot): RaceSnapshot {
  return {
    ...state,
    racers: state.racers.map((racer) => ({ ...racer })),
    eventLog: [...state.eventLog],
    decisionHistory: state.decisionHistory.map((record) => ({ ...record })),
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
