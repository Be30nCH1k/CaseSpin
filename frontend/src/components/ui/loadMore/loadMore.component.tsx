import styles from "./loadMore.component.module.scss";

type Props = {
    count: number;
    onClick: () => void;
};

export const LoadMore = ({
                             count,
                             onClick,
                         }: Props) => {
    return (
        <div className={styles.wrap}>
            <button
                className={styles.button}
                onClick={onClick}
            >
                Показать ещё ({count})
            </button>
        </div>
    );
};