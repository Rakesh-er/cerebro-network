import { BrowserRouter, Routes, Route } from "react-router-dom"
import { HomePage } from "@/pages/HomePage"
import { BroadcasterConsole } from "@/pages/BroadcasterConsole"
import { ListenerConsole } from "@/pages/ListenerConsole"
import { JoinPage } from "@/pages/JoinPage"
import { DebugConsole } from "@/pages/DebugConsole"
import { ConsoleFrame } from "@/components/layout/ConsoleFrame"
import { IntroScreen } from "@/components/IntroScreen"
import { Outlet } from "react-router-dom"

function ConsoleLayout() {
    return (
        <ConsoleFrame>
            <Outlet />
        </ConsoleFrame>
    )
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<IntroScreen />} />
                <Route element={<ConsoleLayout />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/broadcaster" element={<BroadcasterConsole />} />
                    <Route path="/join" element={<JoinPage />} />
                    <Route path="/listener" element={<ListenerConsole />} />
                    <Route path="/debug" element={<DebugConsole />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}
