import { useState, useCallback, useEffect } from 'react';
import api from '../api/api';
import { Item, User } from '../types/upgrade.types';

export const useUpgradeData = (isAuth: boolean) => {
    const [user, setUser] = useState<User | null>(null);
    const [inventory, setInventory] = useState<Item[]>([]);
    const [targetItems, setTargetItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        if (!isAuth) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [uRes, iRes] = await Promise.all([
                api.get("/me/"),
                api.get("/upgrade/inventory/"),
            ]);
            setUser(uRes.data);
            setInventory(iRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [isAuth]);

    const fetchTargets = useCallback(async (itemId?: number) => {
        try {
            const res = await api.get("/upgrade/target-items/",
                itemId ? { params: { selected_item_id: itemId } } : {});
            setTargetItems(res.data);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const updateBalance = useCallback((newBalance: number) => {
        setUser((u: any) => u ? { ...u, balance: newBalance } : u);
        window.dispatchEvent(new CustomEvent("balance:update", { detail: newBalance }));
    }, []);

    useEffect(() => {
        fetchAll();
        fetchTargets();
    }, [fetchAll, fetchTargets]);

    return {
        user,
        inventory,
        targetItems,
        loading,
        fetchAll,
        fetchTargets,
        updateBalance,
        setTargetItems,
    };
};