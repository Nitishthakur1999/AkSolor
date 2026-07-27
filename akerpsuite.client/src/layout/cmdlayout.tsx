import { Outlet } from "react-router-dom";
import Sidebar from "@/admin/pages/sidebar";

export default function CmdLayout() {
    return (
        // ✅ BG color slate-50 forced to make background light mode
        <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
            {/* Left Sidebar Fixed Panel */}
            <Sidebar />

            {/* Main Content Area Wrapper */}
            <main className="flex-1 min-w-0 ml-64">

                {/* Fixed Top System Header — Clean light look 
                <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">System Node:</span>
                        <span className="text-sm text-indigo-600 font-mono font-semibold tracking-wide">Portal</span>
                    </div>


                </header>

                {/* Main Dynamic Workspace Route Target */}
                <div className="p-2 max-w-[1600px] mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}