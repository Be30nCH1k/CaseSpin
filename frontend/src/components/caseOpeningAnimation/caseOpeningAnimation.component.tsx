import { useState } from 'react';
import cn from 'classnames';
import styles from './caseOpeningAnimation.component.module.scss';
import api from '../../api/api';

const ITEM_WIDTH = 200;
const CONTAINER_WIDTH = 1100;
const WINNER_INDEX = 20;

type Props = {
    caseId: number;
    isOpening: boolean;
    setIsOpening: React.Dispatch<React.SetStateAction<boolean>>;
};

const CaseOpening = ({
    caseId,
    isOpening,
    setIsOpening
}: Props) => {
    const [carouselItems, setCarouselItems] = useState<any[]>([]);
    const [translateX, setTranslateX] = useState(0);

    const [selectedMultiplier, setSelectedMultiplier] = useState(1);
    const [isAutoMode, setIsAutoMode] = useState(false);

    const [wonItems, setWonItems] = useState<any[]>([]);

    const handleOpenCase = async () => {
        if (isOpening) return;

        try {
            setIsOpening(true);
            setWonItems([]);

            const droppedItems = [];

            for (let i = 0; i < selectedMultiplier; i++) {
                const response = await api.post(
                    `cases/${caseId}/spin/`
                );

                droppedItems.push(response.data.won_item);
            }

            const droppedItem = droppedItems[0];

            const caseResponse = await api.get(`cases/${caseId}/`);
            const realItems = caseResponse.data.items.map((el: any) => ({
                ...el.item
            }));

            const totalItems = 40;

            const generatedItems = Array.from(
                { length: totalItems },
                (_, i) => {
                    const randomItem =
                        realItems[
                            Math.floor(
                                Math.random() * realItems.length
                            )
                        ];

                    return {
                        ...randomItem,
                        id: i
                    };
                }
            );

            generatedItems[WINNER_INDEX] = {
                ...droppedItem,
                id: WINNER_INDEX
            };

            setCarouselItems(generatedItems);

            const finalTranslate =
                WINNER_INDEX * ITEM_WIDTH -
                CONTAINER_WIDTH / 2 +
                ITEM_WIDTH / 2;

            setTranslateX(0);

            setTimeout(() => {
                setTranslateX(finalTranslate);
            }, 100);

            setTimeout(() => {
                setWonItems(droppedItems);
                setIsOpening(false);
            }, 5200);

        } catch (error: any) {
            console.log(error);
            setIsOpening(false);
        }
    };

    const handleRepeatOpen = () => {
        setWonItems([]);
        setCarouselItems([]);
        setTranslateX(0);
        setIsOpening(false);
    };

    const handleAutoToggle = () => {
        setIsAutoMode(!isAutoMode);
    };

    return (
        <div className={cn(styles.case_open)}>

            {!isOpening && wonItems.length === 0 && (
                <>
                    <div className={cn(styles.fast_controls)}>

                        <button
                            className={cn(
                                styles.auto_btn,
                                isAutoMode && styles.active
                            )}
                            onClick={handleAutoToggle}
                        >
                            ▶
                        </button>

                        <div className={cn(styles.multi_controls)}>
                            {[1, 2, 5, 10].map((multi) => (
                                <button
                                    key={multi}
                                    className={cn(
                                        styles.multi_btn,
                                        selectedMultiplier === multi &&
                                            styles.active
                                    )}
                                    onClick={() =>
                                        setSelectedMultiplier(multi)
                                    }
                                >
                                    x{multi}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        className={cn(styles.open_button)}
                        onClick={handleOpenCase}
                    >
                        Открыть кейс
                    </button>
                </>
            )}

            {isOpening && (
                <div className={cn(styles.roulette_container)}>
                    <div className={cn(styles.pointer)} />

                    <div
                        className={cn(styles.roulette_track)}
                        style={{
                            transform: `translateX(-${translateX}px)`
                        }}
                    >
                        {carouselItems.map((item, index) => (
                            <div
                                key={index}
                                className={cn(styles.roulette_item)}
                            >
                                <img
                                    src={item.image_url}
                                    alt={item.weapon_name}
                                />

                                <span>{item.weapon_name}</span>
                                <span>{item.skin_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

{wonItems.length > 0 && !isOpening && (
    <div className={cn(styles.multi_drop_result)}>
        <h2 className={cn(styles.result_title)}>
            Вы выиграли
        </h2>

        <div
            className={cn(
                styles.multi_drop_grid,
                wonItems.length >= 10 && styles.ten_items,
                wonItems.length === 5 && styles.five_items
            )}
        >
        {wonItems.map((item, index) => (
                <div
                    key={index}
                    className={cn(styles.drop_card)}
                >
                        <div className={cn(styles.drop_hex)} />

                            <img
                                src={item.image_url}
                                alt={item.weapon_name}
                                className={cn(styles.drop_card_image)}
                            />

                            <h3 className={cn(styles.drop_card_title)}>
                                {item.weapon_name}
                            </h3>

                            <p className={cn(styles.drop_card_subtitle)}>
                                {item.skin_name}
                            </p>

                            <div className={cn(styles.drop_card_actions)}>
                                <button className={cn(styles.price_btn)}>
                                    {item.price} ₽
                                </button>

                                <button className={cn(styles.icon_btn)}>
                                    ⊙
                                </button>

                                <button className={cn(styles.icon_btn)}>
                                    ⇈
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={cn(styles.bottom_actions)}>
                    <button
                        className={cn(styles.action_btn)}
                        onClick={handleRepeatOpen}
                    >
                        Повторить
                    </button>

                    <button className={cn(styles.sell_btn)}>
                        Обменять
                    </button>

                    <button className={cn(styles.action_btn)}>
                        В контракт
                    </button>
                </div>
            </div>
        )}

        </div>
    );
};

export default CaseOpening;