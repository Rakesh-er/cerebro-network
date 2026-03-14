import { useUIStore } from "@/store/uiStore"
import { TerminalText } from "@/components/ui/terminal-text"

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function TimecodeDisplay() {
    const currentTime = useUIStore(state => state.currentTime)
    const duration = useUIStore(state => state.duration)

    return (
        <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-sm border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff003c] animate-pulse" />
            <TerminalText className="text-xs text-[#ffae00] font-orbitron tracking-widest">
                {formatTime(currentTime)} / {formatTime(duration)}
            </TerminalText>
        </div>
    )
}
