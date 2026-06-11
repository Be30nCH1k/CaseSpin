import React, { useState, useEffect, useRef } from 'react'
import cn from 'classnames'
import styles from './promoBaner.ui.module.scss'

const PROMO_CODES = [
    {
        code: "НИКИТОС ДОДЕП",
        title: "Бонус 40% к пополнению",
        description: 'Используй промокод при пополнении и получи +40% к балансу',
        gradient: 'linear-gradient(135deg, #4f7cff 0%, #7c5cff 100%)',
    },
    {
        code: 'BONUS10',
        title: 'Бонус 10% к пополнению',
        description: 'Используй промокод при пополнении и получи +10% к балансу',
        gradient: 'linear-gradient(135deg, #4f7cff 0%, #7c5cff 100%)',
    },
    {
        code: 'CASESPIN',
        title: 'Бонус 15% на кейсы',
        description: 'Активируй промокод и получи дополнительные 15% при пополнении',
        gradient: 'linear-gradient(135deg, #7c5cff 0%, #ff5c9d 100%)',
    },
    {
        code: 'WELCOME',
        title: 'Приветственный бонус 20%',
        description: 'Максимальная выгода! Пополни баланс с бонусом 20%',
        gradient: 'linear-gradient(135deg, #2ecc71 0%, #4f7cff 100%)',
    },
]

const STORAGE_KEY = 'promo_banner_state'
const ROTATION_INTERVAL = 5 * 60 * 1000 // 5 минут

export const PromoBanner: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [elapsed, setElapsed] = useState(0)
    const startTimeRef = useRef(Date.now())

    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY)
        if (savedState) {
            try {
                const { index, startTime } = JSON.parse(savedState)
                setCurrentIndex(index)
                startTimeRef.current = startTime
            } catch (e) {
                console.error('Failed to parse promo banner stat', e)
            }
        } else {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    index: 0,
                    startTime: startTimeRef.current,
                })
            )
        }

        const tickInterval = setInterval(() => {
            const currentElapsed = Date.now() - startTimeRef.current

            // Проверяем, истек ли таймер
            if (currentElapsed >= ROTATION_INTERVAL) {
                // Запускаем анимацию исчезновения
                setIsAnimating(true)

                setTimeout(() => {
                    // Переходим к следующему промокоду
                    setCurrentIndex((prev) => (prev + 1) % PROMO_CODES.length)

                    // Сбрасываем таймер
                    startTimeRef.current = Date.now()
                    setElapsed(0)

                    // Обновляем localStorage
                    localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify({
                            index: (currentIndex + 1) % PROMO_CODES.length,
                            startTime: startTimeRef.current,
                        })
                    )

                    // Запускаем анимацию появления
                    setTimeout(() => {
                        setIsAnimating(false)
                    }, 50)
                }, 300)
            } else {
                setElapsed(currentElapsed)
            }
        }, 1000)

        return () => {
            clearInterval(tickInterval)
        }
    }, [currentIndex])

    const currentPromo = PROMO_CODES[currentIndex]
    const progress = Math.min(elapsed / ROTATION_INTERVAL, 1)
    const remaining = Math.max(ROTATION_INTERVAL - elapsed, 0)
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(currentPromo.code)
    }

    return (
        <div className={styles.promo_banner_wrap}>
            <div
                className={cn(
                    styles.promo_banner,
                    isAnimating && styles.promo_banner_fade
                )}
            >
                <div className={styles.promo_content}>
                    <div className={styles.promo_text}>
                        <h3 className={styles.promo_title}>{currentPromo.title}</h3>
                        <p className={styles.promo_description}>{currentPromo.description}</p>
                    </div>

                    <div className={styles.promo_code_block}>
                        <div className={styles.promo_code_label}>Промокод</div>
                        <div className={styles.promo_code_value}>{currentPromo.code}</div>
                        <button
                            className={styles.copy_btn}
                            onClick={copyToClipboard}
                            title="Скопировать"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className={styles.promo_decor_1} />
                <div className={styles.promo_decor_2} />

                <div className={styles.promo_timer}>
                    <div className={styles.timer_info}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>Промокод истекает через {minutes}:{seconds.toString().padStart(2, '0')}</span>
                    </div>
                    <div className={styles.timer_progress}>
                        <div
                            className={styles.timer_progress_fill}
                            style={{ width: `${progress * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}