import { useState, useMemo } from 'react';
import cn from 'classnames';
import styles from './TargetGrid.component.module.scss';
import { Item } from '../../../types/upgrade.types';

interface TargetGridProps {
    targets: Item[];
    loading: boolean;
    selectedItem: Item | null;
    selectedTarget: Item | null;
    itemPrice: number;
    onSelectTarget: (item: Item) => void;
}

const calculateChance = (itemPrice: number, targetPrice: number): number => {
    if (!itemPrice || !targetPrice || targetPrice <= 0) return 0;
    const raw = (itemPrice / targetPrice) * 100;
    return Math.min(75, Math.max(0.01, parseFloat(raw.toFixed(2))));
};

export const TargetGrid = ({ targets, loading, selectedItem, selectedTarget, itemPrice, onSelectTarget }: TargetGridProps) => {
    const PAGE_SIZE = 20;
    const [page, setPage] = useState(0);
    const [priceFrom, setPriceFrom] = useState("");
    const [priceTo, setPriceTo] = useState("");

    const filtered = useMemo(() =>
        targets.filter(t => {
            const p = t.price;
            if (priceFrom && p < parseFloat(priceFrom)) return false;
            if (priceTo && p > parseFloat(priceTo)) return false;
            if (selectedItem && p <= itemPrice) return false;
            return true;
        }), [targets, priceFrom, priceTo, itemPrice, selectedItem]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pagedTargets = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    if (loading) {
        return <div className={styles.empty_state}>Загрузка...</div>;
    }

    if (targets.length === 0) {
        return <div className={styles.empty_state}>
            {selectedItem ? "Нет подходящих предметов" : "Сначала выберите предмет слева"}
        </div>;
    }

    return (
        <>
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

            <div className={styles.target_grid}>
                {pagedTargets.map((item) => {
                    const itemChance = selectedItem ? calculateChance(itemPrice, item.price) : 0;
                    const isSelected = selectedTarget?.id === item.id;

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                styles.target_card,
                                styles[`rarity_${item.rarity}`],
                                isSelected && styles.target_card_selected
                            )}
                            onClick={() => onSelectTarget(item)}
                        >
                            <span className={styles.target_card__price}>{item.price.toFixed(2)} ₽</span>
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
        </>
    );
};