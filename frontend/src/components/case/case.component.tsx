import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/api';
import { Case, Item } from '../../types/types';

const CaseDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);

    useEffect(() => {
        api.get<Case>(`cases/${id}/`).then(res => setCaseData(res.data));
    }, [id]);

    const handleSpin = async () => {
        if (isSpinning) return;

        try {
            const res = await api.post(`cases/${id}/spin/`);
            const wonItem: Item = res.data.won_item;

            // Запуск анимации
            startAnimation(wonItem);

        } catch (err: any) {
            alert(err.response?.data?.error || "Ошибка");
        }
    };

    const startAnimation = (item: Item) => {
        setIsSpinning(true);
        // логика расчета transform
        // данные на каком предмете остановиться
        console.log("Выпал предмет:", item.name);

        setTimeout(() => setIsSpinning(false), 5000);
    };

    if (!caseData) return <div>Загрузка...</div>;

    return (
        <div className="case-container">
            <h1>{caseData.name}</h1>
            {/* рулетка */}
            <button onClick={handleSpin} disabled={isSpinning}>
                Открыть за {caseData.price} ₽
            </button>
        </div>
    );
};