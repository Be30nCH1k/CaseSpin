import { SpinResult } from '../../../types/upgrade.types';

interface WheelProps {
    chance: number;
    needleDeg: number;
    spinning: boolean;
    result: SpinResult;
}

const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);

export const Wheel = ({ chance, needleDeg, spinning, result }: WheelProps) => {
    const R = 100, CX = 120, CY = 120;
    const winDeg = Math.max(0.01, Math.min(359.99, (chance / 100) * 360));

    const sector = (start: number, end: number) => {
        const s = toRad(start), e = toRad(end);
        const x1 = CX + R * Math.cos(s), y1 = CY + R * Math.sin(s);
        const x2 = CX + R * Math.cos(e), y2 = CY + R * Math.sin(e);
        const large = end - start > 180 ? 1 : 0;
        return `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`;
    };

    const winFill = !spinning && result === "win" ? "#00ff88"
        : !spinning && result === "lose" ? "#1a3a2a"
            : "#00d9ff";

    const loseFill = !spinning && result === "lose" ? "#ff3355"
        : !spinning && result === "win" ? "#0a1a10"
            : "rgba(255,255,255,0.06)";

    return (
        <svg width="240" height="240" viewBox="0 0 240 240" style={{ overflow: "visible" }}>
            <defs>
                <filter id="wglow">
                    <feGaussianBlur stdDeviation="6" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="nglow">
                    <feGaussianBlur stdDeviation="3" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>

            <path d={sector(0, winDeg)} fill={winFill} opacity="0.92"
                  style={{ transition: "fill 0.4s" }} filter={result === "win" ? "url(#wglow)" : undefined}/>

            <path d={sector(winDeg, 360)} fill={loseFill} opacity="0.85"
                  style={{ transition: "fill 0.4s" }}/>

            <line x1={CX} y1={CY}
                  x2={CX + R * Math.cos(toRad(winDeg))}
                  y2={CY + R * Math.sin(toRad(winDeg))}
                  stroke="#080a19" strokeWidth="2"/>

            <circle cx={CX} cy={CY} r={R} fill="none"
                    stroke={result === "win" ? "#00ff88" : result === "lose" ? "#ff3355" : "rgba(0,217,255,0.35)"}
                    strokeWidth="2.5"
                    style={{ transition: "stroke 0.4s" }}/>

            {Array.from({ length: 60 }).map((_, i) => {
                const a = (i * 6 - 90) * Math.PI / 180;
                const r1 = R - 1, r2 = i % 5 === 0 ? R - 9 : R - 5;
                return (
                    <line key={i}
                          x1={CX + r1 * Math.cos(a)} y1={CY + r1 * Math.sin(a)}
                          x2={CX + r2 * Math.cos(a)} y2={CY + r2 * Math.sin(a)}
                          stroke="rgba(0,0,0,0.5)" strokeWidth={i % 5 === 0 ? 1.5 : 0.8}/>
                );
            })}

            <circle cx={CX} cy={CY} r="58" fill="#080a19"/>
            <circle cx={CX} cy={CY} r="54" fill="#0c1226"/>

            <text x={CX} y={CY - 8} textAnchor="middle"
                  fill={result === "win" ? "#00ff88" : result === "lose" ? "#ff3355" : "#00d9ff"}
                  fontSize="22" fontWeight="900" fontFamily="Rajdhani,sans-serif"
                  style={{ transition: "fill 0.4s" }}>
                {chance.toFixed(1)}%
            </text>
            <text x={CX} y={CY + 12} textAnchor="middle"
                  fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="Rajdhani,sans-serif">
                ШАНС
            </text>

            {spinning && (
                <circle cx={CX} cy={CY} r={R + 6} fill="none"
                        stroke="#00d9ff" strokeWidth="1.5" opacity="0.4"
                        strokeDasharray="10 8">
                    <animateTransform attributeName="transform" type="rotate"
                                      from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`}
                                      dur="1.5s" repeatCount="indefinite"/>
                </circle>
            )}

            <g transform={`rotate(${needleDeg}, ${CX}, ${CY})`} filter="url(#nglow)">
                <polygon points={`${CX},${CY - R + 10} ${CX - 7},${CY - R + -10} ${CX + 7},${CY - R + -10}`}
                         fill="#ffe600"/>
            </g>
        </svg>
    );
};