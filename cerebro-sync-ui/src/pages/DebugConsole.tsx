import { RetroPanel } from "@/components/layout/RetroPanel"
import { TerminalText } from "@/components/ui/terminal-text"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/store/uiStore"
import { motion } from "framer-motion"
import { Activity, Cpu, Database, Network, Server, Users, ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"

export function DebugConsole() {
    const { isBroadcasting, connectionStatus, latencyMs, connectedUsers, isPlaying, currentTime, duration } = useUIStore()

    type MetricItem = {
        label: string;
        value: string | number;
        icon: React.ComponentType<{ className?: string }>;
        color: "green" | "red" | "amber" | "white";
    }

    const metrics: MetricItem[] = [
        { label: "SYS_UPTIME", value: "99.999%", icon: Activity, color: "green" },
        { label: "MEMORY_USAGE", value: "842 MB", icon: Database, color: "white" },
        { label: "CPU_LOAD", value: isBroadcasting ? "89%" : "12%", icon: Cpu, color: isBroadcasting ? "red" : "green" },
        { label: "ACTIVE_NODES", value: connectedUsers, icon: Users, color: "amber" },
        { label: "AVG_LATENCY", value: `${latencyMs} ms`, icon: Network, color: latencyMs > 80 ? "red" : "green" },
        { label: "MASTER_SERVER", value: connectionStatus === 'OFFLINE' ? "DORMANT" : "ONLINE", icon: Server, color: connectionStatus === 'OFFLINE' ? "red" : "green" },
    ]

    return (
        <div className="w-full max-w-5xl flex flex-col gap-6">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 pb-4 border-b border-white/10"
            >
                <Link to="/">
                    <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl font-orbitron font-bold text-[#ffae00] tracking-widest" style={{ textShadow: "0 0 10px #ffae00" }}>
                        SUPERVISOR DIAGNOSTICS
                    </h1>
                    <TerminalText className="text-white/40 text-xs mt-1">SYSTEM TELEMETRY // READ-ONLY</TerminalText>
                </div>
            </motion.div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {metrics.map((m, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                    >
                        <RetroPanel className="hover:border-white/30 transition-colors cursor-default">
                            <div className="flex items-center justify-between mb-3 opacity-50">
                                <TerminalText className="text-[10px] text-white/60">{m.label}</TerminalText>
                                <m.icon className="w-3.5 h-3.5 text-white/40" />
                            </div>
                            <TerminalText color={m.color} className="text-xl">
                                {m.value}
                            </TerminalText>
                        </RetroPanel>
                    </motion.div>
                ))}
            </div>

            {/* State Registry Panel */}
            <RetroPanel title="GLOBAL STATE REGISTRY" variant="amber" className="relative overflow-hidden">
                <div className="font-mono text-sm space-y-1 leading-relaxed text-white/70">
                    <p><span className="text-[#ffae00]">{"{"}</span></p>
                    <p className="pl-4"><span className="text-white/40">"isBroadcasting"</span>: <span className={isBroadcasting ? "text-[#00ff9f]" : "text-red-400"}>{String(isBroadcasting)}</span>,</p>
                    <p className="pl-4"><span className="text-white/40">"connectionStatus"</span>: <span className="text-blue-400">"{connectionStatus}"</span>,</p>
                    <p className="pl-4"><span className="text-white/40">"latencyMs"</span>: <span className="text-[#ffae00]">{latencyMs}</span>,</p>
                    <p className="pl-4"><span className="text-white/40">"connectedUsers"</span>: <span className="text-[#ffae00]">{connectedUsers}</span>,</p>
                    <p className="pl-4"><span className="text-white/40">"video"</span>: <span className="text-[#ffae00]">{"{"}</span></p>
                    <p className="pl-8"><span className="text-white/40">"isPlaying"</span>: <span className={isPlaying ? "text-[#00ff9f]" : "text-red-400"}>{String(isPlaying)}</span>,</p>
                    <p className="pl-8"><span className="text-white/40">"currentTime"</span>: <span className="text-[#ffae00]">{currentTime.toFixed(2)}</span>,</p>
                    <p className="pl-8"><span className="text-white/40">"duration"</span>: <span className="text-[#ffae00]">{duration.toFixed(2)}</span></p>
                    <p className="pl-4"><span className="text-[#ffae00]">{"}"}</span></p>
                    <p><span className="text-[#ffae00]">{"}"}</span></p>
                </div>

                {/* Scanning bar animation */}
                <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-[#ffae00]/30 blur-sm pointer-events-none"
                    animate={{ top: ["0%", "100%"] }}
                    transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                />
            </RetroPanel>
        </div>
    )
}
