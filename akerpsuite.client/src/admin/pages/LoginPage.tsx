import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";

const API_BASE = "/api";
const SUN = { x: 220, y: 320 };

function polar(radius: number, angleDeg: number) {
    const a = (angleDeg * Math.PI) / 180;
    return { x: SUN.x + radius * Math.cos(a), y: SUN.y + radius * Math.sin(a) };
}

const PLANETS = [
    { id: "N-01", label: "SALES", radius: 65, angle: -60, color: "#FDBA74", size: 5 },
    { id: "N-02", label: "FINANCE", radius: 105, angle: 40, color: "#FDE68A", size: 6 },
    { id: "N-03", label: "HR", radius: 145, angle: 200, color: "#38BDF8", size: 6.5 },
    { id: "N-04", label: "LOGISTICS", radius: 180, angle: 120, color: "#FB7185", size: 5.5 },
    { id: "N-05", label: "INVENTORY", radius: 215, angle: -135, color: "#FCD34D", size: 7, ring: true },
].map((p) => ({ ...p, ...polar(p.radius, p.angle) }));

const STARS = [
    { x: 40, y: 40, r: 1.2, delay: 0 }, { x: 120, y: 20, r: 1, delay: 0.4 }, { x: 380, y: 50, r: 1.4, delay: 0.8 },
    { x: 410, y: 150, r: 1, delay: 1.2 }, { x: 30, y: 200, r: 1.3, delay: 1.6 }, { x: 400, y: 300, r: 1, delay: 0.2 },
    { x: 60, y: 380, r: 1.2, delay: 0.6 }, { x: 390, y: 420, r: 1, delay: 1.0 }, { x: 20, y: 500, r: 1.4, delay: 1.4 },
    { x: 200, y: 600, r: 1, delay: 0.3 }, { x: 350, y: 580, r: 1.2, delay: 0.9 }, { x: 100, y: 560, r: 1, delay: 1.3 },
    { x: 250, y: 30, r: 1.1, delay: 0.5 }, { x: 150, y: 120, r: 1, delay: 1.1 }, { x: 330, y: 220, r: 1.3, delay: 0.7 },
];

export default function LoginPage() {
    const [form, setForm] = useState({ username: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 60);
        return () => clearTimeout(t);
    }, []);

    const handleChange = (e: any) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!form.username || !form.password) {
            setError("Username and password are required.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data?.message || "Login failed. Please check your credentials.");
                return;
            }

            const userData = data?.data;

            localStorage.setItem("token", userData?.token);
            localStorage.setItem("role", userData?.role);
            localStorage.setItem("username", userData?.username);
            localStorage.setItem("userId", userData?.userId);
            localStorage.setItem("empId", userData?.employeeId ?? "");
            localStorage.setItem("pages", JSON.stringify(userData?.pages));
            localStorage.setItem("user", JSON.stringify(userData));

            window.location.href = "/dashboard";
        } catch {
            setError("Could not connect to server. Please check your network connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans bg-[#F2F5F9] overflow-hidden relative">
            <style>{`
                @keyframes bpOrbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes bpTwinkle { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.9; } }
                @keyframes bpPulse { 0% { opacity: 0.6; transform: scale(0.4); } 100% { opacity: 0; transform: scale(2.2); } }
                
                .bp-orbit-ring {
                    fill: none;
                    stroke: rgba(255, 255, 255, 0.16);
                    stroke-width: 1;
                    stroke-dasharray: 2.5 5;
                    transform-origin: 220px 320px;
                    animation: bpOrbitSpin linear infinite;
                }
                .bp-ray {
                    stroke: rgba(255, 214, 120, 0.55);
                    stroke-width: 1.5;
                    stroke-linecap: round;
                    transform-origin: 220px 320px;
                    animation: bpOrbitSpin 46s linear infinite;
                }
                .bp-star { fill: #FFFFFF; animation: bpTwinkle 3.2s ease-in-out infinite; }
                .bp-node-pulse { fill: none; stroke: #FFFFFF; stroke-width: 1; opacity: 0; transform-origin: center; animation: bpPulse 3s ease-out infinite; }
                .bp-sun-pulse { fill: none; stroke: #FDE68A; stroke-width: 1; opacity: 0; transform-origin: center; animation: bpPulse 3s ease-out infinite; }
            `}</style>

            {/* ---- Left Panel: Deep Teal Gradient with Solar System ---- */}
            <div className="hidden lg:flex flex-col w-[45%] max-w-[620px] relative z-10" style={{ background: "linear-gradient(165deg, #0b2532 0%, #0f3345 60%, #15455c 100%)" }}>

                {/* Header Logo */}
                <div className="absolute top-12 left-12 z-20 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-[10px] flex items-center justify-center shadow-lg border border-white/10">
                        <img src={logo} alt="AKS Solar" className="w-8 h-8 object-contain" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">AKS Solar</span>
                </div>

                {/* Animated Solar System SVG */}
                <div className="flex-1 flex items-center justify-center w-full h-full p-8 relative mt-16">
                    <svg viewBox="0 0 440 640" className="w-full max-w-[400px]">
                        <defs>
                            <radialGradient id="sunGradient" cx="35%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#FFF7D6" />
                                <stop offset="45%" stopColor="#FDE68A" />
                                <stop offset="100%" stopColor="#F59E0B" />
                            </radialGradient>
                        </defs>

                        {/* Stars */}
                        {STARS.map((s, i) => (
                            <circle key={`star-${i}`} cx={s.x} cy={s.y} r={s.r} className="bp-star" style={{ animationDelay: `${s.delay}s` }} />
                        ))}

                        {/* Orbit rings */}
                        {PLANETS.map((p) => (
                            <circle
                                key={`ring-${p.id}`}
                                cx={SUN.x} cy={SUN.y} r={p.radius}
                                className="bp-orbit-ring"
                                style={{ animationDuration: `${18 + p.radius / 4}s` }}
                            />
                        ))}

                        {/* Sunburst rays */}
                        <g className="bp-ray">
                            {Array.from({ length: 8 }).map((_, i) => {
                                const a = (i * 45 * Math.PI) / 180;
                                const r1 = 30, r2 = 42;
                                return (
                                    <line
                                        key={`ray-${i}`}
                                        x1={SUN.x + r1 * Math.cos(a)} y1={SUN.y + r1 * Math.sin(a)}
                                        x2={SUN.x + r2 * Math.cos(a)} y2={SUN.y + r2 * Math.sin(a)}
                                    />
                                );
                            })}
                        </g>

                        {/* The Sun */}
                        <circle cx={SUN.x} cy={SUN.y} r="26" fill="url(#sunGradient)" />
                        <circle cx={SUN.x} cy={SUN.y} r="26" className="bp-sun-pulse" style={{ animationDelay: "0s" }} />
                        <circle cx={SUN.x} cy={SUN.y} r="26" className="bp-sun-pulse" style={{ animationDelay: "1.5s" }} />

                        {/* Orbiting planets */}
                        {PLANETS.map((p, i) => (
                            <g key={`planet-${p.id}`}>
                                {p.ring && (
                                    <ellipse
                                        cx={p.x} cy={p.y} rx={p.size + 5} ry={(p.size + 5) * 0.35}
                                        fill="none" stroke={p.color} strokeWidth="1.2" opacity="0.75"
                                        transform={`rotate(-20 ${p.x} ${p.y})`}
                                    />
                                )}
                                <circle cx={p.x} cy={p.y} r={p.size} fill={p.color} stroke="rgba(8, 11, 24, 0.5)" strokeWidth="1" />
                                <circle cx={p.x} cy={p.y} r={p.size} className="bp-node-pulse" style={{ animationDelay: `${i * 0.5 + 0.3}s` }} />
                                <text x={p.x} y={p.y - p.size - 8} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.6)" letterSpacing="0.5" className="font-mono font-bold">
                                    {p.id}
                                </text>
                                <text x={p.x} y={p.y + p.size + 14} textAnchor="middle" fontSize="8.5" fill="#FFFFFF" letterSpacing="1" className="font-bold">
                                    {p.label}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>
            </div>

            {/* ---- Right Panel: Clean White Access Console ---- */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-0">
                <div className={`w-full max-w-[420px] transition-all duration-700 ease-out transform ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} z-10`}>

                    {/* Mobile Logo Header */}
                    <div className="flex lg:hidden items-center gap-3 mb-8">
                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-[10px] shadow-sm border border-slate-200">
                            <img src={logo} alt="AKS Solar" className="w-6 h-6 object-contain" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-[#0b2532]">AKS Solar</span>
                    </div>

                    {/* Login Card */}
                    <div className="w-full bg-white rounded-[24px] p-8 sm:p-10 relative shadow-[0_24px_60px_-20px_rgba(16,35,59,0.22),_0_4px_16px_-4px_rgba(16,35,59,0.08)] border border-slate-200/50">

                        {/* Stamp (Absolute Top Right) */}
                        <div className="absolute -top-6 -right-6 w-[88px] h-[88px] rounded-full border-[1.5px] border-dashed border-amber-500 flex items-center justify-center rotate-[-9deg] bg-white shadow-[0_8px_20px_-6px_rgba(245,158,11,0.35)] z-20">
                            <span className="text-[10px] font-bold text-amber-500 text-center tracking-[0.14em] leading-tight uppercase">
                                SECURE<br />ACCESS
                            </span>
                        </div>

                       

                        <h1 className="text-[2rem] font-bold text-[#0b2532] tracking-tight mb-2">Sign in</h1>
                        <p className="text-sm font-medium text-black-500 mb-8">Enter your workspace credentials to continue.</p>

                        {error && (
                            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in">
                                <i className="fa-solid fa-triangle-exclamation text-base" /> {error}
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} noValidate className="space-y-5">

                            {/* Username Field */}
                            <div>
                                <label htmlFor="username" className="block text-[10px] font-bold uppercase tracking-widest text-black-500 mb-2 ml-1">
                                    Username
                                </label>
                                <div className="relative group">
                                    <i className="fa-regular fa-user absolute left-4 top-1/2 -translate-y-1/2 text-black-400 group-focus-within:text-[#0b2532] transition-colors" />
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        placeholder="username"
                                        value={form.username}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="w-full bg-[#f4f7fb] border border-transparent focus:border-[#0b2532]/20 focus:bg-white focus:ring-4 focus:ring-[#0b2532]/5 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-800 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest text-black-500 mb-2 ml-1">
                                    Password
                                </label>
                                <div className="relative group">
                                    <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-black-400 group-focus-within:text-[#0b2532] transition-colors" />
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPass ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="w-full bg-[#f4f7fb] border border-transparent focus:border-[#0b2532]/20 focus:bg-white focus:ring-4 focus:ring-[#0b2532]/5 rounded-xl py-3.5 pl-11 pr-10 text-sm font-bold text-slate-800 transition-all outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass((v) => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-black-400 hover:text-slate-600 transition-colors focus:outline-none"
                                        title={showPass ? "Hide password" : "Show password"}
                                    >
                                        <i className={`fa-regular ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-[0_8px_20px_-6px_rgba(11,40,54,0.4)] hover:bg-[#0f3345] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <i className="fa-solid fa-spinner animate-spin" /> Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            Sign In <i className="fa-solid fa-arrow-right-to-bracket text-amber-400 ml-1" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}