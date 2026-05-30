import cn from 'classnames';
import styles from './ChanceBadge.component.module.scss';
import { SpinResult } from '../../../types/upgrade.types';

interface ChanceBadgeProps {
    chance: number;
    spinning: boolean;
    result: SpinResult;
    hasItems: boolean;
}

export const ChanceBadge = ({ chance, spinning, result, hasItems }: ChanceBadgeProps) => {
    let text = '';

    if (result === "win") {
        text = "Ура победа!";
    } else if (result === "lose") {
        text = "Неудача!";
    } else if (spinning) {
        text = `${chance.toFixed(2)}% шанс`;
    } else if (hasItems) {
        text = `${chance.toFixed(2)}% шанс`;
    } else {
        text = "Выберите предметы";
    }

    return (
        <div className={cn(
            styles.chance_badge,
            result === "win" && styles.chance_badge_win,
            result === "lose" && styles.chance_badge_lose
        )}>
            {text}
        </div>
    );
};