import cn from 'classnames';
import styles from './multiplierControls.component.module.scss';

type Props = {
    multiplier:    number;
    fastMode:      boolean;
    onMultiplier:  (m: number) => void;
    onFastToggle:  () => void;
};

// контрол выбора количества открытий и режима быстрой анимации
export const MultiplierControls = ({ multiplier, fastMode, onMultiplier, onFastToggle }: Props) => (
    <div className={styles.wrap}>
        <button
            className={cn(styles.auto_btn, fastMode && styles.active)}
            onClick={onFastToggle}
            title="Быстрый режим"
        >▶▶</button>

        <div className={styles.multi_controls}>
            {[1, 2, 5, 10].map(m => (
                <button
                    key={m}
                    className={cn(styles.multi_btn, multiplier === m && styles.active)}
                    onClick={() => onMultiplier(m)}
                >
                    x{m}
                </button>
            ))}
        </div>
    </div>
);