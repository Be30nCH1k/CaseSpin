import cn from 'classnames';
import styles from './InventoryGrid.component.module.scss';
import { Item } from '../../../types/upgrade.types';

interface InventoryGridProps {
    inventory: Item[];
    loading: boolean;
    selectedItem: Item | null;
    onSelectItem: (item: Item) => void;
}

export const InventoryGrid = ({ inventory, loading, selectedItem, onSelectItem }: InventoryGridProps) => {
    if (loading) {
        return <div className={styles.empty_state}>Загрузка...</div>;
    }

    if (inventory.length === 0) {
        return <div className={styles.empty_state}>Инвентарь пуст</div>;
    }

    return (
        <>
            {inventory.map((item) => (
                <div
                    key={item.id}
                    className={cn(
                        styles.inv_card,
                        styles[`rarity_${item.rarity}`],
                        selectedItem?.id === item.id && styles.inv_card_selected
                    )}
                    onClick={() => onSelectItem(item)}
                >
                    <span className={styles.inv_card__price}>{item.price.toFixed(2)} ₽</span>
                    <img src={item.image_url} alt={item.weapon_name} className={styles.inv_card__img}
                         onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}/>
                    <p className={styles.inv_card__name}>{item.weapon_name}</p>
                    <p className={styles.inv_card__skin}>{item.skin_name}</p>
                    {selectedItem?.id === item.id && <div className={styles.inv_card__check}>✓</div>}
                </div>
            ))}
        </>
    );
};