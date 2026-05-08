import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import logo from "/public/icons/logo.png";
import cn from "classnames";
import styles from './header.component.module.scss';
import api from "../../api/api";
import { logoutUser } from "../../api/auth";

type UserInfo = {
    username:   string;
    balance:    string;
    avatar_url: string;
};

export const HeaderComponent = () => {
    const [user, setUser] = useState<UserInfo | null>(null);

    // вынесено в useCallback чтобы переиспользовать в обработчиках событий
    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('access');
        if (!token) {
            setUser(null);
            return;
        }
        try {
            const { data } = await api.get<UserInfo>('/me/');
            setUser(data);
        } catch {
            setUser(null);
        }
    }, []);

    // загрузка при маунте
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // логин
    useEffect(() => {
        window.addEventListener('auth:login',  fetchUser);
        window.addEventListener('auth:logout', fetchUser);
        return () => {
            window.removeEventListener('auth:login',  fetchUser);
            window.removeEventListener('auth:logout', fetchUser);
        };
    }, [fetchUser]);

    // обновление баланса после открытия кейса
    useEffect(() => {
        const handler = (e: Event) => {
            const newBalance = (e as CustomEvent<string>).detail;
            setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
        };
        window.addEventListener('balance:update', handler);
        return () => window.removeEventListener('balance:update', handler);
    }, []);

    return (
        <div className={cn(styles.header)}>
            <nav className={cn(styles.header_nav)}>

                <div className={cn(styles.header_nav__left)}>
                    <NavLink to="/" className={cn(styles.header_img)}>
                        <img src={logo} alt="logo" />
                    </NavLink>

                    <NavLink to="/"
                             className={({ isActive }) =>
                                 cn(styles.header_link, { [styles['header_link__active']]: isActive })
                             }
                    >
                        <span><img className={cn(styles['header_img__link'])} src="../../../public/icons/case.svg" alt="case" /></span>
                        Кейсы
                    </NavLink>

                    <NavLink to="/upgrade"
                             className={({ isActive }) =>
                                 cn(styles.header_link, { [styles['header_link__active']]: isActive })
                             }
                    >
                        <span><img className={cn(styles['header_img__link'])} src="../../../public/icons/arrowup.svg" alt="upgrade" /></span>
                        Апгрейд
                    </NavLink>

                    <NavLink to="/contract"
                             className={({ isActive }) =>
                                 cn(styles.header_link, { [styles['header_link__active']]: isActive })
                             }
                    >
                        <span><img className={cn(styles['header_img__link'])} src="../../../public/icons/target.svg" alt="contract" /></span>
                        Контракт
                    </NavLink>
                </div>

                <div className={cn(styles['header_nav__right'])}>
                    {user ? (
                        <div className={cn(styles.user_block)}>

                            <div className={cn(styles.balance_chip)}>
                                <span className={cn(styles.balance_plus)}>+</span>
                                <span className={cn(styles.balance_amount)}>
                                    {parseFloat(user.balance).toFixed(2)} ₽
                                </span>
                            </div>

                            <div
                                className={cn(styles.avatar_wrap)}
                                title={`${user.username} — выйти`}
                                onClick={logoutUser}
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
        </div>
    );
};