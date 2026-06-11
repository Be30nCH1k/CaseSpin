import { useState } from "react";

import styles from "./inventory.component.module.scss";

import { useInventory,safePrice } from "../../hooks/useInventory.hooks.ts";
import { InventoryProfile } from "./profile/profile.component.tsx";
import { InventoryToolbar } from "../ui/toolbar/toolbar.ui.tsx";
import { InventoryCard } from "./card/card.component.tsx";
import { InventoryLoader } from "../ui/loader/loader.ui.tsx";
import { InventoryEmpty } from "./empty/empty.component.tsx";
import { LoadMore } from "../ui/loadMore/loadMore.ui.tsx";

export const InventoryComponent = () => {
    const {
        user,
        drops,
        loading,
        selling,
        sellOne,
        sellAll,
    } = useInventory();

    const [visibleCount, setVisibleCount] = useState(16);
    const [showUnsoldOnly, setShowUnsoldOnly] = useState(false);

    const unsoldDrops = drops.filter(d => !d.is_sold);

    const unsoldTotal = unsoldDrops.reduce(
        (sum, d) => sum + safePrice(d.item.price),
        0
    );

    const filteredDrops = showUnsoldOnly
        ? unsoldDrops
        : drops;

    const visibleDrops = filteredDrops.slice(0, visibleCount);

    return (
        <div className={styles.page}>
            {user && (
                <InventoryProfile
                    user={user}
                    dropsCount={drops.length}
                    unsoldCount={unsoldDrops.length}
                    unsoldTotal={unsoldTotal}
                />
            )}

            <InventoryToolbar
                total={drops.length}
                unsoldCount={unsoldDrops.length}
                unsoldTotal={unsoldTotal}
                showUnsoldOnly={showUnsoldOnly}
                onToggleFilter={() => {
                    setShowUnsoldOnly(v => !v);
                    setVisibleCount(16);
                }}
                onSellAll={sellAll}
            />

            {loading ? (
                <InventoryLoader />
            ) : visibleDrops.length === 0 ? (
                <InventoryEmpty />
            ) : (
                <>
                    <div className={styles.grid}>
                        {visibleDrops.map(drop => (
                            <InventoryCard
                                key={drop.id}
                                drop={drop}
                                isSelling={selling.has(drop.id)}
                                onSell={sellOne}
                            />
                        ))}
                    </div>

                    {visibleCount < filteredDrops.length && (
                        <LoadMore
                            count={filteredDrops.length - visibleCount}
                            onClick={() =>
                                setVisibleCount(v => v + 8)
                            }
                        />
                    )}
                </>
            )}
        </div>
    );
};