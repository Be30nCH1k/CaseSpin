import { useState } from 'react';
import api from '../api/api';
import { SlotData, WonItem } from '../types/caseOpening.types.ts';

// Константы анимации
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

// Небольшой разброс позиции остановки между слотами
const jitter = (i: number) => Math.round(Math.sin(i * 2.4) * 14);

export const safePrice = (price: any): number => {
    const n = parseFloat(String(price ?? 0));
    return isNaN(n) ? 0 : n;
};

type Props = {
    caseId:       number;
    isOpening:    boolean;
    setIsOpening: React.Dispatch<React.SetStateAction<boolean>>;
    setShowResult: React.Dispatch<React.SetStateAction<boolean>>;
    fastMode:     boolean;
    multiplier:   number;
};

export const useCaseOpening = ({
                                   caseId, isOpening, setIsOpening, setShowResult, fastMode, multiplier,
                               }: Props) => {
    const [slots,      setSlots]      = useState<SlotData[]>([]);
    const [animating,  setAnimating]  = useState(false);
    const [doneFlags,  setDoneFlags]  = useState<boolean[]>([]);
    const [wonItems,   setWonItems]   = useState<WonItem[]>([]);
    const [soldIds,    setSoldIds]    = useState<Set<number>>(new Set());
    const [sellingOne, setSellingOne] = useState<number | null>(null);
    const [sellingAll, setSellingAll] = useState(false);

    const isVertical = multiplier >= 5;

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

            // Спиним каждый слот по очереди
            const dropped: WonItem[] = [];
            for (let i = 0; i < multiplier; i++) {
                const r = await api.post(`cases/${caseId}/spin/`);
                dropped.push({ ...r.data.won_item, inventoryId: r.data.inventory_id });
                if (r.data.new_balance !== undefined)
                    window.dispatchEvent(new CustomEvent('balance:update', { detail: String(r.data.new_balance) }));
            }

            const caseR = await api.get(`cases/${caseId}/`);
            const pool: any[] = caseR.data.items.map((el: any) => ({ ...el.item }));
            const durations = fastMode ? DURS_FAST : DURS_NORMAL;

            // Строим данные для каждого слота
            const built: SlotData[] = dropped.map((winner, idx) => {
                const total  = isVertical ? V_TOTAL   : H_TOTAL;
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

            // Двойной RAF чтобы браузер успел применить начальное состояние
            requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));

            built.forEach((s, idx) => {
                setTimeout(
                    () => setDoneFlags(prev => { const n = [...prev]; n[idx] = true; return n; }),
                    s.duration * 1000 + 80
                );
            });

            const maxMs = Math.max(...built.map(s => s.duration * 1000)) + 500;
            setTimeout(() => { setWonItems(dropped); setShowResult(true); setIsOpening(false); }, maxMs);

        } catch (e) {
            console.error(e);
            setIsOpening(false);
        }
    };

    // Продать один предмет
    const handleSellOne = async (item: WonItem, index: number) => {
        if (!item.inventoryId || soldIds.has(index) || sellingOne !== null || sellingAll) return;
        setSellingOne(index);
        try {
            const r = await api.post(`inventory/${item.inventoryId}/sell/`);
            setSoldIds(prev => new Set(prev).add(index));
            if (r.data.new_balance !== undefined)
                window.dispatchEvent(new CustomEvent('balance:update', { detail: String(r.data.new_balance) }));
        } catch (e) {
            console.error(e);
        } finally {
            setSellingOne(null);
        }
    };

    // Продать все одним запросом
    const handleSellAll = async () => {
        if (sellingAll || sellingOne !== null) return;
        const ids = wonItems
            .map((item, i) => ({ item, i }))
            .filter(({ i }) => !soldIds.has(i))
            .map(({ item }) => item.inventoryId)
            .filter(Boolean) as number[];

        if (!ids.length) return;
        setSellingAll(true);
        try {
            const r = await api.post('inventory/sell_many/', { ids });
            setSoldIds(new Set(wonItems.map((_, i) => i)));
            if (r.data.new_balance !== undefined)
                window.dispatchEvent(new CustomEvent('balance:update', { detail: String(r.data.new_balance) }));
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

    const unsoldTotal = wonItems
        .filter((_, i) => !soldIds.has(i))
        .reduce<number>((s, item) => s + safePrice(item.price), 0);

    const allSold = wonItems.length > 0 && soldIds.size === wonItems.length;

    return {
        slots, animating, doneFlags, wonItems,
        soldIds, sellingOne, sellingAll,
        isVertical, unsoldTotal, allSold,
        handleOpen, handleSellOne, handleSellAll, handleRepeat,
    };
};