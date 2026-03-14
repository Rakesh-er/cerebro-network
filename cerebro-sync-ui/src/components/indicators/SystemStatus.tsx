import { useUIStore } from "@/store/uiStore"
import { TerminalText } from "@/components/ui/terminal-text"
import { motion } from "framer-motion"
import { Activity, Users, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

export function SystemStatus() {
    const { connectionStatus, latencyMs, connectedUsers } = useUIStore()

    const statusInfo = {
        OFFLINE: { color: "text-red-500", dot: "bg-red-500", label: "OFFLINE" },
        CONNECTING: { color: "text-yellow-400", dot: "bg-yellow-400", label: "CONNECTING..." },
        SYNCED: { color: "text-[#00ff9f]", dot: "bg-[#00ff9f]", label: "SYNCED" },
        BUFFERING: { color: "text-yellow-400", dot: "bg-yellow-400", label: "BUFFERING" },
        RECONNECTING: { color: "text-orange-400", dot: "bg-orange-400", label: "RECONNECTING" },
        BROADCASTING: { color: "text-[#ffae00]", dot: "bg-[#ffae00]", label: "BROADCASTING" },
    }

    const info = statusInfo[connectionStatus] ?? statusInfo.OFFLINE

    return (
        <div className="flex flex-wrap gap-3 items-center px-4 py-3 bg-black/70 border border-white/10 rounded-sm font-orbitron">

            {/* Status with pulse dot */}
            <div className="flex items-center gap-2">
                <div className="relative flex h-2.5 w-2.5">
                    {(connectionStatus === 'BROADCASTING' || connectionStatus === 'SYNCED') && (
                        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", info.dot)} />
                    )}
                    <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", info.dot)} />
                </div>
                <TerminalText className={cn("text-xs", info.color)}>
                    {info.label}
                </TerminalText>
            </div>

            <div className="w-px h-4 bg-white/10" />

            {/* Latency */}
            <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-white/40" />
                <TerminalText className="text-xs text-white/60">
                    {connectionStatus === 'OFFLINE' ? '—' : `${latencyMs}ms`}
                </TerminalText>
            </div>

            <div className="w-px h-4 bg-white/10" />

            {/* Users */}
            <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-white/40" />
                <TerminalText className="text-xs text-white/60">
                    {connectedUsers} {connectedUsers === 1 ? 'NODE' : 'NODES'}
                </TerminalText>
            </div>

            {/* Wifi pulse */}
            <motion.div
                className="ml-2"
                animate={connectionStatus !== 'OFFLINE' ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.2 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
                <Wifi className={cn("w-4 h-4", info.color)} />
            </motion.div>
        </div>
    )
}
