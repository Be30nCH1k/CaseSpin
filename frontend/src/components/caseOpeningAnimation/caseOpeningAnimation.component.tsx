import { useState } from 'react';
import cn from 'classnames';
import styles from './caseOpeningAnimation.component.module.scss';
import api from '../../api/api';

const H_ITEM_W   = 190;
const H_ITEM_GAP = 6;
const H_VIEWPORT = 1100;
const H_TOTAL    = 52;
const H_WIN_IDX  = 40;

const V_ITEM_H   = 130;
const V_ITEM_GAP = 6;
const V_VIEWPORT = 350;
const V_TOTAL    = 52;
const V_WIN_IDX  = 40;

const DURS_NORMAL = [5.2, 5.55, 5.9, 6.25, 6.6, 5.35, 5.7, 6.05, 6.4, 6.75];
const DURS_FAST   = [1.5, 1.65, 1.8, 1.95, 2.1, 1.55, 1.7, 1.85, 2.0, 2.15];

const SLOT_EASINGS = [
    'cubic-bezier(0.12, 0.0, 0.06, 1.0)',
    'cubic-bezier(0.14, 0.0, 0.05, 1.0)',
    'cubic-bezier(0.10, 0.0, 0.08, 1.0)',
    'cubic-bezier(0.13, 0.0, 0.04, 1.0)',
    'cubic-bezier(0.11, 0.0, 0.07, 1.0)',
    'cubic-bezier(0.15, 0.0, 0.06, 1.0)',
    'cubic-bezier(0.09, 0.0, 0.09, 1.0)',
    'cubic-bezier(0.12, 0.0, 0.05, 1.0)',
    'cubic-bezier(0.14, 0.0, 0.07, 1.0)',
    'cubic-bezier(0.10, 0.0, 0.06, 1.0)',
];

const jitter = (i: number) => Math.round(Math.sin(i * 2.4) * 14);

const safePrice = (price: any): number => {
    const n = parseFloat(String(price ?? 0));
    return isNaN(n) ? 0 : n;
};

type SlotData = {
    items:     any[];
    winIdx:    number;
    translate: number;
    duration:  number;
    easing:    string;
};

type WonItem = {
    price:        number | string;
    image_url:    string;
    weapon_name:  string;
    skin_name:    string;
    inventoryId?: number;
};

type Props = {
    caseId:        number;
    casePrice:     number;
    isOpening:     boolean;
    setIsOpening:  React.Dispatch<React.SetStateAction<boolean>>;
    showResult:    boolean;
    setShowResult: React.Dispatch<React.SetStateAction<boolean>>;
};

const CaseOpening = ({ caseId, casePrice, isOpening, setIsOpening, showResult, setShowResult }: Props) => {
    const [slots,        setSlots]        = useState<SlotData[]>([]);
    const [animating,    setAnimating]    = useState(false);
    const [doneFlags,    setDoneFlags]    = useState<boolean[]>([]);
    const [multiplier,   setMultiplier]   = useState(1);
    const [fastMode,     setFastMode]     = useState(false);
    const [wonItems,     setWonItems]     = useState<WonItem[]>([]);
    const [soldIds,      setSoldIds]      = useState<Set<number>>(new Set()); // индексы (0,1,2...)
    const [sellingOne,   setSellingOne]   = useState<number | null>(null);    // продаётся одиночно
    const [sellingAll,   setSellingAll]   = useState(false);

    const isVertical = multiplier >= 5;
    const openCost   = (safePrice(casePrice) * multiplier).toFixed(2);

    // ── Открытие ────────────────────────────────────────────────────────
    const handleOpen = async () => {
        if (isOpening) return;
        try {
            setIsOpening(true);
            setWonItems([]);
            setSoldIds(new Set());
            setSellingOne(null);
            setSellingAll(false);
            setShowResult(false);
            setSlots([]);
            setAnimating(false);
            setDoneFlags([]);

            const dropped: WonItem[] = [];
            for (let i = 0; i < multiplier; i++) {
                const r = await api.post(`cases/${caseId}/spin/`);
                dropped.push({ ...r.data.won_item, inventoryId: r.data.inventory_id });

                if (r.data.new_balance !== undefined) {
                    window.dispatchEvent(new CustomEvent('balance:update', { detail: String(r.data.new_balance) }));
                }
            }

            const caseR = await api.get(`cases/${caseId}/`);
            const pool: any[] = caseR.data.items.map((el: any) => ({ ...el.item }));
            const durations = fastMode ? DURS_FAST : DURS_NORMAL;

            const built: SlotData[] = dropped.map((winner, idx) => {
                const total  = isVertical ? V_TOTAL : H_TOTAL;
                const winIdx = isVertical ? V_WIN_IDX : H_WIN_IDX;
                const items  = Array.from({ length: total }, () => ({ ...pool[Math.floor(Math.random() * pool.length)] }));
                items[winIdx] = { ...winner };

                const translate = isVertical
                    ? winIdx * (V_ITEM_H + V_ITEM_GAP) - V_VIEWPORT / 2 + V_ITEM_H / 2 + jitter(idx)
                    : winIdx * (H_ITEM_W + H_ITEM_GAP) - H_VIEWPORT / 2 + H_ITEM_W / 2 + jitter(idx);

                return { items, winIdx, translate, duration: durations[idx % durations.length], easing: SLOT_EASINGS[idx % SLOT_EASINGS.length] };
            });

            setSlots(built);
            setDoneFlags(new Array(multiplier).fill(false));
            requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
            built.forEach((s, idx) => {
                setTimeout(() => setDoneFlags(prev => { const n = [...prev]; n[idx] = true; return n; }), s.duration * 1000 + 80);
            });

            const maxMs = Math.max(...built.map(s => s.duration * 1000)) + 500;
            setTimeout(() => { setWonItems(dropped); setShowResult(true); setIsOpening(false); }, maxMs);

        } catch (e: any) {
            console.error(e);
            setIsOpening(false);
        }
    };

    // ── Продать один ────────────────────────────────────────────────────
    const handleSellOne = async (item: WonItem, index: number) => {
        if (!item.inventoryId || soldIds.has(index) || sellingOne !== null || sellingAll) return;
        setSellingOne(index);
        try {
            const r = await api.post(`inventory/${item.inventoryId}/sell/`);
            setSoldIds(prev => new Set(prev).add(index));
            if (r.data.new_balance !== undefined) {
                window.dispatchEvent(new CustomEvent('balance:update', { detail: String(r.data.new_balance) }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSellingOne(null);
        }
    };

    // ── Продать все — ОДИН запрос на бэкенд ─────────────────────────────
    const handleSellAll = async () => {
        if (sellingAll || sellingOne !== null) return;

        // Собираем id всех непроданных предметов
        const unsoldItems = wonItems
            .map((item, i) => ({ item, i }))
            .filter(({ i }) => !soldIds.has(i));

        if (unsoldItems.length === 0) return;

        const ids = unsoldItems
            .map(({ item }) => item.inventoryId)
            .filter(Boolean) as number[];

        if (ids.length === 0) return;

        setSellingAll(true);
        try {
            // ✅ Один запрос — бэкенд продаёт все атомарно
            const r = await api.post('inventory/sell_many/', { ids });

            // Помечаем все как проданные сразу
            setSoldIds(new Set(wonItems.map((_, i) => i)));

            if (r.data.new_balance !== undefined) {
                window.dispatchEvent(new CustomEvent('balance:update', { detail: String(r.data.new_balance) }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSellingAll(false);
        }
    };

    const handleRepeat = () => {
        setWonItems([]); setSoldIds(new Set()); setSellingOne(null); setSellingAll(false);
        setShowResult(false); setSlots([]); setAnimating(false); setDoneFlags([]); setIsOpening(false);
    };

    const layoutClass =
        multiplier === 10 ? styles.ten_items
            : multiplier === 5 ? styles.five_items
                : multiplier === 2 ? styles.two_items
                    : styles.one_item;

    const unsoldTotal = wonItems
        .filter((_, i) => !soldIds.has(i))
        .reduce<number>((s, item) => s + safePrice(item.price), 0);

    const allSold = wonItems.length > 0 && soldIds.size === wonItems.length;

    return (
        <div className={styles.case_open}>

            {!isOpening && !showResult && (
                <>
                    <div className={styles.fast_controls}>
                        <button className={cn(styles.auto_btn, fastMode && styles.active)} onClick={() => setFastMode(f => !f)}>▶▶</button>
                        <div className={styles.multi_controls}>
                            {[1, 2, 5, 10].map(m => (
                                <button key={m} className={cn(styles.multi_btn, multiplier === m && styles.active)} onClick={() => setMultiplier(m)}>x{m}</button>
                            ))}
                        </div>
                    </div>
                    <button className={styles.open_button} onClick={handleOpen}>
                        Открыть кейс за <span className={styles.open_price}>{openCost} ₽</span>
                    </button>
                </>
            )}

            {isOpening && slots.length > 0 && (
                isVertical
                    ? <VerticalSlots slots={slots} animating={animating} doneFlags={doneFlags} count={multiplier} />
                    : <HorizontalRoulette slots={slots} animating={animating} doneFlags={doneFlags} />
            )}

            {showResult && wonItems.length > 0 && (
                <div className={styles.result_wrap}>
                    <h2 className={styles.result_title}>Вы выиграли</h2>

                    <div className={cn(styles.drop_grid, layoutClass)}>
                        {wonItems.map((item, i) => (
                            <div
                                key={i}
                                className={cn(styles.drop_card, soldIds.has(i) && styles.card_sold, sellingAll && !soldIds.has(i) && styles.card_selling)}
                                style={{ animationDelay: `${i * 0.04}s` }}
                            >
                                <div className={styles.hex_bg} />
                                <img src={item.image_url} alt={item.weapon_name} className={styles.card_img} />
                                <span className={styles.card_weapon}>{item.weapon_name}</span>
                                <span className={styles.card_skin}>{item.skin_name}</span>

                                {soldIds.has(i) ? (
                                    <div className={styles.sold_badge}>✓ Продано</div>
                                ) : (
                                    <div className={styles.card_actions}>
                                        <button
                                            className={styles.price_btn}
                                            onClick={() => handleSellOne(item, i)}
                                            disabled={sellingOne === i || sellingAll}
                                        >
                                            {sellingOne === i ? '...' : `${safePrice(item.price).toFixed(2)} ₽`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className={styles.bottom_actions}>
                        <button className={styles.action_btn} onClick={handleRepeat} disabled={sellingAll}>Повторить</button>
                        <button
                            className={cn(styles.sell_btn, allSold && styles.sell_btn_done)}
                            onClick={handleSellAll}
                            disabled={allSold || sellingAll || sellingOne !== null}
                        >
                            {sellingAll ? 'Продаём...' : allSold ? 'Всё продано' : `Продать все за ${unsoldTotal.toFixed(2)} ₽`}
                        </button>
                        <button className={styles.action_btn} disabled={sellingAll}>В контракт</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const HorizontalRoulette = ({ slots, animating, doneFlags }: { slots: SlotData[]; animating: boolean; doneFlags: boolean[] }) => (
    <div className={styles.h_wrapper}>
        {slots.map((slot, idx) => (
            <div key={idx} className={styles.h_container}>
                <div className={styles.h_pointer} />
                <div className={styles.h_fade_l} />
                <div className={styles.h_fade_r} />
                <div className={styles.h_viewport}>
                    <div className={styles.h_track} style={{ transform: `translateX(-${animating ? slot.translate : 0}px)`, transition: animating ? `transform ${slot.duration}s ${slot.easing}` : 'none' }}>
                        {slot.items.map((item, i) => (
                            <div key={i} className={cn(styles.h_item, doneFlags[idx] && i === slot.winIdx && styles.h_item_win)}>
                                <img src={item.image_url} alt={item.weapon_name} />
                                <span>{item.weapon_name}</span>
                                <span>{item.skin_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const VerticalSlots = ({ slots, animating, doneFlags, count }: { slots: SlotData[]; animating: boolean; doneFlags: boolean[]; count: number }) => {
    const rows = count === 10 ? [slots.slice(0, 5), slots.slice(5, 10)] : [slots];
    return (
        <div className={styles.v_rows}>
            {rows.map((row, rowIdx) => (
                <div key={rowIdx} className={styles.v_row}>
                    {row.map((slot, colIdx) => {
                        const globalIdx = rowIdx * 5 + colIdx;
                        return (
                            <div key={colIdx} className={styles.v_slot}>
                                <div className={styles.v_pointer} />
                                <div className={styles.v_fade_t} />
                                <div className={styles.v_fade_b} />
                                <div className={styles.v_viewport}>
                                    <div className={styles.v_track} style={{ transform: `translateY(-${animating ? slot.translate : 0}px)`, transition: animating ? `transform ${slot.duration}s ${slot.easing}` : 'none' }}>
                                        {slot.items.map((item, i) => (
                                            <div key={i} className={cn(styles.v_item, doneFlags[globalIdx] && i === slot.winIdx && styles.v_item_win)}>
                                                <img src={item.image_url} alt={item.weapon_name} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default CaseOpening;