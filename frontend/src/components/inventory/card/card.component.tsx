import cn from "classnames";

import styles from "./card.component.module.scss";

import type { DropEntry } from "../../../types/types";

type Props = {
    drop: DropEntry;
    isSelling: boolean;
    onSell: (drop: DropEntry) => void;
};

export const InventoryCard = ({
                                  drop,
                                  isSelling,
                                  onSell,
                              }: Props) => {
    return (
        <div
            className={cn(
                styles.card,
                styles[`rarity${drop.item.rarity}`],
                drop.is_sold && styles.sold
            )}
        >
      <span className={styles.price}>
        {Number(drop.item.price).toFixed(2)} ₽
      </span>

            <div className={styles.imageWrap}>
                <img
                    src={drop.item.image_url}
                    alt={drop.item.weapon_name}
                    className={styles.image}
                />
            </div>

            <div className={styles.footer}>
                <p className={styles.name}>
                    {drop.item.weapon_name}
                </p>

                <p className={styles.skin}>
                    {drop.item.skin_name}
                </p>

                {!drop.is_sold && (
                    <button
                        className={styles.sellBtn}
                        disabled={isSelling}
                        onClick={() => onSell(drop)}
                    >
                        {isSelling ? "..." : "Продать"}
                    </button>
                )}
                {drop.is_sold && (
                    <div className={styles.soldOverlay}>
                        <span>Продано</span>
                    </div>
                )}
            </div>
        </div>
    );
};