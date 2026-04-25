import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "/public/icons/logo.png";
import cn from "classnames";
import styles from './header.component.module.scss';

export const HeaderComponent = () => {
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const savedUsername = localStorage.getItem("username");
        setUsername(savedUsername);
    }, []);

    return (
        <div className={cn(styles['header'])}>
            <nav className={cn(styles['header_nav'])}>
                <div className={cn(styles['header_nav__left'])}>
                    <NavLink
                        to={"/"}
                        className={cn(styles['header_img'])}
                    >
                        <img src={logo} alt="logo" />
                    </NavLink>

                    <NavLink
                        to={"/"}
                        className={({ isActive }) =>
                            cn(styles['header_link'], {
                                [styles['header_link__active']]: isActive
                            })
                        }
                    >
                        <span>
                            <img
                                className={cn(styles['header_img__link'])}
                                src="../../../public/icons/case.svg"
                                alt="case"
                            />
                        </span>
                        Кейсы
                    </NavLink>

                    <NavLink
                        to={"/upgrade"}
                        className={({ isActive }) =>
                            cn(styles['header_link'], {
                                [styles['header_link__active']]: isActive
                            })
                        }
                    >
                        <span>
                            <img
                                className={cn(styles['header_img__link'])}
                                src="../../../public/icons/arrowup.svg"
                                alt="upgrade"
                            />
                        </span>
                        Апгрейд
                    </NavLink>

                    <NavLink
                        to={"/contract"}
                        className={({ isActive }) =>
                            cn(styles['header_link'], {
                                [styles['header_link__active']]: isActive
                            })
                        }
                    >
                        <span>
                            <img
                                className={cn(styles['header_img__link'])}
                                src="../../../public/icons/target.svg"
                                alt="contract"
                            />
                        </span>
                        Контракт
                    </NavLink>
                </div>

                <div className={cn(styles['header_nav__right'])}>
                    {username ? (
                        <div className={cn(styles['header_user'])}>
                            Привет, {username}
                        </div>
                    ) : (
                        <NavLink
                            to={"/login"}
                            className={({ isActive }) =>
                                cn(
                                    styles['header_button'],
                                    styles['header_link'],
                                    {
                                        [styles['header_link__active']]: isActive
                                    }
                                )
                            }
                        >
                            <span>
                                <img
                                    className={cn(styles['header_img__login'])}
                                    src="../../../public/icons/steam.png"
                                    alt="steam"
                                />
                            </span>
                            Войти через Steam
                        </NavLink>
                    )}
                </div>
            </nav>
        </div>
    );
};