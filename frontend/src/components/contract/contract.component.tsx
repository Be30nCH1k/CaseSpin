import { useEffect, useState, useCallback } from "react";
import cn from "classnames";
import api from "../../api/api";
import styles from "./contract.component.module.scss";

const safe = (v: any): number => {
    const n = parseFloat(String(v ?? 0));
    return isNaN(n) ? 0 : n;
};

const MIN_ITEMS = 3;
const MAX_ITEMS = 10;
const SLOTS     = 10;

const rollRewardPrice = (totalPrice: number): number => {
    const minVal = Math.max(100, totalPrice * 0.2);
    const maxVal = totalPrice * 5;
    const t      = Math.pow(Math.random(), 1.8);
    const price  = minVal + t * (maxVal - minVal);
    return Math.round(price / 10) * 10;
};

type InvItem = {
    id:                number;
    weapon_name:       string;
    skin_name:         string;
    image_url:         string;
    price:             string | number;
    rarity:            string;
    inventory_item_id: number | null;
};

type ContractResult = {
    success:      boolean;
    item?:        InvItem;
    new_balance?: string;
};

export const ContractComponent = () => {
    const [inventory,  setInventory]  = useState<InvItem[]>([]);
    const [selected,   setSelected]   = useState<InvItem[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [rolling,    setRolling]    = useState(false);
    const [result,     setResult]     = useState<ContractResult | null>(null);
    const [showResult, setShowResult] = useState(false);

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get<InvItem[]>("/upgrade/inventory/");
            setInventory(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    const toggleSelect = (item: InvItem) => {
        if (rolling) return;
        setSelected(prev => {
            const already = prev.find(i => i.id === item.id);
            if (already) return prev.filter(i => i.id !== item.id);
            if (prev.length >= MAX_ITEMS) return prev;
            return [...prev, item];
        });
    };

    const isSelected  = (item: InvItem) => selected.some(i => i.id === item.id);
    const totalPrice  = selected.reduce((s, i) => s + safe(i.price), 0);
    const canRoll     = selected.length >= MIN_ITEMS && !rolling;

    // Диапазон выигрыша
    const minPossible = totalPrice > 0 ? Math.max(100, totalPrice * 0.2) : 0;
    const maxPossible = totalPrice > 0 ? totalPrice * 5 : 0;

    const handleContract = async () => {
        if (!canRoll) return;
        setRolling(true);
        setResult(null);
        setShowResult(false);

        // Запоминаем выбранные до сброса
        const selectedSnapshot = [...selected];

        try {
            const rewardPrice = rollRewardPrice(totalPrice);

            const { data } = await api.post("/contract/perform/", {
                item_ids:     selectedSnapshot.map(i => i.id),
                reward_price: rewardPrice,
            });

            // Анимация ожидания
            await new Promise(res => setTimeout(res, 2200));

            setResult({ success: true, item: data.item, new_balance: data.new_balance });
            setShowResult(true);

            if (data.new_balance) {
                window.dispatchEvent(new CustomEvent("balance:update", { detail: data.new_balance }));
            }

            // ✅ Убираем использованные и добавляем полученный предмет
            const usedIds = new Set(selectedSnapshot.map(i => i.id));
            setInventory(prev => {
                const withoutUsed = prev.filter(i => !usedIds.has(i.id));
                // Добавляем новый предмет в начало списка
                if (data.item) {
                    const newItem: InvItem = {
                        id:                data.item.id,
                        weapon_name:       data.item.weapon_name,
                        skin_name:         data.item.skin_name,
                        image_url:         data.item.image_url,
                        price:             data.item.price,
                        rarity:            data.item.rarity,
                        inventory_item_id: data.item.id,
                    };
                    return [newItem, ...withoutUsed];
                }
                return withoutUsed;
            });
            setSelected([]);

        } catch (e: any) {
            console.error(e);
            alert(e.response?.data?.error || "Ошибка контракта");
        } finally {
            setRolling(false);
        }
    };

    const closeResult = () => setShowResult(false);

    const slots = Array.from({ length: SLOTS }, (_, i) => selected[i] ?? null);

    return (
        <div className={styles.page}>

            {/* ── Верхний блок — слоты ─────────────────────────────────── */}
            <div className={styles.arena}>
                <div className={styles.arena__header}>
                    <span className={styles.arena__title}>КОНТРАКТ</span>
                    <span className={styles.arena__sub}>
                        Выбрано: <b>{selected.length}</b> / {MAX_ITEMS}
                        &nbsp;·&nbsp;
                        Ставка: <b>{totalPrice.toFixed(0)} ₽</b>
                    </span>
                </div>

                {/* Диапазон выигрыша */}
                {selected.length >= MIN_ITEMS && (
                    <div className={styles.range_bar}>
                        <div className={styles.range_bar__item}>
                            <span className={styles.range_bar__label}>Минимум</span>
                            <span className={cn(styles.range_bar__value, styles.range_bar__value_min)}>
                                {minPossible.toFixed(0)} ₽
                            </span>
                        </div>
                        <div className={styles.range_bar__divider}>
                            <svg width="120" height="12" viewBox="0 0 120 12">
                                <line x1="0" y1="6" x2="110" y2="6"
                                      stroke="rgba(0,217,255,0.25)" strokeWidth="1"
                                      strokeDasharray="4 3"/>
                                <polygon points="110,2 120,6 110,10" fill="rgba(0,217,255,0.4)"/>
                            </svg>
                        </div>
                        <div className={styles.range_bar__item}>
                            <span className={styles.range_bar__label}>Максимум</span>
                            <span className={styles.range_bar__value}>
                                до <b>{maxPossible.toFixed(0)} ₽</b>
                            </span>
                        </div>
                    </div>
                )}

                <div className={styles.slots}>
                    {slots.map((item, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                styles.slot,
                                item && styles.slot_filled,
                                rolling && styles.slot_rolling,
                            )}
                            onClick={() => item && toggleSelect(item)}
                        >
                            {item ? (
                                <>
                                    <img
                                        src={item.image_url}
                                        alt={item.weapon_name}
                                        className={styles.slot__img}
                                        onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                                    />
                                    <span className={styles.slot__price}>{safe(item.price).toFixed(0)} ₽</span>
                                    <button
                                        className={styles.slot__remove}
                                        onClick={e => { e.stopPropagation(); toggleSelect(item); }}
                                    >✕</button>
                                </>
                            ) : (
                                <div className={styles.slot__empty}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="1.2" opacity="0.25">
                                        <rect x="2" y="7" width="20" height="14" rx="2"/>
                                        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    className={cn(styles.roll_btn, rolling && styles.roll_btn_spin)}
                    onClick={handleContract}
                    disabled={!canRoll}
                >
                    {rolling ? (
                        <span className={styles.roll_btn__spinner}/>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="2.5">
                                <polyline points="17 1 21 5 17 9"/>
                                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                                <polyline points="7 23 3 19 7 15"/>
                                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                            </svg>
                            ЗАКЛЮЧИТЬ КОНТРАКТ
                        </>
                    )}
                </button>

                {selected.length < MIN_ITEMS && (
                    <p className={styles.hint}>Выберите минимум {MIN_ITEMS} предмета снизу</p>
                )}
            </div>

            {/* ── Нижний блок — инвентарь ──────────────────────────────── */}
            <div className={styles.inventory}>
                <div className={styles.inventory__header}>
                    <span className={styles.inventory__title}>МОЙ ИНВЕНТАРЬ</span>
                    <span className={styles.inventory__count}>{inventory.length}</span>
                </div>

                {loading ? (
                    <div className={styles.loader}>Загрузка...</div>
                ) : inventory.length === 0 ? (
                    <div className={styles.empty}>Инвентарь пуст</div>
                ) : (
                    <div className={styles.inv_grid}>
                        {inventory.map(item => {
                            const sel   = isSelected(item);
                            const maxed = selected.length >= MAX_ITEMS && !sel;
                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        styles.inv_card,
                                        styles[`rarity_${item.rarity}`],
                                        sel   && styles.inv_card_selected,
                                        maxed && styles.inv_card_maxed,
                                    )}
                                    onClick={() => !maxed && toggleSelect(item)}
                                >
                                    <span className={styles.inv_card__price}>
                                        {safe(item.price).toFixed(0)} ₽
                                    </span>
                                    <img
                                        src={item.image_url}
                                        alt={item.weapon_name}
                                        className={styles.inv_card__img}
                                        onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                                    />
                                    <p className={styles.inv_card__name}>{item.weapon_name}</p>
                                    <p className={styles.inv_card__skin}>{item.skin_name}</p>
                                    {sel && <div className={styles.inv_card__check}>✓</div>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Результат ────────────────────────────────────────────── */}
            {showResult && result?.item && (
                <div className={styles.result_overlay} onClick={closeResult}>
                    <div className={styles.result_modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.result_modal__glow}/>
                        <p className={styles.result_modal__label}>ВЫ ПОЛУЧИЛИ</p>
                        <img
                            src={result.item.image_url}
                            alt={result.item.weapon_name}
                            className={styles.result_modal__img}
                        />
                        <p className={styles.result_modal__name}>{result.item.weapon_name}</p>
                        <p className={styles.result_modal__skin}>{result.item.skin_name}</p>
                        <p className={styles.result_modal__price}>
                            {safe(result.item.price).toFixed(0)} ₽
                        </p>
                        <button className={styles.result_modal__close} onClick={closeResult}>
                            Забрать
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractComponent;