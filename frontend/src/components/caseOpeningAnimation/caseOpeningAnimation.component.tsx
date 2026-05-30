import { useState } from 'react'
import styles from './caseOpeningAnimation.component.module.scss'
import { useCaseOpening, safePrice } from '../../hooks/useOpening.hooks.ts'
import { MultiplierControls }  from '../ui/multiplierControls/multiplierControls.component'
import { HorizontalRoulette }  from './horizontalRoulette/horizontalRoulette.component'
import { VerticalSlots }       from './verticalSlots/verticalSlots.component'
import { WonItemsResult }      from './wonItemsResult/wonItemsResult.component'

type Props = {
    caseId:        number
    casePrice:     number
    isOpening:     boolean
    setIsOpening:  React.Dispatch<React.SetStateAction<boolean>>
    showResult:    boolean
    setShowResult: React.Dispatch<React.SetStateAction<boolean>>
}

const CaseOpening = ({ caseId, casePrice, isOpening, setIsOpening, showResult, setShowResult }: Props) => {
    const [multiplier, setMultiplier] = useState(1)
    const [fastMode,   setFastMode]   = useState(false)

    const {
        slots, animating, doneFlags, wonItems,
        soldIds, sellingOne, sellingAll,
        isVertical, unsoldTotal, allSold,
        handleOpen, handleSellOne, handleSellAll, handleRepeat,
    } = useCaseOpening({ caseId, isOpening, setIsOpening, setShowResult, fastMode, multiplier })

    // считаю стоимость открытия с учётом множителя
    const openCost = (safePrice(casePrice) * multiplier).toFixed(2)

    return (
        <div className={styles.case_open}>

            {!isOpening && !showResult && (
                <>
                    <MultiplierControls
                        multiplier={multiplier}
                        fastMode={fastMode}
                        onMultiplier={setMultiplier}
                        onFastToggle={() => setFastMode(f => !f)}
                    />
                    <button className={styles.open_button} onClick={handleOpen}>
                        Открыть кейс за <span className={styles.open_price}>{openCost} ₽</span>
                    </button>
                </>
            )}

            {isOpening && slots.length > 0 && (
                isVertical
                    ? <VerticalSlots   slots={slots} animating={animating} doneFlags={doneFlags} count={multiplier}/>
                    : <HorizontalRoulette slots={slots} animating={animating} doneFlags={doneFlags}/>
            )}

            {showResult && wonItems.length > 0 && (
                <WonItemsResult
                    wonItems={wonItems}
                    soldIds={soldIds}
                    sellingOne={sellingOne}
                    sellingAll={sellingAll}
                    allSold={allSold}
                    unsoldTotal={unsoldTotal}
                    multiplier={multiplier}
                    onSellOne={handleSellOne}
                    onSellAll={handleSellAll}
                    onRepeat={handleRepeat}
                />
            )}
        </div>
    )
}

export default CaseOpening