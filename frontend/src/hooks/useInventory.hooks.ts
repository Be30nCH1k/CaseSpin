import { useCallback, useEffect, useState } from "react";

import api from "../api/api";

import type {
    DropEntry,
    UserInfo,
} from "../types/types";

export const safePrice = (price: unknown): number => {
    const n = parseFloat(String(price ?? 0));
    return Number.isNaN(n) ? 0 : n;
};

export const useInventory = () => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [drops, setDrops] = useState<DropEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selling, setSelling] = useState<Set<number>>(new Set());

    const dispatchBalance = (balance: string) => {
        window.dispatchEvent(
            new CustomEvent("balance:update", {
                detail: balance,
            })
        );
    };

    const fetchData = useCallback(async () => {
        setLoading(true);

        try {
            const [userRes, historyRes] = await Promise.all([
                api.get<UserInfo>("/me/"),
                api.get<DropEntry[]>("/drop-history/"),
            ]);

            setUser(userRes.data);
            setDrops(historyRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sellOne = async (drop: DropEntry) => {
        if (
            drop.is_sold ||
            !drop.inventory_item_id ||
            selling.has(drop.id)
        ) {
            return;
        }

        setSelling(prev => new Set(prev).add(drop.id));

        try {
            const r = await api.post(
                `inventory/${drop.inventory_item_id}/sell/`
            );

            setDrops(prev =>
                prev.map(d =>
                    d.id === drop.id
                        ? {
                            ...d,
                            is_sold: true,
                            inventory_item_id: null,
                        }
                        : d
                )
            );

            if (r.data.new_balance) {
                setUser(prev =>
                    prev
                        ? {
                            ...prev,
                            balance: r.data.new_balance,
                        }
                        : prev
                );

                dispatchBalance(r.data.new_balance);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSelling(prev => {
                const next = new Set(prev);
                next.delete(drop.id);
                return next;
            });
        }
    };

    const sellAll = async () => {
        const unsold = drops.filter(
            d => !d.is_sold && d.inventory_item_id
        );

        if (!unsold.length) return;

        const ids = unsold.map(
            d => d.inventory_item_id
        ) as number[];

        try {
            const r = await api.post(
                "inventory/sell_many/",
                { ids }
            );

            setDrops(prev =>
                prev.map(d => ({
                    ...d,
                    is_sold: true,
                    inventory_item_id: null,
                }))
            );

            if (r.data.new_balance) {
                setUser(prev =>
                    prev
                        ? {
                            ...prev,
                            balance: r.data.new_balance,
                        }
                        : prev
                );

                dispatchBalance(r.data.new_balance);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return {
        user,
        drops,
        loading,
        selling,
        sellOne,
        sellAll,
    };
};