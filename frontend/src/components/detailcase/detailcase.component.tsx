import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './detailcase.component.module.scss';
import api from '../../api/api';
import { Case } from '../../types/types.ts';
import CaseOpening from '../case/caseOpeningAnimation/caseOpeningAnimation.component.tsx';

export const CaseDetailComponent: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [currentCase, setCurrentCase] = useState<Case | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthorized(!!token);
    }, []);

    useEffect(() => {
        if (!id) return;

        const fetchCaseData = async () => {
            try {
                setLoading(true);

                const response = await api.get<Case>(`cases/${id}/`);

                const sortedData = {
                    ...response.data,
                    items: [...response.data.items].sort((a: any, b: any) => {
                        const priceA = parseFloat(a.item.price);
                        const priceB = parseFloat(b.item.price);

                        return priceB - priceA;
                    }),
                };

                setCurrentCase(sortedData);
                setError(null);
            } catch (err: any) {
                console.error(err);
                setError('Кейс не найден или ошибка сервера');
            } finally {
                setLoading(false);
            }
        };

        fetchCaseData();
    }, [id]);

    if (loading) {
        return <div className={styles.loader}>Загрузка кейса...</div>;
    }

    if (error || !currentCase) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles['case']}>
            <Link to="/" className={styles['case_back__button']}>
                ← Вернуться назад
            </Link>

            <div className={styles['case_detail']}>
                <h1 className={styles['case_title']}>
                    {currentCase.name}
                </h1>

                <div className={styles['case_image_container']}>
                    <div
                        className={styles['case_image_bg']}
                        style={{
                            backgroundImage: `url(${currentCase.image_url})`
                        }}
                    />

                    <img
                        src={currentCase.image_url}
                        alt={currentCase.name}
                        className={styles['case_image']}
                    />
                </div>

                <div className={styles['case_info']}>
                    {isAuthorized ? (
                        <CaseOpening caseId={Number(id)} />
                    ) : (
                        <Link
                            to="/login"
                            className={styles['login_button']}
                        >
                            Войти через Steam
                        </Link>
                    )}
                </div>

                <div className={styles['rewards_preview']}>
                    <h3>Содержимое кейса</h3>

                    <div className={styles['rewards_list']}>
                        {currentCase.items?.map((caseItem: any) => (
                            <div
                                key={`${caseItem.item.id}-${caseItem.item.price}`}
                                className={`${styles['reward_preview']} ${styles[`rarity_${caseItem.item.rarity}`]}`}
                            >
                                <div className={styles['reward_image_container']}>
                                    <img
                                        src={caseItem.item.image_url}
                                        alt={caseItem.item.weapon_name}
                                    />
                                </div>

                                <div className={styles['reward_preview_box']}>
                                    <span className={styles['reward_name']}>
                                        {caseItem.item.weapon_name}
                                    </span>

                                    <span className={styles['reward_name']}>
                                        {caseItem.item.skin_name}
                                    </span>

                                    <span className={styles['reward_price']}>
                                        {caseItem.item.price}₽
                                    </span>
                                </div>

                                <span className={styles['reward_chance']}>
                                    {caseItem.chance}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseDetailComponent;