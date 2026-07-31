import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";

const API_BASE = "/api";

// Departments as planets orbiting a shared sun — solar system / solar energy motif
const SUN = { x: 220, y: 320 };

function polar(radius, angleDeg) {
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

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e) => {
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
        <div className="bp-root">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
 
                .bp-root {
                    --bp-bg: #F2F5F9;
                    --bp-ink: #10233B;
                    --bp-dim: #64748B;
                    --bp-line: #0D9488;
                    --bp-line-soft: rgba(13, 148, 136, 0.18);
                    --bp-accent: #FF6A3D;
                    --bp-accent-soft: rgba(255, 106, 61, 0.16);
                    --bp-rose: #DC2626;
                    position: fixed;
                    inset: 0;
                    min-height: 100vh;
                    display: flex;
                    background: var(--bp-bg);
                    font-family: 'Inter', sans-serif;
                    color: var(--bp-ink);
                    overflow: hidden;
                }
 
                .bp-display { font-family: 'Space Grotesk', sans-serif; }
                .bp-mono { font-family: 'JetBrains Mono', monospace; }
 
                /* ---- Left: deep space to solar-flare gradient ---- */
                .bp-panel-left {
                    position: relative;
                    width: 46%;
                    max-width: 620px;
                    flex-shrink: 0;
                    background: linear-gradient(165deg, #080B18 0%, #1B1436 38%, #7C2D12 78%, #F59E0B 140%);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 3rem 3rem;
                    z-index: 2;
                    overflow: hidden;
                }
                .bp-glow {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                }
                .bp-glow.one { width: 340px; height: 340px; background: rgba(245, 158, 11, 0.4); top: -90px; right: -110px; }
                .bp-glow.two { width: 300px; height: 300px; background: rgba(124, 58, 237, 0.28); bottom: -70px; left: -90px; }
 
                .bp-star {
                    fill: #FFFFFF;
                    animation: bpTwinkle 3.2s ease-in-out infinite;
                }
                @keyframes bpTwinkle { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.9; } }
 
                .bp-orbit-ring {
                    fill: none;
                    stroke: rgba(255, 255, 255, 0.16);
                    stroke-width: 1;
                    stroke-dasharray: 2.5 5;
                    transform-origin: 220px 320px;
                    animation: bpOrbitSpin linear infinite;
                }
                @keyframes bpOrbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
 
                .bp-ray {
                    stroke: rgba(255, 214, 120, 0.55);
                    stroke-width: 1.5;
                    stroke-linecap: round;
                    transform-origin: 220px 320px;
                    animation: bpOrbitSpin 46s linear infinite;
                }
 
                .bp-planet { stroke: rgba(8, 11, 24, 0.5); stroke-width: 1; }
                .bp-planet-ring { fill: none; stroke-width: 1.2; opacity: 0.75; }
                .bp-sun-pulse {
                    fill: none;
                    stroke: #FDE68A;
                    stroke-width: 1;
                    opacity: 0;
                    transform-origin: center;
                    animation: bpPulse 3s ease-out infinite;
                }
 
                .bp-status-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: var(--bp-accent);
                    box-shadow: 0 0 8px var(--bp-accent);
                    animation: bpBlink 2.4s ease-in-out infinite;
                }
                @keyframes bpBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
 
                .bp-schematic-line {
                    stroke: rgba(255, 255, 255, 0.4);
                    stroke-width: 1.25;
                    fill: none;
                    stroke-dasharray: 6 5;
                }
                .bp-schematic-line.animate {
                    stroke-dashoffset: 0;
                    transition: stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .bp-node-dot {
                    fill: #0F2942;
                    stroke: #FFFFFF;
                    stroke-width: 1.5;
                }
                .bp-hub-dot { fill: var(--bp-accent); }
                .bp-node-pulse {
                    fill: none;
                    stroke: #FFFFFF;
                    stroke-width: 1;
                    opacity: 0;
                    transform-origin: center;
                    animation: bpPulse 3s ease-out infinite;
                }
                @keyframes bpPulse {
                    0% { opacity: 0.6; transform: scale(0.4); }
                    100% { opacity: 0; transform: scale(2.2); }
                }
 
                .bp-fade {
                    opacity: 0;
                    transform: translateY(8px);
                    transition: opacity 0.6s ease, transform 0.6s ease;
                }
                .bp-fade.in { opacity: 1; transform: translateY(0); }
 
                /* ---- Right: clean white access card ---- */
                .bp-right-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(90px);
                    pointer-events: none;
                    z-index: 0;
                }
                .bp-right-blob.a { width: 380px; height: 380px; background: var(--bp-line-soft); top: -120px; right: 10%; }
                .bp-right-blob.b { width: 320px; height: 320px; background: var(--bp-accent-soft); bottom: -100px; left: 5%; }
 
                .bp-card {
                    position: relative;
                    width: 100%;
                    max-width: 26rem;
                    background: #FFFFFF;
                    border: 1px solid rgba(16, 35, 59, 0.08);
                    box-shadow: 0 24px 60px -20px rgba(16, 35, 59, 0.22), 0 4px 16px -4px rgba(16, 35, 59, 0.08);
                    padding: 2.75rem 2.5rem;
                    z-index: 1;
                }
                .bp-card::before, .bp-card::after {
                    content: "";
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    border-color: var(--bp-line);
                    border-style: solid;
                }
                .bp-card::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
                .bp-card::after { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }
 
                .bp-stamp {
                    position: absolute;
                    top: -22px;
                    right: 28px;
                    width: 88px;
                    height: 88px;
                    border-radius: 50%;
                    border: 1.5px dashed var(--bp-accent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transform: rotate(-9deg);
                    background: #FFFFFF;
                    box-shadow: 0 8px 20px -6px rgba(255, 106, 61, 0.35);
                    z-index: 4;
                }
                .bp-stamp-text {
                    font-size: 0.5rem;
                    letter-spacing: 0.14em;
                    color: var(--bp-accent);
                    text-align: center;
                    line-height: 1.5;
                    font-weight: 700;
                }
 
                .bp-field-wrap {
                    position: relative;
                }
                .bp-field-icon {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--bp-dim);
                    pointer-events: none;
                }
 
                .bp-field-input {
                    background: transparent;
                    border: none;
                    border-bottom: 1.5px solid rgba(16, 35, 59, 0.15);
                    color: var(--bp-ink);
                    width: 100%;
                    padding: 0.6rem 1.75rem 0.6rem 1.6rem;
                    font-size: 0.9rem;
                    transition: border-color 0.2s ease;
                }
                .bp-field-input:focus {
                    outline: none;
                    border-bottom-color: var(--bp-line);
                }
                .bp-field-input::placeholder { color: #A6B2C2; }
                .bp-field-input:disabled { opacity: 0.5; cursor: not-allowed; }
 
                .bp-btn {
                    position: relative;
                    width: 100%;
                    padding: 0.9rem 1rem;
                    background: linear-gradient(135deg, #FF7A45 0%, var(--bp-accent) 100%);
                    color: #FFFFFF;
                    font-weight: 600;
                    font-size: 0.85rem;
                    letter-spacing: 0.02em;
                    border: none;
                    clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
                    box-shadow: 0 12px 28px -10px rgba(255, 106, 61, 0.55);
                    transition: filter 0.15s ease, transform 0.1s ease, box-shadow 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                .bp-btn:hover:not(:disabled) { filter: brightness(1.06); box-shadow: 0 14px 32px -8px rgba(255, 106, 61, 0.65); }
                .bp-btn:active:not(:disabled) { transform: scale(0.99); }
                .bp-btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
                .bp-btn:focus-visible { outline: 2px solid var(--bp-line); outline-offset: 2px; }
 
                .bp-title-gradient {
                    background: linear-gradient(90deg, var(--bp-ink) 0%, var(--bp-line) 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
 
                @media (prefers-reduced-motion: reduce) {
                    .bp-status-dot, .bp-node-pulse, .bp-sun-pulse, .bp-fade, .bp-star, .bp-orbit-ring, .bp-ray {
                        animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important;
                    }
                }
 
                @media (max-width: 1023px) {
                    .bp-panel-left { display: none; }
                }
            `}</style>

            <div className="bp-right-blob a" />
            <div className="bp-right-blob b" />

            {/* Left — the living schematic, bold color block */}
            <div className="bp-panel-left">
                <div className="bp-glow one" />
                <div className="bp-glow two" />

                <div className="relative flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-full ">
                        <img
                            src={logo}
                            alt="AkerpSuite logo"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <span className="bp-display text-lg font-semibold tracking-tight text-white">AKS Solar</span>
                   
                </div>

                <div className="relative flex-1 flex items-center justify-center py-8">
                    <svg viewBox="0 0 440 640" className="w-full max-w-[380px]">
                        <defs>
                            <radialGradient id="sunGradient" cx="35%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#FFF7D6" />
                                <stop offset="45%" stopColor="#FDE68A" />
                                <stop offset="100%" stopColor="#F59E0B" />
                            </radialGradient>
                        </defs>

                        {/* starfield */}
                        {STARS.map((s, i) => (
                            <circle key={i} cx={s.x} cy={s.y} r={s.r} className="bp-star" style={{ animationDelay: `${s.delay}s` }} />
                        ))}

                        {/* orbit rings, each spinning at a slightly different speed */}
                        {PLANETS.map((p) => (
                            <circle
                                key={`ring-${p.id}`}
                                cx={SUN.x} cy={SUN.y} r={p.radius}
                                className="bp-orbit-ring"
                                style={{ animationDuration: `${18 + p.radius / 4}s` }}
                            />
                        ))}

                        {/* sunburst rays, slowly rotating */}
                        <g className="bp-ray" style={{ transform: mounted ? undefined : "rotate(0deg)" }}>
                            {Array.from({ length: 8 }).map((_, i) => {
                                const a = (i * 45 * Math.PI) / 180;
                                const r1 = 30, r2 = 42;
                                return (
                                    <line
                                        key={i}
                                        className="bp-ray"
                                        x1={SUN.x + r1 * Math.cos(a)} y1={SUN.y + r1 * Math.sin(a)}
                                        x2={SUN.x + r2 * Math.cos(a)} y2={SUN.y + r2 * Math.sin(a)}
                                    />
                                );
                            })}
                        </g>

                        {/* the sun */}
                        <circle cx={SUN.x} cy={SUN.y} r="26" fill="url(#sunGradient)" />
                        <circle cx={SUN.x} cy={SUN.y} r="26" className="bp-sun-pulse" style={{ animationDelay: "0s" }} />
                        <circle cx={SUN.x} cy={SUN.y} r="26" className="bp-sun-pulse" style={{ animationDelay: "1.5s" }} />

                        {/* orbiting planets */}
                        {PLANETS.map((p, i) => (
                            <g key={p.id}>
                                {p.ring && (
                                    <ellipse
                                        cx={p.x} cy={p.y} rx={p.size + 5} ry={(p.size + 5) * 0.35}
                                        className="bp-planet-ring" stroke={p.color}
                                        transform={`rotate(-20 ${p.x} ${p.y})`}
                                    />
                                )}
                                <circle cx={p.x} cy={p.y} r={p.size} fill={p.color} className="bp-planet" />
                                <circle cx={p.x} cy={p.y} r={p.size} className="bp-node-pulse" style={{ animationDelay: `${i * 0.5 + 0.3}s` }} />
                                <text x={p.x} y={p.y - p.size - 8} textAnchor="middle" className="bp-mono" fontSize="9" fill="rgba(255,255,255,0.55)" letterSpacing="0.5">
                                    {p.id}
                                </text>
                                <text x={p.x} y={p.y + p.size + 14} textAnchor="middle" className="bp-mono" fontSize="8.5" fill="#FFFFFF" letterSpacing="1">
                                    {p.label}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>

                <div className="relative space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="bp-status-dot" />
                        <span className="bp-mono text-[0.65rem] text-white/60 tracking-widest uppercase">Solar core — stable output</span>
                    </div>
                    <h2 className="bp-display text-[1.8rem] font-semibold leading-[1.25] max-w-sm text-white">
                        Every department, orbiting one core.
                    </h2>
                    <p className="text-sm leading-relaxed max-w-sm text-white/70">
                        Projects, records, and access — all circling a single source of truth, kept in sync like planets around a shared sun.
                    </p>
                    <p className="bp-mono text-[0.65rem] text-white/50 pt-4 border-t border-white/15">
                        © {new Date().getFullYear()} AKERPSUITE — ALL RIGHTS RESERVED
                    </p>
                </div>
            </div>

            {/* Right — clean white access console */}
            <div className="flex-1 flex items-center justify-center relative z-10 px-6 py-12 overflow-y-auto">
                <div className={`w-full max-w-md flex flex-col items-center bp-fade ${mounted ? "in" : ""}`}>

                    <div className="flex lg:hidden items-center gap-3 mb-8">
                        <div className="w-8 h-8 flex items-center justify-center border border-[color:var(--bp-line)]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#0D9488">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h16v16H4z M4 12h16 M12 4v16" />
                            </svg>
                        </div>
                        <span className="bp-display text-lg font-semibold tracking-tight">AkerpSuite</span>
                    </div>

                    <div className="bp-card">
                        <div className="bp-stamp">
                            <span className="bp-stamp-text">ACCESS<br />SECURED</span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <span className="bp-status-dot" />
                            <span className="bp-mono text-[0.65rem] tracking-[0.15em] uppercase" style={{ color: "var(--bp-line)" }}>
                                Enterprise access terminal
                            </span>
                        </div>

                        <h1 className="bp-display bp-title-gradient text-[2rem] font-semibold tracking-tight mb-1">Sign in</h1>
                        <p className="text-sm text-[color:var(--bp-dim)] mb-8">Enter your workspace credentials to continue.</p>

                        <form onSubmit={handleSubmit} noValidate className="space-y-6">
                            <div>
                                <label htmlFor="username" className="bp-mono block text-[0.65rem] tracking-widest uppercase text-[color:var(--bp-dim)] mb-2">
                                    Username
                                </label>
                                <div className="bp-field-wrap">
                                    <span className="bp-field-icon">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        placeholder="Enter a username"
                                        value={form.username}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="bp-field-input px-6"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="bp-mono block text-[0.65rem] tracking-widest uppercase text-[color:var(--bp-dim)]">
                                        Password
                                    </label>
                                  
                                </div>
                                <div className="bp-field-wrap relative">
                                    <span className="bp-field-icon">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPass ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="bp-field-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass((v) => !v)}
                                        aria-label={showPass ? "Hide password" : "Show password"}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity p-1 focus:outline-none"
                                        style={{ color: "var(--bp-dim)" }}
                                    >
                                        {showPass ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-2.5 border-l-2 pl-3 py-1" style={{ borderColor: "var(--bp-rose)" }}>
                                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="var(--bp-rose)">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="bp-mono text-[0.75rem] leading-tight" style={{ color: "var(--bp-rose)" }}>{error}</span>
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="bp-btn">
                                {loading ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Authenticating…
                                    </>
                                ) : (
                                    "Sign in"
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-sm text-[color:var(--bp-dim)] mt-8">
                        Don't have an account?{" "}
                        <a href="/register" className="font-semibold transition-all focus:outline-none focus:underline" style={{ color: "var(--bp-line)" }}>
                            Contact corporate team
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}