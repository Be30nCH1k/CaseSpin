import { useEffect, useState, useMemo, useRef } from 'react';
import api from '../api/api';
import { Case } from '../types/types';

export const useCasesHooks = () => {
    const [cases,     setCases]     = useState<Case[]>([]);
    const [priceFrom, setPriceFrom] = useState('');
    const [priceTo,   setPriceTo]   = useState('');
    const [search,    setSearch]    = useState('');
    const [dropOpen,  setDropOpen]  = useState(false);
    const [collapsed, setCollapsed] = useState<string[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.get<Case[]>('cases/').then(res => setCases(res.data));
    }, []);

    // Закрываем дропдаун при клике вне поиска
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node))
                setDropOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleCategory = (key: string) =>
        setCollapsed(prev =>
            prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
        );

    // Фильтр по цене + сортировка от мин до макс
    const filterAndSort = (items: Case[]) =>
        items
            .filter(c => {
                const p = parseFloat(String(c.price ?? 0));
                const okFrom = priceFrom === '' || p >= parseFloat(priceFrom);
                const okTo   = priceTo   === '' || p <= parseFloat(priceTo);
                return okFrom && okTo;
            })
            .sort((a, b) => parseFloat(String(a.price)) - parseFloat(String(b.price)));

    const categories = useMemo(() => ({
        cheap:     { title: 'Бюджетные', items: filterAndSort(cases.filter(c => c.category === 'cheap')) },
        middle:    { title: 'Средние',   items: filterAndSort(cases.filter(c => c.category === 'middle')) },
        expensive: { title: 'Премиум',   items: filterAndSort(cases.filter(c => c.category === 'expensive')) },
    }), [cases, priceFrom, priceTo]);

    // Совпадения для дропдауна, макс 8
    const suggestions = useMemo(() =>
            search.trim()
                ? cases.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
                : []
        , [cases, search]);

    const clearFilters = () => { setSearch(''); setPriceFrom(''); setPriceTo(''); };

    const isFiltering = priceFrom !== '' || priceTo !== '' || search !== '';

    return {
        categories, suggestions, collapsed, toggleCategory,
        search, setSearch, priceFrom, setPriceFrom,
        priceTo, setPriceTo, dropOpen, setDropOpen,
        isFiltering, clearFilters, searchRef,
    };
};