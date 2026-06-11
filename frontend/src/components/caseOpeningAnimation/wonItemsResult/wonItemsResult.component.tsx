import cn from 'classnames';
import { WonItem } from '../../../types/caseOpening.types.ts';
import { safePrice } from '../../../hooks/useOpening.hooks.ts';
import styles from './wonItemsResult.component.module.scss';
import {Link} from "react-router-dom";

type Props = {
    wonItems:    WonItem[];
    soldIds:     Set<number>;
    sellingOne:  number | null;
    sellingAll:  boolean;
    allSold:     boolean;
    unsoldTotal: number;
    multiplier:  number;
    onSellOne:   (item: WonItem, i: number) => void;
    onSellAll:   () => void;
    onRepeat:    () => void;
};

export const WonItemsResult = ({
                                   wonItems, soldIds, sellingOne, sellingAll,
                                   allSold, unsoldTotal, multiplier,
                                   onSellOne, onSellAll, onRepeat,
                               }: Props) => {
    // класс сетки зависит от количества открытий
    const layoutClass =
        multiplier === 10 ? styles.ten_items
            : multiplier === 5  ? styles.five_items
                : multiplier === 2  ? styles.two_items
                    : styles.one_item;

    return (
        <div className={styles.wrap}>
            <h2 className={styles.title}>Вы выиграли</h2>

            <div className={cn(styles.grid, layoutClass)}>
                {wonItems.map((item, i) => (
                    <div
                        key={i}
                        className={cn(
                            styles.card,
                            soldIds.has(i)              && styles.card_sold,
                            sellingAll && !soldIds.has(i) && styles.card_selling,
                        )}
                        style={{ animationDelay: `${i * 0.04}s` }}
                    >
                        <div className={styles.hex_bg}/>
                        <img src={item.image_url} alt={item.weapon_name} className={styles.card_img}/>
                        <span className={styles.card_weapon}>{item.weapon_name}</span>
                        <span className={styles.card_skin}>{item.skin_name}</span>

                        {soldIds.has(i) ? (
                            <div className={styles.sold_badge}>✓ Продано</div>
                        ) : (
                            <div className={styles.card_actions}>
                                <button
                                    className={styles.price_btn}
                                    onClick={() => onSellOne(item, i)}
                                    disabled={sellingOne === i || sellingAll}
                                >
                                    {sellingOne === i ? '...' : `${safePrice(item.price).toFixed(2)} ₽`}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className={styles.actions}>
                <button className={styles.action_btn} onClick={onRepeat} disabled={sellingAll}>
                    Повторить
                </button>
                <button
                    className={cn(styles.sell_btn, allSold && styles.sell_btn_done)}
                    onClick={onSellAll}
                    disabled={allSold || sellingAll || sellingOne !== null}
                >
                    {sellingAll ? 'Продаём...' : allSold ? 'Всё продано' : `Продать все за ${unsoldTotal.toFixed(2)} ₽`}
                </button>
                <Link to={"/contract"} className={styles.action_btn}>
                    В контракт
                </Link>
            </div>
        </div>
    );
};