import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import cn from "classnames";
import api from "../../api/api";
import styles from "./upgrade.component.module.scss";

const safe = (v: any): number => {
    const n = parseFloat(String(v ?? 0));
    return isNaN(n) ? 0 : n;
};

const PAGE_SIZE    = 20;
const SPIN_TURNS   = 6;
const SPIN_MS      = 4000;
const EASING = (t: number) => 1 - Math.pow(1 - t, 4); // aggressive deceleration

// ─── Wheel ───────────────────────────────────────────────────────────────────
const Wheel = ({
                   chance,
                   needleDeg,
                   spinning,
                   result,
               }: {
    chance: number;
    needleDeg: number;
    spinning: boolean;
    result: "win" | "lose" | null;
}) => {
    const R = 100, CX = 120, CY = 120;
    const winDeg = Math.max(0.01, Math.min(359.99, (chance / 100) * 360));

    const toRad = (d: number) => (d - 90) * (Math.PI / 180);

    const sector = (start: number, end: number) => {
        const s = toRad(start), e = toRad(end);
        const x1 = CX + R * Math.cos(s), y1 = CY + R * Math.sin(s);
        const x2 = CX + R * Math.cos(e), y2 = CY + R * Math.sin(e);
        const large = end - start > 180 ? 1 : 0;
        return `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`;
    };

    // Цвета
    // Цвета меняются ТОЛЬКО после остановки (не во время спина)
    const winFill  = (!spinning && result === "win")  ? "#00ff88"
        : (!spinning && result === "lose") ? "#1a3a2a"
            : "#00d9ff";
    const loseFill = (!spinning && result === "lose") ? "#ff3355"
        : (!spinning && result === "win")  ? "#0a1a10"
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

            {/* Win sector */}
            <path d={sector(0, winDeg)} fill={winFill} opacity="0.92"
                  style={{ transition: "fill 0.4s" }} filter={result === "win" ? "url(#wglow)" : undefined}/>

            {/* Lose sector */}
            <path d={sector(winDeg, 360)} fill={loseFill} opacity="0.85"
                  style={{ transition: "fill 0.4s" }}/>

            {/* Divider line */}
            <line
                x1={CX} y1={CY}
                x2={CX + R * Math.cos(toRad(winDeg))}
                y2={CY + R * Math.sin(toRad(winDeg))}
                stroke="#080a19" strokeWidth="2"/>

            {/* Outer ring */}
            <circle cx={CX} cy={CY} r={R} fill="none"
                    stroke={result === "win" ? "#00ff88" : result === "lose" ? "#ff3355" : "rgba(0,217,255,0.35)"}
                    strokeWidth="2.5"
                    style={{ transition: "stroke 0.4s" }}/>

            {/* Tick marks */}
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

            {/* Inner circle */}
            <circle cx={CX} cy={CY} r="58" fill="#080a19"/>
            <circle cx={CX} cy={CY} r="54" fill="#0c1226"/>

            {/* Center text */}
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

            {/* Spinning ring */}
            {spinning && (
                <circle cx={CX} cy={CY} r={R + 6} fill="none"
                        stroke="#00d9ff" strokeWidth="1.5" opacity="0.4"
                        strokeDasharray="10 8">
                    <animateTransform attributeName="transform" type="rotate"
                                      from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`}
                                      dur="1.5s" repeatCount="indefinite"/>
                </circle>
            )}

            {/* Needle */}
            <g transform={`rotate(${needleDeg}, ${CX}, ${CY})`} filter="url(#nglow)">
                <polygon
                    points={`${CX},${CY - R + 10} ${CX - 7},${CY - R + -10} ${CX + 7},${CY - R + -10}`}
                    fill="#ffe600"/>
            </g>
        </svg>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export const UpgradeComponent = () => {
    const [user,           setUser]           = useState<any>(null);
    const [inventory,      setInventory]      = useState<any[]>([]);
    const [targetItems,    setTargetItems]    = useState<any[]>([]);
    const [selectedItem,   setSelectedItem]   = useState<any>(null);
    const [selectedTarget, setSelectedTarget] = useState<any>(null);
    const [balanceAdd,     setBalanceAdd]     = useState(0);
    const [loading,        setLoading]        = useState(true);
    const [page,           setPage]           = useState(0);
    const [priceFrom,      setPriceFrom]      = useState("");
    const [priceTo,        setPriceTo]        = useState("");

    const [spinning,    setSpinning]    = useState(false);
    const [needleDeg,   setNeedleDeg]   = useState(0);
    const [spinResult,  setSpinResult]  = useState<"win"|"lose"|null>(null);
    const rafRef       = useRef<number>(0);
    const fromDeg      = useRef(0);
    const frozenChance = useRef(0); // зафиксированный шанс во время спина

    const isAuth = !!localStorage.getItem("access");

    // ── fetch ────────────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        if (!isAuth) { setLoading(false); return; }
        setLoading(true);
        try {
            const [uRes, iRes] = await Promise.all([
                api.get("/me/"),
                api.get("/upgrade/inventory/"),
            ]);
            setUser(uRes.data);
            setInventory(iRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [isAuth]);

    const fetchTargets = useCallback(async (itemId?: number) => {
        try {
            const res = await api.get("/upgrade/target-items/",
                itemId ? { params: { selected_item_id: itemId } } : {});
            setTargetItems(res.data);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchAll(); fetchTargets(); }, [fetchAll, fetchTargets]);

    // ── derived ──────────────────────────────────────────────────────────────
    const itemPrice   = selectedItem   ? safe(selectedItem.price)   : 0;
    const targetPrice = selectedTarget ? safe(selectedTarget.price) : 0;

    // ✅ Шанс = стоимость предмета / стоимость цели * 100 (максимум 75%)
    const chance = useMemo(() => {
        if (!selectedItem || !selectedTarget || targetPrice <= 0) return 0;
        const raw = (itemPrice / targetPrice) * 100;
        return Math.min(75, Math.max(0.01, parseFloat(raw.toFixed(2))));
    }, [itemPrice, targetPrice]);

    const maxBalance = selectedTarget
        ? Math.max(0, targetPrice - itemPrice)
        : 0;

    const filtered = useMemo(() =>
            targetItems.filter(t => {
                const p = safe(t.price);
                if (priceFrom && p < parseFloat(priceFrom)) return false;
                if (priceTo   && p > parseFloat(priceTo))   return false;
                if (selectedItem && p <= itemPrice)          return false;
                return true;
            })
        , [targetItems, priceFrom, priceTo, itemPrice, selectedItem]);

    const totalPages   = Math.ceil(filtered.length / PAGE_SIZE);
    const pagedTargets = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    // ── needle animation ──────────────────────────────────────────────────────
    const animateNeedle = (targetAngle: number, onDone: () => void) => {
        const start = fromDeg.current % 360;
        const total = SPIN_TURNS * 360 + targetAngle;
        const t0    = performance.now();

        const tick = (now: number) => {
            const t      = Math.min((now - t0) / SPIN_MS, 1);
            const eased  = EASING(t);
            const deg    = start + eased * (total - start);
            setNeedleDeg(deg % 360);
            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                fromDeg.current = targetAngle;
                setNeedleDeg(targetAngle);
                onDone();
            }
        };
        rafRef.current = requestAnimationFrame(tick);
    };

    // ── upgrade ───────────────────────────────────────────────────────────────
    const handleUpgrade = async () => {
        if (!selectedItem || !selectedTarget || spinning || chance <= 0) return;

        frozenChance.current = chance;
        setSpinning(true);
        setSpinResult(null);

        try {
            const { data } = await api.post("/upgrade/perform/", {
                item_id:        selectedItem.id,
                target_item_id: selectedTarget.id,
                balance_amount: balanceAdd,
            });

            const isWin  = data.success;
            const winDeg = (frozenChance.current / 100) * 360;
            let stopAngle: number;

            if (isWin) {
                const margin = Math.min(8, winDeg * 0.12);
                stopAngle = margin + Math.random() * (winDeg - margin * 2);
            } else {
                const margin = Math.min(8, (360 - winDeg) * 0.1);
                stopAngle = winDeg + margin + Math.random() * (360 - winDeg - margin * 2);
            }

            // Обновляем баланс сразу — это нормально
            if (data.new_balance) {
                setUser((u: any) => u ? { ...u, balance: data.new_balance } : u);
                window.dispatchEvent(new CustomEvent("balance:update", { detail: data.new_balance }));
            }

            animateNeedle(stopAngle, async () => {
                setSpinResult(isWin ? "win" : "lose");

                setTimeout(async () => {
                    setSpinning(false);
                    await fetchAll();          // ← переехало сюда
                    setSelectedItem(null);     // ← переехало сюда
                    setSelectedTarget(null);   // ← переехало сюда
                    setBalanceAdd(0);          // ← переехало сюда
                    fetchTargets();            // ← переехало сюда
                }, 700);
            });

        } catch (e: any) {
            setSpinning(false);
            alert(e.response?.data?.error || "Ошибка при апгрейде");
        }
    };

    const closeResult = () => {
        setSpinResult(null);
        setNeedleDeg(0);
        fromDeg.current = 0;
    };

    useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

    const selectItem = (item: any) => {
        if (spinning) return;
        if (selectedItem?.id === item.id) {
            setSelectedItem(null);
            setSelectedTarget(null);
            setBalanceAdd(0);
            fetchTargets();
        } else {
            setSelectedItem(item);
            setSelectedTarget(null);
            setBalanceAdd(0);
            fetchTargets(item.id);
        }
    };

    return (
        <div className={styles.page}>

            <div className={styles.arena}>

                <div className={cn(styles.slot, spinResult === "win" && styles.slot_win, spinResult === "lose" && styles.slot_lose)}>
                    <div className={styles.slot__label}>Ваш предмет</div>
                    {selectedItem ? (
                        <div className={styles.slot__content}>
                            <img src={selectedItem.image_url} alt={selectedItem.weapon_name} className={styles.slot__img}/>
                            <p className={styles.slot__name}>{selectedItem.weapon_name}</p>
                            <p className={styles.slot__skin}>{selectedItem.skin_name}</p>
                            <p className={styles.slot__price}>{safe(selectedItem.price).toFixed(2)} ₽</p>
                            {!spinning && (
                                <button className={styles.slot__remove} onClick={() => { setSelectedItem(null); setSelectedTarget(null); setBalanceAdd(0); fetchTargets(); }}>✕</button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.slot__empty}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                                <rect x="2" y="7" width="20" height="14" rx="2"/>
                                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                            </svg>
                            <span>Выберите предмет снизу</span>
                        </div>
                    )}
                </div>

                <div className={styles.wheel_wrap}>
                    <Wheel
                        chance={spinning ? frozenChance.current : chance}
                        needleDeg={needleDeg}
                        spinning={spinning}
                        result={spinResult}/>
                    <div className={cn(styles.chance_badge,
                        spinResult === "win"  && styles.chance_badge_win,
                        spinResult === "lose" && styles.chance_badge_lose)}>
                        {spinResult === "win"  ? "Ура победа!"
                            : spinResult === "lose" ? "Неудача!"
                                : spinning
                                    ? `${frozenChance.current.toFixed(2)}% шанс`
                                    : selectedItem && selectedTarget
                                        ? `${chance.toFixed(2)}% шанс`
                                        : "Выберите предметы"}
                    </div>

                    <button
                        className={cn(styles.upgrade_btn, spinning && styles.upgrade_btn_spin)}
                        onClick={handleUpgrade}
                        disabled={spinning || !selectedItem || !selectedTarget || chance <= 0}
                    >
                        {spinning ? "КРУТИТСЯ..." : "▲ АПГРЕЙД"}
                    </button>
                </div>

                <div className={cn(styles.slot, spinResult === "win" && styles.slot_win, spinResult === "lose" && styles.slot_lose)}>
                    <div className={styles.slot__label}>Цель апгрейда</div>
                    {selectedTarget ? (
                        <div className={styles.slot__content}>
                            <img src={selectedTarget.image_url} alt={selectedTarget.weapon_name} className={styles.slot__img}/>
                            <p className={styles.slot__name}>{selectedTarget.weapon_name}</p>
                            <p className={styles.slot__skin}>{selectedTarget.skin_name}</p>
                            <p className={styles.slot__price}>{safe(selectedTarget.price).toFixed(2)} ₽</p>
                            {!spinning && (
                                <button className={styles.slot__remove} onClick={() => setSelectedTarget(null)}>✕</button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.slot__empty}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span>Выберите цель справа</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bottom panels ─────────────────────────────────────────── */}
            <div className={styles.bottom}>

                {/* Inventory */}
                <div className={styles.panel}>
                    <div className={styles.panel__header}>
                        <span className={styles.panel__title}>Мой инвентарь</span>
                        <span className={styles.panel__count}>{inventory.length}</span>
                    </div>
                    <div className={styles.inv_grid}>
                        {loading ? (
                            <div className={styles.empty_state}>Загрузка...</div>
                        ) : inventory.length === 0 ? (
                            <div className={styles.empty_state}>Инвентарь пуст</div>
                        ) : inventory.map((item: any) => (
                            <div
                                key={item.id}
                                className={cn(
                                    styles.inv_card,
                                    styles[`rarity_${item.rarity}`],
                                    selectedItem?.id === item.id && styles.inv_card_selected
                                )}
                                onClick={() => selectItem(item)}
                            >
                                <span className={styles.inv_card__price}>{safe(item.price).toFixed(2)} ₽</span>
                                <img src={item.image_url} alt={item.weapon_name} className={styles.inv_card__img}
                                     onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}/>
                                <p className={styles.inv_card__name}>{item.weapon_name}</p>
                                <p className={styles.inv_card__skin}>{item.skin_name}</p>
                                {selectedItem?.id === item.id && <div className={styles.inv_card__check}>✓</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Targets */}
                <div className={styles.panel}>
                    <div className={styles.panel__header}>
                        <span className={styles.panel__title}>Целевые предметы</span>
                        <div className={styles.panel__filters}>
                            <input type="number" placeholder="от ₽"
                                   value={priceFrom}
                                   onChange={e => { setPriceFrom(e.target.value); setPage(0); }}
                                   className={styles.filter_input}/>
                            <input type="number" placeholder="до ₽"
                                   value={priceTo}
                                   onChange={e => { setPriceTo(e.target.value); setPage(0); }}
                                   className={styles.filter_input}/>
                        </div>
                    </div>

                    <div className={styles.target_grid}>
                        {loading ? (
                            <div className={styles.empty_state}>Загрузка...</div>
                        ) : pagedTargets.length === 0 ? (
                            <div className={styles.empty_state}>
                                {selectedItem ? "Нет подходящих предметов" : "Сначала выберите предмет слева"}
                            </div>
                        ) : pagedTargets.map((item: any) => {
                            const itemChance = selectedItem && safe(item.price) > 0
                                ? Math.min(75, (itemPrice / safe(item.price)) * 100)
                                : 0;
                            const isSelected = selectedTarget?.id === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        styles.target_card,
                                        styles[`rarity_${item.rarity}`],
                                        isSelected && styles.target_card_selected
                                    )}
                                    onClick={() => !spinning && setSelectedTarget(item)}
                                >
                                    <span className={styles.target_card__price}>{safe(item.price).toFixed(2)} ₽</span>
                                    <img src={item.image_url} alt={item.weapon_name} className={styles.target_card__img}
                                         onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}/>
                                    <p className={styles.target_card__name}>{item.weapon_name}</p>
                                    <p className={styles.target_card__skin}>{item.skin_name}</p>
                                    {selectedItem && (
                                        <div className={cn(styles.target_card__chance,
                                            itemChance >= 50 && styles.chance_good,
                                            itemChance >= 25 && itemChance < 50 && styles.chance_mid,
                                            itemChance < 25 && styles.chance_low)}>
                                            {itemChance.toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button className={styles.page_btn} onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}>‹</button>
                            <span className={styles.page_info}>{page+1} / {totalPages}</span>
                            <button className={styles.page_btn} onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1}>›</button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default UpgradeComponent;