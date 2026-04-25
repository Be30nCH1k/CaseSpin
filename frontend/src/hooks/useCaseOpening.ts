import { useState, useCallback } from 'react';
import type { CaseReward, CaseOpeningState } from '../types/ICase.types.ts';

export const useCaseOpening = (availableRewards: CaseReward[]) => {
    const [openingState, setOpeningState] = useState<CaseOpeningState>({
        isOpening: false,
        animationPhase: 'initial',
        wonItem: null,
    });

    const startOpening = useCallback(() => {
        if (availableRewards.length === 0) return;

        // ВАЖНО: Выбираем случайный предмет ДО начала анимации
        const random = Math.random();
        let accumulatedChance = 0;
        let selectedItem: CaseReward | null = null;

        for (const reward of availableRewards) {
            accumulatedChance += reward.chance;
            if (random <= accumulatedChance) {
                selectedItem = reward;
                break;
            }
        }

        // Fallback
        if (!selectedItem) {
            selectedItem = availableRewards[Math.floor(Math.random() * availableRewards.length)];
        }

        console.log('Выпал предмет:', selectedItem.name); // Для дебага

        setOpeningState({
            isOpening: true,
            animationPhase: 'initial',
            wonItem: selectedItem, // Сохраняем выигранный предмет
        });

        // Анимационная последовательность
        setTimeout(() => setOpeningState(state => ({ ...state, animationPhase: 'spinning' })), 800);
        setTimeout(() => setOpeningState(state => ({ ...state, animationPhase: 'slowing' })), 1800);
        setTimeout(() => setOpeningState(state => ({ ...state, animationPhase: 'stopping' })), 4800);
        setTimeout(() => setOpeningState(state => ({ ...state, animationPhase: 'reveal' })), 6000);

    }, [availableRewards]);

    const resetOpening = useCallback(() => {
        setOpeningState({
            isOpening: false,
            animationPhase: 'initial',
            wonItem: null,
        });
    }, []);

    return {
        openingState,
        startOpening,
        resetOpening,
    };
};