import cn from 'classnames';
import { SlotData } from '../../../types/caseOpening.types.ts';
import styles from './horizontalRoulette.component.module.scss';

type Props = {
    slots:     SlotData[];
    animating: boolean;
    doneFlags: boolean[];
};

// горизонтальная рулетка используется при 1 и 2 открытиях
export const HorizontalRoulette = ({ slots, animating, doneFlags }: Props) => (
    <div className={styles.wrapper}>
        {slots.map((slot, idx) => (
            <div key={idx} className={styles.container}>
                <div className={styles.pointer}/>
                <div className={styles.fade_l}/>
                <div className={styles.fade_r}/>
                <div className={styles.viewport}>
                    <div
                        className={styles.track}
                        style={{
                            transform:  `translateX(-${animating ? slot.translate : 0}px)`,
                            transition: animating ? `transform ${slot.duration}s ${slot.easing}` : 'none',
                        }}
                    >
                        {slot.items.map((item, i) => (
                            <div key={i} className={cn(styles.item, doneFlags[idx] && i === slot.winIdx && styles.item_win)}>
                                <img src={item.image_url} alt={item.weapon_name}/>
                                <span>{item.weapon_name}</span>
                                <span>{item.skin_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ))}
    </div>
);