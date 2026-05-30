import cn from 'classnames';
import { SlotData } from '../../../types/caseOpening.types.ts';
import styles from './verticalSlots.component.module.scss';

type Props = {
    slots:     SlotData[];
    animating: boolean;
    doneFlags: boolean[];
    count:     number;
};

// вертикальные слоты используются при 5 и 10 открытиях
export const VerticalSlots = ({ slots, animating, doneFlags, count }: Props) => {
    // при 10 открытиях делим на 2 ряда по 5
    const rows = count === 10 ? [slots.slice(0, 5), slots.slice(5)] : [slots];

    return (
        <div className={styles.rows}>
            {rows.map((row, rowIdx) => (
                <div key={rowIdx} className={styles.row}>
                    {row.map((slot, colIdx) => {
                        const globalIdx = rowIdx * 5 + colIdx;
                        return (
                            <div key={colIdx} className={styles.slot}>
                                <div className={styles.pointer}/>
                                <div className={styles.fade_t}/>
                                <div className={styles.fade_b}/>
                                <div className={styles.viewport}>
                                    <div
                                        className={styles.track}
                                        style={{
                                            transform:  `translateY(-${animating ? slot.translate : 0}px)`,
                                            transition: animating ? `transform ${slot.duration}s ${slot.easing}` : 'none',
                                        }}
                                    >
                                        {slot.items.map((item, i) => (
                                            <div key={i} className={cn(styles.item, doneFlags[globalIdx] && i === slot.winIdx && styles.item_win)}>
                                                <img src={item.image_url} alt={item.weapon_name}/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};