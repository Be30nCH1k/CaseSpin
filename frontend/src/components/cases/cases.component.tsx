import React, { useEffect, useState, useMemo, useRef } from 'react';
import api from '../../api/api';
import { Case } from '../../types/types.ts';
import { Link } from 'react-router-dom';
import styles from './cases.component.module.scss';

const Cases: React.FC = () => {
    const [cases,     setCases]     = useState<Case[]>([]);
    const [collapsed, setCollapsed] = useState<string[]>([]);
    const [search,    setSearch]    = useState('');
    const [priceFrom, setPriceFrom] = useState('');
    const [priceTo,   setPriceTo]   = useState('');
    const [dropOpen,  setDropOpen]  = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.get<Case[]>('cases/').then(res => setCases(res.data));
    }, []);

    // Закрыть дропдаун при клике вне
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setDropOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleCategory = (category: string) => {
        setCollapsed(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    // Совпадения для дропдауна (макс 8)
    const searchSuggestions = useMemo(() => {
        if (!search.trim()) return [];
        return cases
            .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            .slice(0, 8);
    }, [cases, search]);

    const filterAndSort = (items: Case[]) =>
        items
            .filter(c => {
                const price = parseFloat(String(c.price ?? 0));
                const matchFrom = priceFrom === '' || price >= parseFloat(priceFrom);
                const matchTo   = priceTo   === '' || price <= parseFloat(priceTo);
                return matchFrom && matchTo;
            })
            .sort((a, b) =>
                parseFloat(String(a.price ?? 0)) - parseFloat(String(b.price ?? 0))
            );

    const categories = useMemo(() => ({
        cheap:     { title: 'Бюджетные', items: filterAndSort(cases.filter(c => c.category === 'cheap')) },
        middle:    { title: 'Средние',   items: filterAndSort(cases.filter(c => c.category === 'middle')) },
        expensive: { title: 'Премиум',   items: filterAndSort(cases.filter(c => c.category === 'expensive')) },
    }), [cases, priceFrom, priceTo]);

    const isFiltering = priceFrom !== '' || priceTo !== '';

    const clearFilters = () => {
        setSearch('');
        setPriceFrom('');
        setPriceTo('');
    };

    // Подсветка совпавшей части
    const highlight = (name: string, query: string) => {
        if (!query) return <>{name}</>;
        const idx = name.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return <>{name}</>;
        return <>
            {name.slice(0, idx)}
            <mark>{name.slice(idx, idx + query.length)}</mark>
            {name.slice(idx + query.length)}
        </>;
    };

    const scrollToCase = (id: number) => {
        const el = document.getElementById(`case-card-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add(styles.case_card__highlight);
            setTimeout(() => el.classList.remove(styles.case_card__highlight), 1800);
        }
        setSearch('');
        setDropOpen(false);
    };

    return (
        <div className={styles.case_list}>

            {/* ── Панель фильтров ── */}
            <div className={styles.filters}>

                {/* Поиск с дропдауном */}
                <div className={styles.filters__search_wrap} ref={searchRef}>
                    <svg className={styles.filters__search_icon} width="15" height="15"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        className={styles.filters__search}
                        type="text"
                        placeholder="Поиск по названию..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setDropOpen(true); }}
                        onFocus={() => search && setDropOpen(true)}
                    />
                    {search && (
                        <button className={styles.filters__clear_input}
                                onClick={() => { setSearch(''); setDropOpen(false); }}>✕</button>
                    )}

                    {/* Дропдаун */}
                    {dropOpen && searchSuggestions.length > 0 && (
                        <div className={styles.search_dropdown}>
                            {searchSuggestions.map(c => (
                                <button
                                    key={c.id}
                                    className={styles.search_dropdown__item}
                                    onClick={() => scrollToCase(c.id)}
                                >
                                    <img
                                        src={c.image_url}
                                        alt={c.name}
                                        className={styles.search_dropdown__img}
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <span className={styles.search_dropdown__name}>
                                        {highlight(c.name, search)}
                                    </span>
                                    <span className={styles.search_dropdown__price}>
                                        {c.price} ₽
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Нет совпадений */}
                    {dropOpen && search.trim() && searchSuggestions.length === 0 && (
                        <div className={styles.search_dropdown}>
                            <div className={styles.search_dropdown__empty}>Ничего не найдено</div>
                        </div>
                    )}
                </div>

                {/* Фильтр по цене */}
                <div className={styles.filters__price}>
                    <input
                        className={styles.filters__price_input}
                        type="number"
                        placeholder="от ₽"
                        value={priceFrom}
                        onChange={e => setPriceFrom(e.target.value)}
                        min={0}
                    />
                    <span className={styles.filters__price_sep}>—</span>
                    <input
                        className={styles.filters__price_input}
                        type="number"
                        placeholder="до ₽"
                        value={priceTo}
                        onChange={e => setPriceTo(e.target.value)}
                        min={0}
                    />
                </div>

                {(isFiltering || search) && (
                    <button className={styles.filters__reset} onClick={clearFilters}>
                        Сбросить
                    </button>
                )}
            </div>

            {/* ── Категории (кейсы не убираются из списка) ── */}
            {Object.entries(categories).map(([key, group]) => (
                group.items.length > 0 && (
                    <div key={key} className={styles.case_list__section}>
                        <div className={`${styles.case_list__header} ${
                            collapsed.includes(key) ? styles['case_list__header--collapsed'] : ''
                        }`}>
                            <img
                                src="https://mycsgoo.cc/public/video/blue_header.webp?v=2"
                                className={styles.case_list__header_video}
                                alt=""
                            />
                            <div className={styles.case_list__box}>
                                <h2 className={styles.case_list__box_title}>{group.title}</h2>
                            </div>
                            <button
                                className={styles.case_list__header_button}
                                onClick={() => toggleCategory(key)}
                            >
                                {collapsed.includes(key) ? 'Развернуть' : 'Свернуть'}
                                <img
                                    src="/icons/up.svg"
                                    alt="arrow"
                                    className={`${styles.case_list__header_img} ${
                                        collapsed.includes(key) ? styles['case_list__header_img--rotated'] : ''
                                    }`}
                                />
                            </button>
                        </div>

                        {!collapsed.includes(key) && (
                            <div className={styles.case_list__container}>
                                {group.items.map(c => (
                                    <Link key={c.id} to={`/case/${c.id}`}
                                          className={styles.case_card_link}
                                          id={`case-card-${c.id}`}>
                                        <div className={styles.case_card}>
                                            <img src={c.image_url} alt={c.name}/>
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