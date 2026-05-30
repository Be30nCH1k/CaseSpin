import styles from "./topDrop.component.module.scss";

type Props = {
    drop: any;
};

export const TopDrop = ({ drop }: Props) => {
    if (!drop) return null;

    return (
        <div className={styles.topDrop}>
      <span className={styles.label}>
        ЛУЧШИЙ ДРОП
      </span>

            <div className={styles.price}>
                {Number(drop.price).toFixed(2)} ₽
            </div>

            <div className={styles.imageWrap}>
                <img
                    src={drop.image_url}
                    alt={drop.weapon_name}
                    className={styles.image}
                />
            </div>

            <p className={styles.name}>
                {drop.weapon_name} | {drop.skin_name}
            </p>
        </div>
    );
};