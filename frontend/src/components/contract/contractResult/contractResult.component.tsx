import { ContractResult } from "../../../hooks/useContract.hooks.ts";
import styles from "./contractResult.component.module.scss";

type Props = {
    result:   ContractResult;
    onClose:  () => void;
};

export const ContractResultModal = ({ result, onClose }: Props) => {
    if (!result.item) return null;

    return (
        // клик по оверлею закрывает модалку
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modal__glow}/>
                <p className={styles.modal__label}>ВЫ ПОЛУЧИЛИ</p>
                <img src={result.item.image_url} alt={result.item.weapon_name}
                     className={styles.modal__img}/>
                <p className={styles.modal__name}>{result.item.weapon_name}</p>
                <p className={styles.modal__skin}>{result.item.skin_name}</p>
                <p className={styles.modal__price}>
                    {parseFloat(String(result.item.price)).toFixed(0)} ₽
                </p>
                <button className={styles.modal__close} onClick={onClose}>
                    Забрать
                </button>
            </div>
        </div>
    );
};