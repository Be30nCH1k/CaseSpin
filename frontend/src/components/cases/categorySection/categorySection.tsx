import React from 'react';
import { Link } from 'react-router-dom';
import { Case } from '../../../types/types.ts';
import styles from './categorySection.component.module.scss';

type Props = {
    categoryKey: string;
    title:       string;
    items:       Case[];
    collapsed:   boolean;
    onToggle:    () => void;
};

export const CategorySection: React.FC<Props> = ({
                                                     categoryKey, title, items, collapsed, onToggle,
                                                 }) => (
    <div className={styles.section}>

        <div className={`${styles.header} ${collapsed ? styles['header--collapsed'] : ''}`}>
            <img
                src="https://mycsgoo.cc/public/video/blue_header.webp?v=2"
                className={styles.header_video}
                alt=""
            />

            <div className={styles.header_box}>
                <h2 className={styles.header_title}>{title}</h2>
            </div>

            <button className={styles.toggle_btn} onClick={onToggle}>
                {collapsed ? 'Развернуть' : 'Свернуть'}
                <img
                    src="/icons/up.svg"
                    alt="arrow"
                    className={`${styles.toggle_icon} ${collapsed ? styles['toggle_icon--rotated'] : ''}`}
                />
            </button>
        </div>

        {!collapsed && (
            <div className={styles.grid}>
                {items.map(c => (
                    <Link
                        key={c.id}
                        to={`/case/${c.id}`}
                        id={`case-card-${c.id}`}
                        className={styles.card_link}
                    >
                        <div className={styles.card}>
                            <img src={c.image_url} alt={c.name} />
                            <span>{c.price} ₽</span>
                            <p>{c.name}</p>
                        </div>
                    </Link>
                ))}
            </div>
        )}
    </div>
);