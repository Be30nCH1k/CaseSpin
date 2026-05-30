import cn from 'classnames';
import styles from './Slot.component.module.scss';
import { Item, SpinResult } from '../../../types/upgrade.types';

interface SlotProps {
    label: string;
    item: Item | null;
    result: SpinResult;
    spinning: boolean;
    emptyIcon: React.ReactNode;
    emptyText: string;
    onRemove?: () => void;
}

export const Slot = ({ label, item, result, spinning, emptyIcon, emptyText, onRemove }: SlotProps) => {
    return (
        <div className={cn(styles.slot, result === "win" && styles.slot_win, result === "lose" && styles.slot_lose)}>
            <div className={styles.slot__label}>{label}</div>
            {item ? (
                <div className={styles.slot__content}>
                    <img src={item.image_url} alt={item.weapon_name} className={styles.slot__img}/>
                    <p className={styles.slot__name}>{item.weapon_name}</p>
                    <p className={styles.slot__skin}>{item.skin_name}</p>
                    <p className={styles.slot__price}>{item.price.toFixed(2)} ₽</p>
                    {!spinning && onRemove && (
                        <button className={styles.slot__remove} onClick={onRemove}>✕</button>
                    )}
                </div>
            ) : (
                <div className={styles.slot__empty}>
                    {emptyIcon}
                    <span>{emptyText}</span>
                </div>
            )}
        </div>
    );
};