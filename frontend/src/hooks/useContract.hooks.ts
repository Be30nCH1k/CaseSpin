import { useEffect, useState, useCallback } from "react";
import api from "../api/api.ts";
import type {InvItem, ContractResult} from "../types/contact.types.ts";

const safe = (v: any): number => {
    const n = parseFloat(String(v ?? 0));
    return isNaN(n) ? 0 : n;
};

// Случайная цена награды: от 20% до 500% суммы, смещена к низким значениям
const rollRewardPrice = (totalPrice: number): number => {
    const minVal = Math.max(100, totalPrice * 0.2);
    const maxVal = totalPrice * 5;
    const t      = Math.pow(Math.random(), 1.8);
    return Math.round((minVal + t * (maxVal - minVal)) / 10) * 10;
};

export const MIN_ITEMS = 3;
export const MAX_ITEMS = 10;

export const useContractHooks = () => {
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
            if (already)              return prev.filter(i => i.id !== item.id);
            if (prev.length >= MAX_ITEMS) return prev;
            return [...prev, item];
        });
    };

    const isSelected = (item: InvItem) => selected.some(i => i.id === item.id);
    const totalPrice = selected.reduce((s, i) => s + safe(i.price), 0);
    const canRoll    = selected.length >= MIN_ITEMS && !rolling;

    // Диапазон возможного выигрыша
    const minPossible = totalPrice > 0 ? Math.max(100, totalPrice * 0.2) : 0;
    const maxPossible = totalPrice > 0 ? totalPrice * 5 : 0;

    const handleContract = async () => {
        if (!canRoll) return;
        setRolling(true);
        setResult(null);
        setShowResult(false);

        const snapshot = [...selected]; // сохраняем до сброса

        try {
            const rewardPrice = rollRewardPrice(totalPrice);
            const { data }    = await api.post("/contract/perform/", {
                item_ids:     snapshot.map(i => i.id),
                reward_price: rewardPrice,
            });

            await new Promise(res => setTimeout(res, 2200)); // анимация ожидания

            setResult({ success: true, item: data.item, new_balance: data.new_balance });
            setShowResult(true);

            if (data.new_balance)
                window.dispatchEvent(new CustomEvent("balance:update", { detail: data.new_balance }));

            // Убираем использованные, добавляем полученный в начало
            const usedIds = new Set(snapshot.map(i => i.id));
            setInventory(prev => {
                const filtered = prev.filter(i => !usedIds.has(i.id));
                if (!data.item) return filtered;
                const newItem: InvItem = { ...data.item, inventory_item_id: data.item.id };
                return [newItem, ...filtered];
            });
            setSelected([]);

        } catch (e: any) {
            alert(e.response?.data?.error || "Ошибка контракта");
        } finally {
            setRolling(false);
        }
    };

    return {
        inventory, selected, loading, rolling,
        result, showResult, setShowResult,
        toggleSelect, isSelected,
        totalPrice, canRoll, minPossible, maxPossible,
        handleContract,
    };
};