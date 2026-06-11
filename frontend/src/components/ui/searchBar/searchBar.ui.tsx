import React from 'react';
import { Case } from '../../../types/types.ts';
import styles from './searchBar.ui.module.scss';

const highlight = (name: string, query: string) => {
    const idx = name.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1 || !query) return <>{name}</>;
    return <>
        {name.slice(0, idx)}
        <mark>{name.slice(idx, idx + query.length)}</mark>
        {name.slice(idx + query.length)}
    </>;
};

type Props = {
    search:       string;
    dropOpen:     boolean;
    suggestions:  Case[];
    searchRef:    React.RefObject<HTMLDivElement>;
    onSearch:     (v: string) => void;
    onDropOpen:   (v: boolean) => void;
    onSelectCase: (id: number) => void;
};

export const SearchBar: React.FC<Props> = ({
                                               search, dropOpen, suggestions, searchRef,
                                               onSearch, onDropOpen, onSelectCase,
                                           }) => (
    <div className={styles.wrap} ref={searchRef}>
        <svg className={styles.icon} width="15" height="15"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>

        <input
            className={styles.input}
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={e => { onSearch(e.target.value); onDropOpen(true); }}
            onFocus={() => search && onDropOpen(true)}
        />

        {search && (
            <button
                className={styles.clear_btn}
                onClick={() => { onSearch(''); onDropOpen(false); }}
            >✕</button>
        )}

        {dropOpen && (
            <div className={styles.dropdown}>
                {suggestions.length > 0 ? suggestions.map(c => (
                    <button
                        key={c.id}
                        className={styles.dropdown__item}
                        onClick={() => onSelectCase(c.id)}
                    >
                        <img
                            src={c.image_url}
                            alt={c.name}
                            className={styles.dropdown__img}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className={styles.dropdown__name}>
                            {highlight(c.name, search)}
                        </span>
                        <span className={styles.dropdown__price}>{c.price} ₽</span>
                    </button>
                )) : (
                    <div className={styles.dropdown__empty}>Ничего не найдено</div>
                )}
            </div>
        )}
    </div>
);