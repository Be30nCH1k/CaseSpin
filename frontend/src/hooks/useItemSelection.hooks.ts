import { useState, useMemo } from 'react';
import { Item } from '../types/upgrade.types';

const calculateChance = (itemPrice: number, targetPrice: number): number => {
    if (!itemPrice || !targetPrice || targetPrice <= 0) return 0;
    const raw = (itemPrice / targetPrice) * 100;
    return Math.min(75, Math.max(0.01, parseFloat(raw.toFixed(2))));
};

export const useItemSelection = (
    inventory: Item[],
    targetItems: Item[],
    fetchTargets: (itemId?: number) => Promise<void>
) => {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [selectedTarget, setSelectedTarget] = useState<Item | null>(null);
    const [balanceAdd, setBalanceAdd] = useState(0);

    const itemPrice = selectedItem?.price ?? 0;
    const targetPrice = selectedTarget?.price ?? 0;

    const chance = useMemo(() => calculateChance(itemPrice, targetPrice), [itemPrice, targetPrice]);
    const maxBalance = selectedTarget ? Math.max(0, targetPrice - itemPrice) : 0;

    const selectItem = (item: Item) => {
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

    const clearSelection = () => {
        setSelectedItem(null);
        setSelectedTarget(null);
        setBalanceAdd(0);
        fetchTargets();
    };

    return {
        selectedItem,
        selectedTarget,
        balanceAdd,
        itemPrice,
        targetPrice,
        chance,
        maxBalance,
        selectItem,
        setSelectedTarget,
        setBalanceAdd,
        clearSelection,
    };
};