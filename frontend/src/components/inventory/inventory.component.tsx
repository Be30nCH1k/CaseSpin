import { useEffect, useState, useCallback } from "react";
import cn from "classnames";
import api from "../../api/api";
import styles from "./inventory.component.module.scss";
import type {DropEntry, UserInfo} from "../../types/types.ts";


const safePrice = (price: any): number => {
    const n = parseFloat(String(price ?? 0));
    return isNaN(n) ? 0 : n;
};

const ITEMS_PER_ROW = 4; // примерно 4 карточки в строке (зависит от ширины)
const INITIAL_ROWS = 4;
const LOAD_MORE_ROWS = 2;

export const InventoryComponent = () => {
    const [user,    setUser]    = useState<UserInfo | null>(null);
    const [drops,   setDrops]   = useState<DropEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selling, setSelling] = useState<Set<number>>(new Set());
    const [visibleCount, setVisibleCount] = useState(INITIAL_ROWS * ITEMS_PER_ROW);

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

    useEffect(() => { fetchData(); }, [fetchData]);

    const dispatchBalance = (balance: string) =>
        window.dispatchEvent(new CustomEvent('balance:update', { detail: balance }));

    const handleSellOne = async (drop: DropEntry) => {
        if (drop.is_sold || !drop.inventory_item_id || selling.has(drop.id)) return;
        setSelling(prev => new Set(prev).add(drop.id));
        try {
            const r = await api.post(`inventory/${drop.inventory_item_id}/sell/`);
            setDrops(prev =>
                prev.map(d => d.id === drop.id ? { ...d, is_sold: true, inventory_item_id: null } : d)
            );
            if (r.data.new_balance) {
                setUser(prev => prev ? { ...prev, balance: r.data.new_balance } : prev);
                dispatchBalance(r.data.new_balance);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSelling(prev => { const s = new Set(prev); s.delete(drop.id); return s; });
        }
    };

    const handleSellAll = async () => {
        const unsold = drops.filter(d => !d.is_sold && d.inventory_item_id);
        if (unsold.length === 0) return;
        const ids = unsold.map(d => d.inventory_item_id) as number[];
        try {
            const r = await api.post('inventory/sell_many/', { ids });
            setDrops(prev => prev.map(d => ({ ...d, is_sold: true, inventory_item_id: null })));
            if (r.data.new_balance) {
                setUser(prev => prev ? { ...prev, balance: r.data.new_balance } : prev);
                dispatchBalance(r.data.new_balance);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + LOAD_MORE_ROWS * ITEMS_PER_ROW);
    };

    const unsoldDrops = drops.filter(d => !d.is_sold);
    const unsoldTotal = unsoldDrops.reduce((s, d) => s + safePrice(d.item.price), 0);
    const visibleDrops = drops.slice(0, visibleCount);
    const hasMore = visibleCount < drops.length;
    const remainingCount = drops.length - visibleCount;

    return (
        <div className={cn(styles.page)}>
            {user && (
                <div className={cn(styles.profile)}>
                    <div className={cn(styles.profile__left)}>
                        <img
                            src={user.avatar_url || `https://robohash.org/${user.username}?set=set4&size=80x80`}
                            alt={user.username}
                            className={cn(styles.profile__avatar)}
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://robohash.org/${user.username}?set=set4&size=80x80`; }}
                        />
                        <div className={cn(styles.profile__info)}>
                            <p className={cn(styles.profile__name)}>{user.username}</p>
                            <p className={cn(styles.profile__balance)}>
                                Баланс: <span>{safePrice(user.balance).toFixed(2)} ₽</span>
                            </p>
                            <p className={cn(styles.profile__stats)}>
                                Всего дропов: <span>{drops.length}</span>
                                &nbsp;·&nbsp; В инвентаре: <span>{unsoldDrops.length}</span>
                                &nbsp;·&nbsp; Стоимость: <span>{unsoldTotal.toFixed(2)} ₽</span>
                            </p>
                        </div>
                    </div>

                    {user.best_drop && (
                        <div className={cn(styles.top_drop)}>
                            <span className={cn(styles.top_drop__label)}>ЛУЧШИЙ ДРОП</span>
                            <div className={cn(styles.top_drop__price)}>
                                {safePrice(user.best_drop.price).toFixed(2)} ₽
                            </div>
                            <div className={cn(styles.top_drop__img_wrap)}>
                                <img
                                    src={user.best_drop.image_url}
                                    alt={user.best_drop.weapon_name}
                                    className={cn(styles.top_drop__img)}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            </div>
                            <p className={cn(styles.top_drop__name)}>
                                {user.best_drop.weapon_name} | {user.best_drop.skin_name}
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className={cn(styles.toolbar)}>
                <span className={cn(styles.tab_label)}>
                    ТВОИ СКИНЫ <span className={cn(styles.tab_count)}>{drops.length}</span>
                </span>
                <button
                    className={cn(styles.btn_sell_all)}
                    onClick={handleSellAll}
                    disabled={unsoldDrops.length === 0}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    Продать всё за {unsoldTotal.toFixed(2)} ₽
                </button>
            </div>

            {loading ? (
                <div className={cn(styles.loader)}>Загрузка...</div>
            ) : drops.length === 0 ? (
                <div className={cn(styles.empty)}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <path d="M8 21h8M12 17v4"/>
                    </svg>
                    <p>Вы ещё не открывали кейсы</p>
                </div>
            ) : (
                <>
                    <div className={cn(styles.grid)}>
                        {visibleDrops.map((drop) => (
                            <div
                                key={drop.id}
                                className={cn(
                                    styles.card,
                                    styles[`rarity_${drop.item.rarity}`],
                                    drop.is_sold && styles.card_sold
                                )}
                            >
                                <span className={cn(styles.card__price)}>
                                    {safePrice(drop.item.price).toFixed(2)} ₽
                                </span>

                                {drop.is_sold && (
                                    <div className={cn(styles.card__sold_overlay)}>
                                        <span>✓ Продано</span>
                                    </div>
                                )}

                                <div className={cn(styles.card__img_wrap)}>
                                    <img
                                        src={drop.item.image_url}
                                        alt={drop.item.weapon_name}
                                        className={cn(styles.card__img)}
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>

                                <div className={cn(styles.card__footer)}>
                                    <p className={cn(styles.card__name)}>{drop.item.weapon_name}</p>
                                    <p className={cn(styles.card__skin)}>{drop.item.skin_name}</p>
                                    {!drop.is_sold && (
                                        <button
                                            className={cn(styles.card__sell_btn)}
                                            onClick={() => handleSellOne(drop)}
                                            disabled={selling.has(drop.id)}
                                        >
                                            {selling.has(drop.id) ? '...' : 'Продать'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <div className={cn(styles.load_more_wrap)}>
                            <button
                                className={cn(styles.load_more_btn)}
                                onClick={handleLoadMore}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                                Показать ещё ({remainingCount})
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default InventoryComponent;