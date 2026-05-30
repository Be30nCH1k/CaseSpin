import styles from "./contract.component.module.scss";
import { useContractHooks } from "../../hooks/useContract.hooks.ts";
import { ContractSlots } from "./contractSlots/contractSlots.component";
import { ContractInventory } from "./contractInventory/contractInventory.component";
import { ContractResultModal } from "./contractResult/contractResult.component";

export const ContractComponent = () => {
    const {
        inventory, selected, loading, rolling,
        result, showResult, setShowResult,
        toggleSelect, isSelected,
        totalPrice, canRoll, minPossible, maxPossible,
        handleContract,
    } = useContractHooks();

    return (
        <div className={styles.page}>
            <ContractSlots
                selected={selected}
                rolling={rolling}
                totalPrice={totalPrice}
                minPossible={minPossible}
                maxPossible={maxPossible}
                canRoll={canRoll}
                onToggle={toggleSelect}
                onRoll={handleContract}
            />

            <ContractInventory
                inventory={inventory}
                selected={selected}
                loading={loading}
                onToggle={toggleSelect}
                isSelected={isSelected}
            />

            {showResult && result && (
                <ContractResultModal
                    result={result}
                    onClose={() => setShowResult(false)}
                />
            )}
        </div>
    );
};

export default ContractComponent;