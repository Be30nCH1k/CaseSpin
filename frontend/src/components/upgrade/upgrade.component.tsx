import { useState } from 'react';
import cn from 'classnames';
import api from "../../api/api";
import styles from "./Upgrade.component.module.scss";
import { Wheel } from "./wheel/wheel.component.tsx";
import { Slot } from "./slot/slot.component.tsx";
import { InventoryGrid } from "./inventoryGrid/inventoryGrid.component.tsx";
import { TargetGrid } from "./targetGrid/targetGrid.component.tsx";
import { UpgradeButton } from "./upgradeButton/upgradeButton.component.tsx";
import { ChanceBadge } from "./chanceBadge/chanceBadge.component.tsx";
import { useUpgradeData } from "../../hooks/useUpgradeData.hooks.ts";
import { useWheelAnimation } from "../../hooks/useWheelAnimation.hooks.ts";
import { useItemSelection } from "../../hooks/useItemSelection.hooks.ts";

const safeNumber = (v: any): number => {
    const n = parseFloat(String(v ?? 0));
    return isNaN(n) ? 0 : n;
};

export const UpgradeComponent = () => {
    const isAuth = !!localStorage.getItem("access");
    const { user, inventory, targetItems, loading, fetchAll, fetchTargets, updateBalance } = useUpgradeData(isAuth);
    const { selectedItem, selectedTarget, balanceAdd, itemPrice, targetPrice, chance, selectItem, setSelectedTarget, clearSelection } = useItemSelection(inventory, targetItems, fetchTargets);

    const [spinning, setSpinning] = useState(false);
    const [needleDeg, setNeedleDeg] = useState(0);
    const [spinResult, setSpinResult] = useState<"win" | "lose" | null>(null);
    const frozenChance = useState(0)[0]; // В реальном коде нужно использовать useRef

    const { animateNeedle, resetNeedle } = useWheelAnimation(setNeedleDeg, () => {});

    const handleUpgrade = async () => {
        if (!selectedItem || !selectedTarget || spinning || chance <= 0) return;

        setSpinning(true);
        setSpinResult(null);

        try {
            const { data } = await api.post("/upgrade/perform/", {
                item_id: selectedItem.id,
                target_item_id: selectedTarget.id,
                balance_amount: balanceAdd,
            });

            const isWin = data.success;
            const winDeg = (chance / 100) * 360;
            let stopAngle: number;

            if (isWin) {
                const margin = Math.min(8, winDeg * 0.12);
                stopAngle = margin + Math.random() * (winDeg - margin * 2);
            } else {
                const margin = Math.min(8, (360 - winDeg) * 0.1);
                stopAngle = winDeg + margin + Math.random() * (360 - winDeg - margin * 2);
            }

            if (data.new_balance) {
                updateBalance(data.new_balance);
            }

            animateNeedle(stopAngle, async () => {
                setSpinResult(isWin ? "win" : "lose");
                setTimeout(async () => {
                    setSpinning(false);
                    await fetchAll();
                    clearSelection();
                }, 700);
            });

        } catch (e: any) {
            setSpinning(false);
            alert(e.response?.data?.error || "Ошибка при апгрейде");
        }
    };

    if (!isAuth) {
        return (
            <div className={styles.auth_wall}>
                <p>Войдите, чтобы использовать апгрейд</p>
                <button className={styles.auth_btn} onClick={() => window.location.href = "/login"}>Войти</button>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.arena}>
                <Slot
                    label="Ваш предмет"
                    item={selectedItem}
                    result={spinResult}
                    spinning={spinning}
                    emptyIcon={
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                            <rect x="2" y="7" width="20" height="14" rx="2"/>
                            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                        </svg>
                    }
                    emptyText="Выберите предмет снизу"
                    onRemove={clearSelection}
                />

                <div className={styles.wheel_wrap}>
                    <Wheel chance={chance} needleDeg={needleDeg} spinning={spinning} result={spinResult} />
                    <ChanceBadge chance={chance} spinning={spinning} result={spinResult} hasItems={!!selectedItem && !!selectedTarget} />
                    <UpgradeButton selectedItem={selectedItem} selectedTarget={selectedTarget} chance={chance} spinning={spinning} onClick={handleUpgrade} />
                </div>

                <Slot
                    label="Цель апгрейда"
                    item={selectedTarget}
                    result={spinResult}
                    spinning={spinning}
                    emptyIcon={
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    }
                    emptyText="Выберите цель справа"
                    onRemove={() => setSelectedTarget(null)}
                />
            </div>

            <div className={styles.bottom}>
                <div className={styles.panel}>
                    <div className={styles.panel__header}>
                        <span className={styles.panel__title}>Мой инвентарь</span>
                        <span className={styles.panel__count}>{inventory.length}</span>
                    </div>
                    <div className={styles.inv_grid}>
                        <InventoryGrid inventory={inventory} loading={loading} selectedItem={selectedItem} onSelectItem={selectItem} />
                    </div>
                </div>

                <div className={styles.panel}>
                    <div className={styles.panel__header}>
                        <span className={styles.panel__title}>Целевые предметы</span>
                    </div>
                    <TargetGrid
                        targets={targetItems}
                        loading={loading}
                        selectedItem={selectedItem}
                        selectedTarget={selectedTarget}
                        itemPrice={safeNumber(selectedItem?.price)}
                        onSelectTarget={setSelectedTarget}
                    />
                </div>
            </div>
        </div>
    );
};

export default UpgradeComponent;