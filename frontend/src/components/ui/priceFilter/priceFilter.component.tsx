import React from 'react';
import styles from "./priceFilter.component.module.scss"

type Props = {
    priceFrom:    string;
    priceTo:      string;
    isFiltering:  boolean;
    onFromChange: (v: string) => void;
    onToChange:   (v: string) => void;
    onClear:      () => void;
};

export const PriceFilter: React.FC<Props> = ({
                                                 priceFrom, priceTo, isFiltering,
                                                 onFromChange, onToChange, onClear,
                                             }) => (
    <>
        <div className={styles.wrap}>
            <input
                className={styles.input}
                type="number"
                placeholder="от ₽"
                value={priceFrom}
                min={0}
                onChange={e => onFromChange(e.target.value)}
            />
            <span className={styles.sep}>—</span>
            <input
                className={styles.input}
                type="number"
                placeholder="до ₽"
                value={priceTo}
                min={0}
                onChange={e => onToChange(e.target.value)}
            />
        </div>

        {isFiltering && (
            <button className={styles.reset_btn} onClick={onClear}>
                Сбросить
            </button>
        )}
    </>
);