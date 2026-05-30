import cn from 'classnames';
import styles from './UpgradeButton.component.module.scss';
import { Item } from '../../../types/upgrade.types';

interface UpgradeButtonProps {
    selectedItem: Item | null;
    selectedTarget: Item | null;
    chance: number;
    spinning: boolean;
    onClick: () => void;
}

export const UpgradeButton = ({ selectedItem, selectedTarget, chance, spinning, onClick }: UpgradeButtonProps) => {
    const isDisabled = spinning || !selectedItem || !selectedTarget || chance <= 0;

    return (
        <button
            className={cn(styles.upgrade_btn, spinning && styles.upgrade_btn_spin)}
            onClick={onClick}
            disabled={isDisabled}
        >
            {spinning ? "КРУТИТСЯ..." : "▲ АПГРЕЙД"}
        </button>
    );
};