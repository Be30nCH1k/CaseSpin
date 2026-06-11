import { NavLink } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import logo from "/public/icons/logo.png";
import cn from "classnames";
import styles from './header.component.module.scss';
import api from "../../api/api";
import { logoutUser } from "../../api/auth";
import { DepositModal } from "../deposit/depositModel.component.tsx";

type UserInfo = {
    username:   string;
    balance:    string;
    avatar_url: string;
};

export const HeaderComponent = () => {
    const [user,        setUser]        = useState<UserInfo | null>(null);
    const [menuOpen,    setMenuOpen]    = useState(false);
    const [depositOpen, setDepositOpen] = useState(false); // <-- новое
    const menuRef = useRef<HTMLDivElement>(null);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('access');
        if (!token) { setUser(null); return; }
        try {
            const { data } = await api.get<UserInfo>('/me/');
            setUser(data);
        } catch {
            setUser(null);
        }
    }, []);

    useEffect(() => { fetchUser(); }, [fetchUser]);

    useEffect(() => {
        window.addEventListener('auth:login',  fetchUser);
        window.addEventListener('auth:logout', fetchUser);
        return () => {
            window.removeEventListener('auth:login',  fetchUser);
            window.removeEventListener('auth:logout', fetchUser);
        };
    }, [fetchUser]);

    useEffect(() => {
        const handler = (e: Event) => {
            const newBalance = (e as CustomEvent<string>).detail;
            setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
        };
        window.addEventListener('balance:update', handler);
        return () => window.removeEventListener('balance:update', handler);
    }, []);

    // закрыть меню при клике вне
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    // Обработчик успешного пополнения
    const handleDepositSuccess = (newBalance: string) => {
        setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
        // Дублируем событием, чтобы другие компоненты тоже узнали
        window.dispatchEvent(new CustomEvent('balance:update', { detail: newBalance }));
    };

    return (
        <div className={cn(styles.header)}>
            <nav className={cn(styles.header_nav)}>

                <div className={cn(styles.header_nav__left)}>
                    <NavLink to="/" className={cn(styles.header_img)}>
                        <img src={logo} alt="logo" />
                    </NavLink>

                    <NavLink to="/" className={({ isActive }) => cn(styles.header_link, { [styles['header_link__active']]: isActive })}>
                        <span><img className={cn(styles['header_img__link'])} src="../../../public/icons/case.svg" alt="case" /></span>
                        Кейсы
                    </NavLink>

                    <NavLink to="/upgrade" className={({ isActive }) => cn(styles.header_link, { [styles['header_link__active']]: isActive })}>
                        <span><img className={cn(styles['header_img__link'])} src="../../../public/icons/arrowup.svg" alt="upgrade" /></span>
                        Апгрейд
                    </NavLink>

                    <NavLink to="/contract" className={({ isActive }) => cn(styles.header_link, { [styles['header_link__active']]: isActive })}>
                        <span><img className={cn(styles['header_img__link'])} src="../../../public/icons/target.svg" alt="contract" /></span>
                        Контракт
                    </NavLink>
                </div>

                <div className={cn(styles['header_nav__right'])}>
                    {user ? (
                        <div className={cn(styles.user_block)}>

                            {/* Клик по балансу — открывает модалку пополнения */}
                            <button
                                type="button"
                                className={cn(styles.balance_chip)}
                                onClick={() => setDepositOpen(true)}
                            >
                                <span className={cn(styles.balance_plus)}>+</span>
                                <span className={cn(styles.balance_amount)}>
                                    {parseFloat(user.balance).toFixed(2)} ₽
                                </span>
                            </button>

                            <div className={cn(styles.avatar_menu_wrap)} ref={menuRef}>
                                <div
                                    className={cn(styles.avatar_wrap, menuOpen && styles.avatar_active)}
                                    onClick={() => setMenuOpen(o => !o)}
                                    title={user.username}
                                >
                                    <img
                                        src={user.avatar_url || `https://robohash.org/${user.username}?set=set4&size=80x80`}
                                        alt={user.username}
                                        className={cn(styles.avatar)}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                                `https://robohash.org/${user.username}?set=set4&size=80x80`;
                                        }}
                                    />
                                    <div className={cn(styles.avatar_chevron, menuOpen && styles.chevron_open)}>
                                        ▾
                                    </div>
                                </div>

                                {menuOpen && (
                                    <div className={cn(styles.dropdown)}>
                                        <div className={cn(styles.dropdown_header)}>
                                            <img
                                                src={user.avatar_url || `https://robohash.org/${user.username}?set=set4&size=80x80`}
                                                alt={user.username}
                                                className={cn(styles.dropdown_avatar)}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src =
                                                        `https://robohash.org/${user.username}?set=set4&size=80x80`;
                                                }}
                                            />
                                            <div className={cn(styles.dropdown_userinfo)}>
                                                <span className={cn(styles.dropdown_username)}>{user.username}</span>
                                                <span className={cn(styles.dropdown_balance)}>{parseFloat(user.balance).toFixed(2)} ₽</span>
                                            </div>
                                        </div>

                                        <div className={cn(styles.dropdown_divider)} />

                                        <NavLink
                                            to="/inventory"
                                            className={cn(styles.dropdown_item)}
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="3" width="20" height="14" rx="2"/>
                                                <path d="M8 21h8M12 17v4"/>
                                            </svg>
                                            Инвентарь
                                        </NavLink>

                                        <div className={cn(styles.dropdown_divider)} />

                                        <button
                                            className={cn(styles.dropdown_logout)}
                                            onClick={() => { setMenuOpen(false); logoutUser(); }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                                <polyline points="16 17 21 12 16 7"/>
                                                <line x1="21" y1="12" x2="9" y2="12"/>
                                            </svg>
                                            Выйти
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <NavLink to="/login" className={cn(styles['header_button'])}>
                            <span>
                                <img className={cn(styles['header_img__login'])} src="../../../public/icons/steam.png" alt="steam" />
                            </span>
                            Войти через Steam
                        </NavLink>
                    )}
                </div>
            </nav>

            {/* Модалка пополнения */}
            {depositOpen && (
                <DepositModal
                    onClose={() => setDepositOpen(false)}
                    onSuccess={handleDepositSuccess}
                />
            )}
        </div>
    );
};