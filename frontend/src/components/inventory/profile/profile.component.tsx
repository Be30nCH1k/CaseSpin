import {TopDrop} from "../topDrop/topDrop.component.tsx";
import styles from "./profile.component.module.scss";

import type { UserInfo } from "../../../types/types";

type Props = {
    user: UserInfo;
    dropsCount: number;
    unsoldCount: number;
    unsoldTotal: number;
};

export const InventoryProfile = ({
                                     user,
                                     dropsCount,
                                     unsoldCount,
                                     unsoldTotal,
                                 }: Props) => {
    return (
        <div className={styles.profile}>
            <div className={styles.left}>
                <img
                    src={user.avatar_url}
                    alt={user.username}
                    className={styles.avatar}
                />

                <div className={styles.info}>
                    <p className={styles.name}>
                        {user.username}
                    </p>

                    <p className={styles.balance}>
                        Баланс:
                        <span>
              {Number(user.balance).toFixed(2)} ₽
            </span>
                    </p>

                    <p className={styles.stats}>
                        Всего дропов:
                        <span>{dropsCount}</span>
                        · В инвентаре:
                        <span>{unsoldCount}</span>
                        · Стоимость:
                        <span>
              {unsoldTotal.toFixed(2)} ₽
            </span>
                    </p>
                </div>
            </div>

            <TopDrop drop={user.best_drop} />
        </div>
    );
};