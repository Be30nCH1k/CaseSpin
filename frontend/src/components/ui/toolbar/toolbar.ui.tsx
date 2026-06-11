import styles from "./toolbar.ui.module.scss";

type Props = {
    total: number;
    unsoldCount: number;
    unsoldTotal: number;
    showUnsoldOnly: boolean;
    onToggleFilter: () => void;
    onSellAll: () => void;
};

export const InventoryToolbar = ({
                                     total,
                                     unsoldCount,
                                     unsoldTotal,
                                     showUnsoldOnly,
                                     onToggleFilter,
                                     onSellAll,
                                 }: Props) => {
    return (
        <div className={styles.toolbar}>
            <div className={styles.left}>
                <span className={styles.label}>
                    ТВОИ СКИНЫ

                    <span className={styles.count}>
                        {total}
                    </span>
                </span>

                <button
                    className={
                        showUnsoldOnly
                            ? `${styles.filter} ${styles.filterActive}`
                            : styles.filter
                    }
                    onClick={onToggleFilter}
                >
                    <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>

                    {showUnsoldOnly
                        ? `В инвентаре · ${unsoldCount}`
                        : "В инвентаре"}
                </button>
            </div>

            <button
                className={styles.sellAll}
                disabled={!unsoldCount}
                onClick={onSellAll}
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <line
                        x1="12"
                        y1="1"
                        x2="12"
                        y2="23"
                    />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>

                Продать всё за {unsoldTotal.toFixed(2)} ₽
            </button>
        </div>
    );
};