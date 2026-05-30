import cn from "classnames";
import { InvItem, MAX_ITEMS } from "../../../hooks/useContract.hooks.ts";
import styles from "./contractInventory.component.module.scss";

type Props = {
    inventory: InvItem[];
    selected:  InvItem[];
    loading:   boolean;
    onToggle:  (item: InvItem) => void;
    isSelected:(item: InvItem) => boolean;
};

export const ContractInventory = ({ inventory, selected, loading, onToggle, isSelected }: Props) => (
    <div className={styles.inventory}>
        <div className={styles.inventory__header}>
            <span className={styles.inventory__title}>МОЙ ИНВЕНТАРЬ</span>
            <span className={styles.inventory__count}>{inventory.length}</span>
        </div>

        {loading ? (
            <div className={styles.state}>Загрузка...</div>
        ) : inventory.length === 0 ? (
            <div className={styles.state}>Инвентарь пуст</div>
        ) : (
            <div className={styles.grid}>
                {inventory.map(item => {
                    const sel   = isSelected(item);
                    const maxed = selected.length >= MAX_ITEMS && !sel; // нельзя выбрать больше 10

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                styles.card,
                                styles[`rarity_${item.rarity}`],
                                sel   && styles.card_selected,
                                maxed && styles.card_maxed,
                            )}
                            onClick={() => !maxed && onToggle(item)}
                        >
                            <span className={styles.card__price}>
                                {parseFloat(String(item.price)).toFixed(0)} ₽
                            </span>
                            <img src={item.image_url} alt={item.weapon_name}
                                 className={styles.card__img}
                                 onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }}/>
                            <p className={styles.card__name}>{item.weapon_name}</p>
                            <p className={styles.card__skin}>{item.skin_name}</p>
                            {sel && <div className={styles.card__check}>✓</div>}
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);