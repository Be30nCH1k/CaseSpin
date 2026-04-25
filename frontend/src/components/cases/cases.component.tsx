import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { Case } from '../../types/types.ts';
import { Link } from 'react-router-dom';
import './cases.component.module.scss';

const Cases: React.FC = () => {
    const [cases, setCases] = useState<Case[]>([]);
    const [collapsed, setCollapsed] = useState<string[]>([]);

    useEffect(() => {
        api.get<Case[]>('cases/').then(res => {
            setCases(res.data);
        });
    }, []);

    // переключение видимости
    const toggleCategory = (category: string) => {
        setCollapsed(prev => 
            prev.includes(category) 
                ? prev.filter(c => c !== category) 
                : [...prev, category]
        );
    };

    const categories = {
        cheap: { title: 'Бюджетные', items: cases.filter(c => c.category === 'cheap') },
        middle: { title: 'Средние', items: cases.filter(c => c.category === 'middle') },
        expensive: { title: 'Премиум', items: cases.filter(c => c.category === 'expensive') },
    };

    return (
        <div className="case_list">
            {Object.entries(categories).map(([key, group]) => (
                group.items.length > 0 && (
                    <div key={key} className="case_list__section">
                        <div className="case_list__header">
                            <div className="case_list__box">
                                <h2 className="case_list__box_title">{group.title}</h2>
                                <div className="case_list__box_line"></div>
                            </div>

                            <button 
                                className="case_list__header_button"
                                onClick={() => toggleCategory(key)}
                            >
                                {collapsed.includes(key) ? 'Развернуть' : 'Свернуть'}
                                <img 
                                    src="/icons/up.svg" 
                                    className={`case_list__header_img ${collapsed.includes(key) ? 'case_list__header_img--rotated' : ''}`} 
                                    alt="arrow"
                                />
                            </button>
                        </div>

                        {!collapsed.includes(key) && (
                            <div className="case_list__container">
                                {group.items.map(c => (
                                    <Link to={`/case/${c.id}`} key={c.id} className="case_card_link">
                                        <div className="case_card">
                                            <img src={c.image_url} alt={c.name} />
                                            <p>{c.name}</p>
                                            <span>{c.price} ₽</span>
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