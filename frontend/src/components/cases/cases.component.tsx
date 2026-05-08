import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { Case } from '../../types/types.ts';
import { Link } from 'react-router-dom';
import styles from './cases.component.module.scss';

const Cases: React.FC = () => {
    const [cases, setCases] = useState<Case[]>([]);
    const [collapsed, setCollapsed] = useState<string[]>([]);

    useEffect(() => {
        api.get<Case[]>('cases/').then(res => {
            setCases(res.data);
        });
    }, []);

    const toggleCategory = (category: string) => {
        setCollapsed(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const categories = {
        cheap: {
            title: 'Бюджетные',
            items: cases.filter(c => c.category === 'cheap')
        },
        middle: {
            title: 'Средние',
            items: cases.filter(c => c.category === 'middle')
        },
        expensive: {
            title: 'Премиум',
            items: cases.filter(c => c.category === 'expensive')
        },
    };

    return (
        <div className={styles.case_list}>
            {Object.entries(categories).map(([key, group]) => (
                group.items.length > 0 && (
                    <div
                        key={key}
                        className={styles.case_list__section}
                    >
                        <div
                            className={`${styles.case_list__header} ${
                                collapsed.includes(key)
                                    ? styles['case_list__header--collapsed']
                                    : ''
                            }`}
                        >
                            <img
                                src="https://mycsgoo.cc/public/video/blue_header.webp?v=2"
                                className={styles.case_list__header_video}
                                alt=""
                            />

                            <div className={styles.case_list__box}>
                                <h2 className={styles.case_list__box_title}>
                                    {group.title}
                                </h2>
                            </div>

                            <button
                                className={styles.case_list__header_button}
                                onClick={() => toggleCategory(key)}
                            >
                                {collapsed.includes(key)
                                    ? 'Развернуть'
                                    : 'Свернуть'}

                                <img
                                    src="/icons/up.svg"
                                    alt="arrow"
                                    className={`${styles.case_list__header_img} ${
                                        collapsed.includes(key)
                                            ? styles['case_list__header_img--rotated']
                                            : ''
                                    }`}
                                />
                            </button>
                        </div>

                        {!collapsed.includes(key) && (
                            <div className={styles.case_list__container}>
                                {group.items.map(c => (
                                    <Link
                                        key={c.id}
                                        to={`/case/${c.id}`}
                                        className={styles.case_card_link}
                                    >
                                        <div className={styles.case_card}>
                                            <img
                                                src={c.image_url}
                                                alt={c.name}
                                            />
                                            <span>{c.price} ₽</span>
                                            <p>{c.name}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )
            ))}
        </div>
    );
};

export default Cases;