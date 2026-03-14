import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"

export function IntroScreen() {
    const navigate = useNavigate()
    const [isBooting, setIsBooting] = useState(false)
    const audioContextRef = useRef<AudioContext | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Framer motion values for parallax
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Smooth the mouse movement
    const springConfig = { damping: 30, stiffness: 100 }
    const x = useSpring(mouseX, springConfig)
    const y = useSpring(mouseY, springConfig)

    // Map to 3D Parallax Rotation
    const rotateX = useTransform(y, [-15, 15], [10, -10])
    const rotateY = useTransform(x, [-15, 15], [-10, 10])

    const handleMouseMove = (e: React.MouseEvent) => {
        // Calculate offset from center (-0.5 to 0.5)
        const xOffset = (e.clientX / window.innerWidth) - 0.5
        const yOffset = (e.clientY / window.innerHeight) - 0.5
        mouseX.set(xOffset * 30) // max 15px movement
        mouseY.set(yOffset * 30)
    }

    // Canvas Particles
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationFrameId: number;
        let particles: any[] = []

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            initParticles()
        }

        const initParticles = () => {
            particles = []
            // Optimize count for performance based on screen width
            const particleCount = window.innerWidth < 768 ? 40 : 100
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2.5 + 0.5,
                    speedX: (Math.random() - 0.5) * 0.5,
                    speedY: (Math.random() - 0.5) * 0.5 - 0.1, // Tends to drift slightly up
                    opacity: Math.random() * 0.6 + 0.1,
                    type: Math.random() > 0.85 ? 'firefly' : (Math.random() > 0.4 ? 'red' : 'dust'),
                    depth: Math.random() * 0.8 + 0.2 // For parallax depth
                })
            }
        }

        const drawParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Get current smoothed parallax values
            const pX = x.get()
            const pY = y.get()

            particles.forEach(p => {
                // Update position
                p.x += p.speedX
                p.y += p.speedY

                // Wrap around edges
                if (p.x < -10) p.x = canvas.width + 10
                if (p.x > canvas.width + 10) p.x = -10
                if (p.y < -10) p.y = canvas.height + 10
                if (p.y > canvas.height + 10) p.y = -10

                // Twinkle effect for fireflies
                let currentOpacity = p.opacity
                if (p.type === 'firefly') {
                    currentOpacity = p.opacity + Math.sin(Date.now() * 0.002 * p.speedX) * 0.4
                    if (currentOpacity < 0) currentOpacity = 0.1
                } else if (p.type === 'red') {
                    currentOpacity = p.opacity + Math.sin(Date.now() * 0.001 * p.speedY) * 0.2
                }

                ctx.beginPath()
                // Parallax offset applied here
                const drawX = p.x + (pX * p.depth * 2)
                const drawY = p.y + (pY * p.depth * 2)

                ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2)

                if (p.type === 'firefly') {
                    ctx.fillStyle = `rgba(255, 180, 80, ${currentOpacity})`
                    ctx.shadowBlur = 12
                    ctx.shadowColor = 'rgba(255, 180, 80, 0.8)'
                } else if (p.type === 'red') {
                    ctx.fillStyle = `rgba(255, 0, 60, ${currentOpacity})`
                    ctx.shadowBlur = 6
                    ctx.shadowColor = 'rgba(255, 0, 60, 0.5)'
                } else {
                    ctx.fillStyle = `rgba(180, 180, 180, ${currentOpacity * 0.4})`
                    ctx.shadowBlur = 0
                }

                ctx.fill()
            })

            animationFrameId = requestAnimationFrame(drawParticles)
        }

        window.addEventListener('resize', resize)
        resize()
        drawParticles()

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animationFrameId)
        }
    }, [x, y])

    // Audio Setup
    useEffect(() => {
        const initAudio = () => {
            if (audioContextRef.current) {
                if (audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume();
                }
                return;
            }
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
                audioContextRef.current = ctx

                // Wind (Noise)
                const bufferSize = ctx.sampleRate * 2;
                const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
                const output = noiseBuffer.getChannelData(0)
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1
                }

                const noiseSource = ctx.createBufferSource()
                noiseSource.buffer = noiseBuffer
                noiseSource.loop = true

                // Filter for wind
                const bandpass = ctx.createBiquadFilter()
                bandpass.type = 'bandpass'
                bandpass.frequency.value = 350
                bandpass.Q.value = 0.5

                // LFO to modulate wind frequency smoothly
                const lfo = ctx.createOscillator()
                lfo.type = 'sine'
                lfo.frequency.value = 0.15
                const lfoGain = ctx.createGain()
                lfoGain.gain.value = 250
                lfo.connect(lfoGain)
                lfoGain.connect(bandpass.frequency)
                lfo.start()

                const windVolume = ctx.createGain()
                windVolume.gain.value = 0.03 // Keep it very subtle

                noiseSource.connect(bandpass)
                bandpass.connect(windVolume)
                windVolume.connect(ctx.destination)
                noiseSource.start()

                // Rumble
                const rumbleOsc = ctx.createOscillator()
                rumbleOsc.type = 'triangle'
                rumbleOsc.frequency.value = 45

                const rumbleFilter = ctx.createBiquadFilter()
                rumbleFilter.type = 'lowpass'
                rumbleFilter.frequency.value = 70

                const rumbleVolume = ctx.createGain()
                rumbleVolume.gain.value = 0.08

                // Modulate rumble volume
                const rumbleLFO = ctx.createOscillator()
                rumbleLFO.type = 'sine'
                rumbleLFO.frequency.value = 0.4
                const rumbleLFOGain = ctx.createGain()
                rumbleLFOGain.gain.value = 0.04
                rumbleLFO.connect(rumbleLFOGain)
                rumbleLFOGain.connect(rumbleVolume.gain)
                rumbleLFO.start()

                rumbleOsc.connect(rumbleFilter)
                rumbleFilter.connect(rumbleVolume)
                rumbleVolume.connect(ctx.destination)
                rumbleOsc.start()

            } catch (e) {
                console.error("Audio Context failed to initialize", e)
            }
        }

        initAudio()

        // Browsers require interaction to resume AudioContext.
        document.body.addEventListener('click', initAudio, { once: true })
        document.body.addEventListener('mousemove', initAudio, { once: true })

        return () => {
            document.body.removeEventListener('click', initAudio)
            document.body.removeEventListener('mousemove', initAudio)
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [])

    const handleStart = () => {
        if (isBooting) return;
        setIsBooting(true)

        // Ramp up audio for glitch effect
        if (audioContextRef.current) {
            const ctx = audioContextRef.current;
            const glitchOsc = ctx.createOscillator()
            glitchOsc.type = 'sawtooth'
            glitchOsc.frequency.setValueAtTime(80, ctx.currentTime)
            glitchOsc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3)

            const glitchFilter = ctx.createBiquadFilter()
            glitchFilter.type = 'bandpass'
            glitchFilter.frequency.value = 400

            const glitchGain = ctx.createGain()
            glitchGain.gain.setValueAtTime(0.1, ctx.currentTime)
            glitchGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1)

            glitchOsc.connect(glitchFilter)
            glitchFilter.connect(glitchGain)
            glitchGain.connect(ctx.destination)
            glitchOsc.start()
            glitchOsc.stop(ctx.currentTime + 1)
        }

        setTimeout(() => {
            navigate("/home")
        }, 1500)
    }

    return (
        <div
            className="relative min-h-screen w-full overflow-hidden bg-black text-[#ff003c] flex flex-col items-center justify-center cursor-pointer font-main"
            onClick={handleStart}
            onMouseMove={handleMouseMove}
            style={{ perspective: "1000px" }}
        >
            {/* 3D Scene Container */}
            <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d"
                }}
            >
                {/* Slow Cinematic Camera Drift wrapping the multilayer background */}
                <motion.div
                    className="absolute inset-0 w-[120%] h-[120%] left-[-10%] top-[-10%] z-0"
                    animate={{
                        scale: [1.3, 1.35, 1.3],
                        rotate: [0, 0.5, -0.2, 0],
                        x: isBooting ? "0%" : ["0%", "-1%", "1%", "0%"],
                        y: isBooting ? "0%" : ["0%", "1%", "-1%", "0%"]
                    }}
                    transition={{
                        duration: 35,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {/* Layer 1: Deep Background Skyscape */}
                    <div
                        className="absolute inset-0 bg-[url('/hero.png')] bg-cover bg-center bg-no-repeat"
                        style={{ transform: "translateZ(-400px) scale(1.5)" }}
                    />

                    {/* Red Thunder/Lightning Flash Layer */}
                    <motion.div
                        className="absolute inset-0 bg-[#ff003c] mix-blend-color-dodge pointer-events-none"
                        style={{ transform: "translateZ(-350px) scale(1.5)" }}
                        animate={{
                            opacity: [0, 0, 0, 0.8, 0, 0.3, 0, 0, 0, 0],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "linear",
                            times: [0, 0.4, 0.42, 0.44, 0.46, 0.48, 0.5, 0.52, 0.8, 1]
                        }}
                    />

                    {/* Layer 2: Monster (Top half) with independent bobbing and breathing scale */}
                    <motion.div
                        className="absolute inset-0 bg-[url('/hero.png')] bg-cover bg-center bg-no-repeat"
                        style={{
                            // Rough crop for the top half (sky/monster area)
                            clipPath: "polygon(0 0, 100% 0, 100% 65%, 0 65%)",
                            transform: "translateZ(-150px) scale(1.25)"
                        }}
                        animate={{
                            y: ["0%", "1.5%", "0%"],
                            scale: [1, 1.02, 1],
                            rotateZ: [0, 0.5, -0.5, 0]
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        {/* Monster's specific intensified red glow overlay */}
                        <motion.div
                            className="absolute inset-0 top-[20%] left-[30%] right-[30%] bottom-[30%] bg-[radial-gradient(ellipse_at_center,_rgba(255,0,30,0.6)_0%,_transparent_70%)] mix-blend-color-dodge pointer-events-none"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>

                    {/* Layer 3: Kids and Car (Bottom foreground layer) pulled closer to camera */}
                    <div
                        className="absolute inset-0 bg-[url('/hero.png')] bg-cover bg-center bg-no-repeat"
                        style={{
                            // Rough crop for the bottom group
                            clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)",
                            transform: "translateZ(100px) scale(1.05)"
                        }}
                    >
                        {/* Simulated Car Blinkers/Lights (Positioned roughly where the car usually is on the left) */}
                        <motion.div
                            className="absolute bottom-[10%] left-[10%] w-[12vw] h-[6vw] flex items-center justify-between"
                        >
                            {/* Headlight 1 */}
                            <motion.div className="w-4 h-4 rounded-full bg-white shadow-[0_0_20px_10px_rgba(255,255,255,0.8)]"
                                animate={{ opacity: [0.3, 1, 0.2, 0.8, 0.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                            {/* Headlight 2 / Taillight */}
                            <motion.div className="w-5 h-5 rounded-full bg-red-500 shadow-[0_0_30px_15px_rgba(255,0,0,0.9)]"
                                animate={{ opacity: [1, 0.4, 1, 0.2] }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            />
                        </motion.div>
                    </div>

                    {/* Dark Cinematic Overlay: Black to Dark Red Gradient */}
                    <div
                        className="absolute inset-0 bg-gradient-to-t from-[#150005] via-[#0a0002]/80 to-black/90 pointer-events-none"
                        style={{ transform: "translateZ(150px) scale(1.1)" }}
                    />

                    {/* Slow Atmospheric Pulsing Red Ambient Light */}
                    <motion.div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,0,30,0.15)_0%,_transparent_60%)] pointer-events-none mix-blend-color-dodge"
                        style={{ transform: "translateZ(150px)" }}
                        animate={{
                            opacity: [0.3, 0.8, 0.3],
                            scale: [0.9, 1.2, 0.9]
                        }}
                        transition={{
                            duration: 7,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Extra Intense central glow and fog spread on boot */}
                    <AnimatePresence>
                        {isBooting && (
                            <motion.div
                                className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,0,30,0.9)_0%,_transparent_70%)] pointer-events-none mix-blend-color-dodge"
                                style={{ transform: "translateZ(160px)" }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 2 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        )}
                        {isBooting && (
                            <motion.div
                                className="absolute inset-0 bg-white/5 mix-blend-overlay backdrop-blur-sm pointer-events-none"
                                style={{ transform: "translateZ(170px)" }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8 }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Fog Layer (CSS Animation) */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden mix-blend-screen" style={{ transform: "translateZ(180px) scale(1.1)" }}>
                        <motion.div
                            className="absolute w-[200%] h-full opacity-60 blend-lighten"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")` }}
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                </motion.div>
            </motion.div>

            {/* Canvas Particle System Layer (Midway) */}
            <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none" style={{ transform: "translateZ(0px)" }} />

            {/* Cinematic Effects: CRT Scanlines (Midway) */}
            <div className="absolute inset-0 z-30 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-50 mix-blend-overlay" style={{ transform: "translateZ(50px)" }} />

            {/* Content Container (Pulled forward) */}
            <motion.div
                className="relative z-40 flex flex-col items-center text-center w-full"
                style={{ z: 200 }}
            >
                <AnimatePresence>
                    {!isBooting ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{
                                opacity: 0,
                                scale: 1.15,
                                filter: "blur(15px) contrast(150%) hue-rotate(45deg)",
                                x: [0, -15, 15, -10, 10, 0], // Text glitch effect
                            }}
                            transition={{ duration: 1.2 }}
                            className="flex flex-col items-center justify-center space-y-4"
                        >
                            {/* Cinematic Title */}
                            <motion.h1
                                className="text-6xl md:text-8xl lg:text-9xl font-black tracking-[0.25em] font-mono text-transparent bg-clip-text bg-gradient-to-b from-[#ff003c] to-[#990024]"
                                style={{
                                    textShadow: "0 0 30px rgba(255, 0, 60, 0.6), 0 0 60px rgba(255, 0, 60, 0.4)",
                                }}
                                animate={{
                                    textShadow: [
                                        "0 0 30px rgba(255, 0, 60, 0.6), 0 0 60px rgba(255, 0, 60, 0.4)",
                                        "0 0 50px rgba(255, 0, 60, 0.9), 0 0 90px rgba(255, 0, 60, 0.6)",
                                        "0 0 30px rgba(255, 0, 60, 0.6), 0 0 60px rgba(255, 0, 60, 0.4)",
                                    ],
                                    opacity: [1, 0.85, 1, 0.95, 1]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    ease: "easeInOut"
                                }}
                            >
                                CEREBRO
                            </motion.h1>

                            <motion.h2
                                className="text-lg md:text-xl lg:text-2xl font-bold tracking-[0.5em] text-[#ff003c] uppercase"
                                style={{ textShadow: "0 0 15px rgba(255,0,60,0.8)" }}
                            >
                                CODE RED SIGNAL TERMINAL
                            </motion.h2>

                            <motion.div
                                className="mt-20! text-xs md:text-sm tracking-[0.3em] font-semibold text-[#ff003c]/90 font-mono uppercase border border-[#ff003c]/30 py-3 px-8 rounded bg-black/50 backdrop-blur-md"
                                animate={{
                                    opacity: [0.5, 1, 0.5],
                                    boxShadow: ["0 0 0px rgba(255,0,60,0)", "0 0 25px rgba(255,0,60,0.4)", "0 0 0px rgba(255,0,60,0)"]
                                }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                CLICK ANYWHERE TO INITIATE TRANSMISSION
                            </motion.div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </motion.div>

            {/* Fade to black transition at the very end of boot */}
            <AnimatePresence>
                {isBooting && (
                    <motion.div
                        className="fixed inset-0 z-[100] bg-black pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 1.5,
                            ease: "easeIn"
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
