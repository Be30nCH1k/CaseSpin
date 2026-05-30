import styles from "./empty.component.module.scss";

export const InventoryEmpty = () => {
    return (
        <div className={styles.empty}>
            <p>Вы ещё не открывали кейсы</p>
        </div>
    );
};