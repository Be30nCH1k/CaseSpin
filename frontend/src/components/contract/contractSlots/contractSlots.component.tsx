import cn from "classnames";
import { InvItem, MIN_ITEMS, MAX_ITEMS } from "../../../hooks/useContract.hooks.ts";
import styles from "./contractSlots.component.module.scss";

const SLOTS = 10;

type Props = {
    selected:     InvItem[];
    rolling:      boolean;
    totalPrice:   number;
    minPossible:  number;
    maxPossible:  number;
    canRoll:      boolean;
    onToggle:     (item: InvItem) => void;
    onRoll:       () => void;
};

export const ContractSlots = ({
                                  selected, rolling, totalPrice,
                                  minPossible, maxPossible, canRoll,
                                  onToggle, onRoll,
                              }: Props) => {
    const slots = Array.from({ length: SLOTS }, (_, i) => selected[i] ?? null);

    return (
        <div className={styles.arena}>
            <div className={styles.arena__header}>
                <span className={styles.arena__title}>КОНТРАКТ</span>
                <span className={styles.arena__sub}>
                    Выбрано: <b>{selected.length}</b> / {MAX_ITEMS}
                    &nbsp;·&nbsp;
                    Ставка: <b>{totalPrice.toFixed(0)} ₽</b>
                </span>
            </div>

            {selected.length >= MIN_ITEMS && (
                <div className={styles.range_bar}>
                    <div className={styles.range_bar__item}>
                        <span className={styles.range_bar__label}>Минимум</span>
                        <span className={cn(styles.range_bar__value, styles.range_bar__value_min)}>
                            {minPossible.toFixed(0)} ₽
                        </span>
                    </div>
                    <div className={styles.range_bar__divider}>
                        <svg width="120" height="12" viewBox="0 0 120 12">
                            <line x1="0" y1="6" x2="110" y2="6"
                                  stroke="rgba(0,217,255,0.25)" strokeWidth="1" strokeDasharray="4 3"/>
                            <polygon points="110,2 120,6 110,10" fill="rgba(0,217,255,0.4)"/>
                        </svg>
                    </div>
                    <div className={styles.range_bar__item}>
                        <span className={styles.range_bar__label}>Максимум</span>
                        <span className={styles.range_bar__value}>
                            до <b>{maxPossible.toFixed(0)} ₽</b>
                        </span>
                    </div>
                </div>
            )}

            <div className={styles.slots}>
                {slots.map((item, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            styles.slot,
                            item    && styles.slot_filled,
                            rolling && styles.slot_rolling,
                        )}
                        onClick={() => item && onToggle(item)}
                    >
                        {item ? (
                            <>
                                <img src={item.image_url} alt={item.weapon_name}
                                     className={styles.slot__img}
                                     onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }}/>
                                <span className={styles.slot__price}>
                                    {parseFloat(String(item.price)).toFixed(0)} ₽
                                </span>
                                <button
                                    className={styles.slot__remove}
                                    onClick={e => { e.stopPropagation(); onToggle(item); }}
                                >✕</button>
                            </>
                        ) : (
                            <div className={styles.slot__empty}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" strokeWidth="1.2" opacity="0.25">
                                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                className={cn(styles.roll_btn, rolling && styles.roll_btn_spin)}
                onClick={onRoll}
                disabled={!canRoll}
            >
                {rolling ? (
                    <span className={styles.roll_btn__spinner}/>
                ) : (
                    <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2.5">
                            <polyline points="17 1 21 5 17 9"/>
                            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                            <polyline points="7 23 3 19 7 15"/>
                            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                        </svg>
                        ЗАКЛЮЧИТЬ КОНТРАКТ
                    </>
                )}
            </button>

            {selected.length < MIN_ITEMS && (
                <p className={styles.hint}>Выберите минимум {MIN_ITEMS} предмета снизу</p>
            )}
        </div>
    );
};