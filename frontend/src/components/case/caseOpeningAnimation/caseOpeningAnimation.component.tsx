import React, { useState } from 'react';
import cn from 'classnames';
import styles from './caseOpeningAnimation.component.module.scss';
import api from '../../../api/api';

const CaseOpening = ({ caseId }: { caseId: number }) => {
    const [isOpening, setIsOpening] = useState(false);
    const [wonItem, setWonItem] = useState<any>(null);
    const [carouselItems, setCarouselItems] = useState<any[]>([]);

    const handleOpenCase = async () => {
        if (isOpening) return;

        try {
            setIsOpening(true);
            setWonItem(null);

            const response = await api.post(`cases/${caseId}/spin/`);
            const droppedItem = response.data.won_item;

            const fakeItems = Array.from({ length: 30 }, (_, i) => ({
                id: i,
                weapon_name: 'Random Skin',
                skin_name: `Preview ${i + 1}`,
                image_url: droppedItem.image_url,
                price: Math.floor(Math.random() * 500),
            }));

            const finalItems = [...fakeItems];
            finalItems[24] = droppedItem;

            setCarouselItems(finalItems);

            setTimeout(() => {
                setWonItem(droppedItem);
                setIsOpening(false);
            }, 5000);
        } catch (error) {
            console.log(error);
            setIsOpening(false);
        }
    };

    return (
        <div className={cn(styles['case_open'])}>
            <button
                className={cn(styles['open_button'])}
                onClick={handleOpenCase}
                disabled={isOpening}
            >
                {isOpening ? 'Открываем...' : 'Открыть кейс'}
            </button>

            {isOpening && (
                <div className={cn(styles['roulette_container'])}>
                    <div className={cn(styles['pointer'])}></div>

                    <div className={cn(styles['roulette_track'])}>
                        {carouselItems.map((item, index) => (
                            <div key={index} className={cn(styles['roulette_item'])}>
                                <img src={item.image_url} alt={item.weapon_name} />
                                <span>{item.weapon_name}</span>
                                <span>{item.skin_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {wonItem && (
                <div className={cn(styles['won_block'])}>
                    <h2>Вы выиграли:</h2>
                    <img src={wonItem.image_url} alt={wonItem.weapon_name} />
                    <h3>{wonItem.weapon_name}</h3>
                    <p>{wonItem.skin_name}</p>
                    <p>{wonItem.price} ₽</p>
                </div>
            )}
        </div>
    );
};

export default CaseOpening;