import { useState, useEffect } from 'react';
import type { CaseReward } from '../types/ICase.types.ts';

const API_URL = 'https://690ed6c3bd0fefc30a05a6a4.mockapi.io/items';

interface ApiItem {
    name: string;
    image_url: string;
    price_rub: number;
    rarity: string;
    has_stattrak: boolean;
}

export const useApi = () => {
    const [rewards, setRewards] = useState<CaseReward[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRewards = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiItem[] = await response.json();

            // Трансформируем данные из API
            const transformedRewards: CaseReward[] = data.map((apiItem: ApiItem, index: number) => {
                const mappedRarity = mapRarity(apiItem.rarity);
                const chance = calculateChance(apiItem.rarity);

                console.log(`Трансформация: ${apiItem.name}`, {
                    originalRarity: apiItem.rarity,
                    mappedRarity: mappedRarity,
                    chance: chance
                });

                return {
                    id: index + 1,
                    name: apiItem.name,
                    image: apiItem.image_url,
                    rarity: mappedRarity,
                    chance: chance,
                    price: Math.round(apiItem.price_rub),
                    hasStattrak: apiItem.has_stattrak
                };
            });

            setRewards(transformedRewards);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch rewards');
            console.error('API Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Функция для маппинга редкостей
    const mapRarity = (rarity: string): CaseReward['rarity'] => {
        const rarityMap: Record<string, CaseReward['rarity']> = {
            'covert': 'legendary',      // Covert -> Легендарные (красные)
            'classified': 'epic',       // Classified -> Эпические (фиолетовые)
            'restricted': 'rare',       // Restricted -> Редкие (синие)
        };

        const lowerCaseRarity = rarity.toLowerCase();
        const mapped = rarityMap[lowerCaseRarity];

        console.log(`Маппинг редкости: ${rarity} -> ${mapped || 'common'}`);

        return mapped || 'common';
    };

    // Функция для расчета шансов на основе редкости
    const calculateChance = (rarity: string): number => {
        const chanceMap: Record<string, number> = {
            'covert': 0.0025,      // 0.25% для Covert
            'classified': 0.0065,  // 0.65% для Classified
            'restricted': 0.032,   // 3.2% для Restricted
        };

        const lowerCaseRarity = rarity.toLowerCase();
        return chanceMap[lowerCaseRarity] || 0.1;
    };

    useEffect(() => {
        fetchRewards();
    }, []);

    return {
        rewards,
        loading,
        error,
        refetch: fetchRewards
    };
};