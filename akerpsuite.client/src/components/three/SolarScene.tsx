// SolarScene.tsx — optimized: instanced panels, shared texture, no drei,
// render pauses when offscreen. Visual same rahega.
import { useRef, useMemo, useEffect, useLayoutEffect, useState, Suspense, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useTheme } from '../../context/ThemeContext'

type Variant = 'hero' | 'banner'
type Mode = 'light' | 'dark'
type Palette = ReturnType<typeof getScenePalette>

export function getScenePalette(mode: Mode) {
    return mode === 'dark'
        ? {
            bgTop: '#0b0d13',
            bgBottom: '#05060a',
            frame: '#20242f',
            cell: '#0a2f2a',
            cellLine: '#00f0c8',
            sun: '#E4FF4E',
            sunGlow: '#FF4D2E',
            particle: '#FF4D2E',
            ground: '#0a0b10',
            fog: '#05060a',
            ambient: 0.45,
            key: '#E4FF4E',
            rim: '#00F0C8',
        }
        : {
            bgTop: '#eef3f6',
            bgBottom: '#dbe4ea',
            frame: '#1f2733',
            cell: '#123b46',
            cellLine: '#00A88F',
            sun: '#FFC24B',
            sunGlow: '#E0421F',
            particle: '#E0421F',
            ground: '#e4eaee',
            fog: '#dbe4ea',
            ambient: 1.0,
            key: '#FFC24B',
            rim: '#00A88F',
        }
}

// Ek hi texture sab panels ke liye (pehle 54 the). Palette badle to purana dispose.
function useCellTexture(cellColor: string, lineColor: string) {
    const tex = useMemo(() => {
        const size = 256
        const c = document.createElement('canvas')
        c.width = size
        c.height = size
        const ctx = c.getContext('2d')!
        ctx.fillStyle = cellColor
        ctx.fillRect(0, 0, size, size)
        const cols = 6
        const rows = 10
        ctx.strokeStyle = lineColor
        ctx.globalAlpha = 0.55
        ctx.lineWidth = 2
        for (let i = 1; i < cols; i++) {
            const x = (size / cols) * i
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, size)
            ctx.stroke()
        }
        for (let i = 1; i < rows; i++) {
            const y = (size / rows) * i
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(size, y)
            ctx.stroke()
        }
        ctx.globalAlpha = 1
        const grad = ctx.createLinearGradient(0, 0, size, size)
        grad.addColorStop(0, 'rgba(255,255,255,0.10)')
        grad.addColorStop(0.5, 'rgba(255,255,255,0)')
        grad.addColorStop(1, 'rgba(255,255,255,0.06)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, size, size)
        const t = new THREE.CanvasTexture(c)
        t.colorSpace = THREE.SRGBColorSpace
        return t
    }, [cellColor, lineColor])

    useEffect(() => () => tex.dispose(), [tex])
    return tex
}

function useGlowTexture(color: string) {
    const tex = useMemo(() => {
        const size = 128
        const c = document.createElement('canvas')
        c.width = size
        c.height = size
        const ctx = c.getContext('2d')!
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
        grad.addColorStop(0, color)
        grad.addColorStop(0.35, color)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, size, size)
        return new THREE.CanvasTexture(c)
    }, [color])

    useEffect(() => () => tex.dispose(), [tex])
    return tex
}

// Saare panels = 2 InstancedMesh (frame + cells). Pehle 108 meshes + 54 useFrame the.
function PanelField({ variant, palette }: { variant: Variant; palette: Palette }) {
    const group = useRef<THREE.Group>(null!)
    const frameRef = useRef<THREE.InstancedMesh>(null!)
    const cellRef = useRef<THREE.InstancedMesh>(null!)
    const rows = variant === 'hero' ? 6 : 4
    const cols = variant === 'hero' ? 9 : 7
    const count = rows * cols
    const cellTex = useCellTexture(palette.cell, palette.cellLine)

    useLayoutEffect(() => {
        const parent = new THREE.Object3D()
        const child = new THREE.Object3D()
        const m = new THREE.Matrix4()
        child.position.set(0, 0.027, 0)
        child.rotation.set(-Math.PI / 2, 0, 0)
        child.updateMatrix()

        let i = 0
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                parent.position.set((c - (cols - 1) / 2) * 1.4, 0, (r - (rows - 1) / 2) * 1.65)
                parent.rotation.set(-0.38, 0, 0)
                parent.updateMatrix()

                frameRef.current.setMatrixAt(i, parent.matrix)
                m.multiplyMatrices(parent.matrix, child.matrix)
                cellRef.current.setMatrixAt(i, m)
                i++
            }
        }
        frameRef.current.instanceMatrix.needsUpdate = true
        cellRef.current.instanceMatrix.needsUpdate = true
    }, [rows, cols])

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime()
        if (group.current) group.current.rotation.y = Math.sin(t * 0.05) * 0.15 + 0.18
    })

    return (
        <group ref={group} rotation={[0.48, 0.28, 0]} position={[0, -0.4, 0]}>
            <instancedMesh key={`f${count}`} ref={frameRef} args={[undefined, undefined, count]} frustumCulled={false}>
                <boxGeometry args={[1.2, 0.05, 0.78]} />
                <meshStandardMaterial color={palette.frame} metalness={0.75} roughness={0.35} />
            </instancedMesh>
            <instancedMesh key={`c${count}`} ref={cellRef} args={[undefined, undefined, count]} frustumCulled={false}>
                <planeGeometry args={[1.08, 0.66]} />
                <meshStandardMaterial
                    map={cellTex}
                    metalness={0.4}
                    roughness={0.5}
                    emissive={palette.cellLine}
                    emissiveIntensity={0.12}
                    emissiveMap={cellTex}
                />
            </instancedMesh>
        </group>
    )
}

function Ground({ palette }: { palette: Palette }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
            <circleGeometry args={[9, 40]} />
            <meshStandardMaterial color={palette.ground} roughness={0.9} metalness={0} />
        </mesh>
    )
}

function Sun({ variant, palette }: { variant: Variant; palette: Palette }) {
    const ref = useRef<THREE.Mesh>(null!)
    const ring = useRef<THREE.Mesh>(null!)
    const glowTex = useGlowTexture(palette.sunGlow)
    const pos: [number, number, number] = variant === 'hero' ? [3.2, 2.4, -3] : [2.6, 1.6, -2.4]
    const scale = variant === 'hero' ? 0.9 : 0.6

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime()
        if (ref.current) ref.current.scale.setScalar(scale * (1 + Math.sin(t * 0.8) * 0.04))
        if (ring.current) ring.current.rotation.z = t * 0.15
    })

    return (
        <group position={pos}>
            <sprite scale={[scale * 4.2, scale * 4.2, 1]}>
                <spriteMaterial map={glowTex} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <mesh ref={ref}>
                <sphereGeometry args={[1, 24, 24]} />
                <meshBasicMaterial color={palette.sun} />
            </mesh>
            <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
                <torusGeometry args={[scale * 1.7, 0.012, 8, 48]} />
                <meshBasicMaterial color={palette.rim} transparent opacity={0.35} />
            </mesh>
        </group>
    )
}

function Particles({ count, color }: { count: number; color: string }) {
    const points = useRef<THREE.Points>(null!)
    const positions = useMemo(() => {
        const arr = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            arr[i * 3] = (Math.random() - 0.5) * 14
            arr[i * 3 + 1] = Math.random() * 5
            arr[i * 3 + 2] = (Math.random() - 0.5) * 10
        }
        return arr
    }, [count])

    useFrame(({ clock }) => {
        if (points.current) points.current.rotation.y = clock.getElapsedTime() * 0.02
    })

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.035} color={color} transparent opacity={0.6} sizeAttenuation />
        </points>
    )
}

// drei <Stars> ki jagah: ek chhota points cloud (dark mode only). drei import khatam.
function StarField({ count }: { count: number }) {
    const points = useRef<THREE.Points>(null!)
    const positions = useMemo(() => {
        const arr = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            const r = 25 + Math.random() * 20
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
            arr[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.6
            arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
        }
        return arr
    }, [count])

    useFrame(({ clock }) => {
        if (points.current) points.current.rotation.y = clock.getElapsedTime() * 0.01
    })

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.09} color="#ffffff" transparent opacity={0.75} sizeAttenuation depthWrite={false} fog={false} />
        </points>
    )
}

function IntroRig({ children }: { children: ReactNode }) {
    const group = useRef<THREE.Group>(null!)
    const start = useRef<number | null>(null)
    useFrame(({ clock }) => {
        if (start.current === null) start.current = clock.getElapsedTime()
        const elapsed = clock.getElapsedTime() - start.current
        const p = Math.min(elapsed / 1.3, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        if (group.current) group.current.scale.setScalar(0.82 + eased * 0.18)
    })
    return <group ref={group}>{children}</group>
}

// Bug fix: pehle useMemo me listener tha (cleanup nahi). Ab useEffect.
function MouseRig({ variant }: { variant: Variant }) {
    const { camera } = useThree()
    const target = useRef({ x: 0, y: 0 })

    useEffect(() => {
        function onMove(e: PointerEvent) {
            const nx = (e.clientX / window.innerWidth - 0.5) * 1.2
            const ny = (e.clientY / window.innerHeight - 0.5) * 0.6
            target.current = { x: nx, y: -ny }
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        return () => window.removeEventListener('pointermove', onMove)
    }, [])

    useFrame(() => {
        camera.position.x += (target.current.x - camera.position.x) * 0.03
        camera.position.y += (target.current.y + (variant === 'hero' ? 1.6 : 1.1) - camera.position.y) * 0.03
        camera.lookAt(0, 0, 0)
    })

    return null
}

export default function SolarScene({ variant = 'hero' }: { variant?: Variant }) {
    const { theme } = useTheme()
    const palette = getScenePalette(theme as Mode)

    // Scene viewport se bahar (scroll ke baad) ho to render band: CPU/GPU free
    const wrapRef = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(true)
    useEffect(() => {
        const el = wrapRef.current
        if (!el || !('IntersectionObserver' in window)) return
        const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 })
        io.observe(el)
        return () => io.disconnect()
    }, [])

    return (
        <div ref={wrapRef} className="relative h-full w-full">
            <Canvas
                className="!absolute inset-0 !h-full !w-full"
                frameloop={visible ? 'always' : 'never'}
                dpr={[1, 1.5]}
                camera={{ position: [0, variant === 'hero' ? 1.6 : 1.1, variant === 'hero' ? 6.5 : 5], fov: 50 }}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                aria-hidden="true"
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={palette.ambient} />
                    <directionalLight position={[3, 4, 2]} intensity={theme === 'dark' ? 1.1 : 1.5} color={palette.key} />
                    <pointLight position={[-4, 2, -2]} intensity={theme === 'dark' ? 0.6 : 0.35} color={palette.rim} />

                    {theme === 'dark' && <StarField count={variant === 'hero' ? 600 : 300} />}

                    <IntroRig>
                        <group scale={variant === 'hero' ? 1 : 0.82}>
                            <PanelField variant={variant} palette={palette} />
                            <Ground palette={palette} />
                            <Sun variant={variant} palette={palette} />
                            <Particles count={variant === 'hero' ? 160 : 90} color={palette.particle} />
                        </group>
                    </IntroRig>

                    <fog attach="fog" args={[palette.fog, 6, variant === 'hero' ? 13 : 10]} />
                    <MouseRig variant={variant} />
                </Suspense>
            </Canvas>
        </div>
    )
}