import { useState } from "react";
import cn from "classnames";
import styles from "./depositModal.component.module.scss";
import api from "../../api/api";

type Props = {
    onClose:     () => void;
    onSuccess:   (newBalance: string) => void;
};

const AMOUNTS    = [100, 250, 500, 1000, 2500, 5000];
const METHODS    = [
    { id: "card",   label: "Банковская карта", icon: "💳" },
    { id: "crypto", label: "Криптовалюта",     icon: "₿"  },
    { id: "sbp",    label: "СБП",              icon: "🏦"  },
];

const PROMO_CODES: Record<string, number> = {
    "BONUS10":  10,
    "CASESPIN": 15,
    "WELCOME":  20,
    "НИКИТОС ДОДЕП": 40,
};

export const DepositModal = ({ onClose, onSuccess }: Props) => {
    const [amount,       setAmount]       = useState<number | "">(500);
    const [customAmount, setCustomAmount] = useState("");
    const [method,       setMethod]       = useState("card");
    const [promo,        setPromo]        = useState("");
    const [promoStatus,  setPromoStatus]  = useState<"idle"|"ok"|"err">("idle");
    const [promoBonus,   setPromoBonus]   = useState(0);
    const [loading,      setLoading]      = useState(false);
    const [error,        setError]        = useState("");

    const baseAmount  = Number(customAmount || amount || 0);
    const bonusAmount = Math.floor(baseAmount * promoBonus / 100);
    const totalAmount = baseAmount + bonusAmount;

    const checkPromo = () => {
        const code = promo.trim().toUpperCase();
        if (PROMO_CODES[code]) {
            setPromoBonus(PROMO_CODES[code]);
            setPromoStatus("ok");
        } else {
            setPromoBonus(0);
            setPromoStatus("err");
        }
    };

    const handleDeposit = async () => {
        if (!baseAmount || baseAmount < 10) {
            setError("Минимальная сумма пополнения — 10 ₽");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const r = await api.post("/deposit/", {
                amount:     baseAmount,
                method,
                promo_code: promo.trim().toUpperCase() || null,
            });
            onSuccess(r.data.new_balance);
            onClose();
        } catch (e: any) {
            setError(e.response?.data?.error || "Ошибка пополнения. Попробуйте позже.");
        } finally {
            setLoading(false);
        }
    };

    const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className={styles.overlay} onClick={handleOverlay}>
            <div className={styles.modal}>

                <div className={styles.header}>
                    <h2 className={styles.title}>Пополнение баланса</h2>
                    <button className={styles.close_btn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.section}>
                    <p className={styles.section_label}>Сумма</p>
                    <div className={styles.amounts}>
                        {AMOUNTS.map(a => (
                            <button
                                key={a}
                                className={cn(styles.amount_btn, amount === a && !customAmount && styles.amount_btn_active)}
                                onClick={() => { setAmount(a); setCustomAmount(""); setError(""); }}
                            >
                                {a} ₽
                            </button>
                        ))}
                    </div>

                    <div className={styles.custom_wrap}>
                        <span className={styles.custom_prefix}>₽</span>
                        <input
                            type="number"
                            className={styles.custom_input}
                            placeholder="Своя сумма"
                            value={customAmount}
                            min={10}
                            onChange={e => {
                                setCustomAmount(e.target.value);
                                setAmount("");
                                setError("");
                            }}
                        />
                    </div>
                </div>

                <div className={styles.section}>
                    <p className={styles.section_label}>Способ оплаты</p>
                    <div className={styles.methods}>
                        {METHODS.map(m => (
                            <button
                                key={m.id}
                                className={cn(styles.method_btn, method === m.id && styles.method_btn_active)}
                                onClick={() => setMethod(m.id)}
                            >
                                <span className={styles.method_icon}>{m.icon}</span>
                                <span className={styles.method_label}>{m.label}</span>
                                {method === m.id && (
                                    <span className={styles.method_check}>✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <p className={styles.section_label}>Промокод</p>
                    <div className={styles.promo_wrap}>
                        <input
                            type="text"
                            className={cn(
                                styles.promo_input,
                                promoStatus === "ok"  && styles.promo_ok,
                                promoStatus === "err" && styles.promo_err,
                            )}
                            placeholder="Введите промокод"
                            value={promo}
                            onChange={e => {
                                setPromo(e.target.value);
                                setPromoStatus("idle");
                                setPromoBonus(0);
                            }}
                            onKeyDown={e => e.key === "Enter" && checkPromo()}
                        />
                        <button
                            className={styles.promo_btn}
                            onClick={checkPromo}
                            disabled={!promo.trim()}
                        >
                            Применить
                        </button>
                    </div>

                    {promoStatus === "ok" && (
                        <p className={styles.promo_success}>
                            ✓ Промокод применён — бонус +{promoBonus}%
                        </p>
                    )}
                    {promoStatus === "err" && (
                        <p className={styles.promo_error}>✕ Промокод недействителен</p>
                    )}
                </div>

                <div className={styles.summary}>
                    <div className={styles.summary_row}>
                        <span>Сумма</span>
                        <span>{baseAmount} ₽</span>
                    </div>
                    {bonusAmount > 0 && (
                        <div className={cn(styles.summary_row, styles.summary_bonus)}>
                            <span>Бонус +{promoBonus}%</span>
                            <span>+{bonusAmount} ₽</span>
                        </div>
                    )}
                    <div className={cn(styles.summary_row, styles.summary_total)}>
                        <span>Итого на счёт</span>
                        <span>{totalAmount} ₽</span>
                    </div>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <button
                    className={cn(styles.pay_btn, loading && styles.pay_btn_loading)}
                    onClick={handleDeposit}
                    disabled={loading || !baseAmount}
                >
                    {loading ? "Обработка..." : `Пополнить на ${totalAmount} ₽`}
                </button>

                <p className={styles.disclaimer}>
                    Нажимая кнопку, вы соглашаетесь с условиями использования сервиса
                </p>
            </div>
        </div>
    );
};