import cn from 'classnames';
import styles from './login.component.module.scss';
import { useState } from 'react';
import { loginUser } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [successMessage, setSuccessMessage] = useState('');

    const [errors, setErrors] = useState({
        username: '',
        password: '',
        general: '',
    });

    const validateForm = () => {
        const newErrors = {
            username: '',
            password: '',
            general: '',
        };

        let isValid = true;

        if (!username.trim()) {
            newErrors.username = 'Введите логин';
            isValid = false;
        }

        if (!password.trim()) {
            newErrors.password = 'Введите пароль';
            isValid = false;
        } else if (password.length < 6) {
            newErrors.password = 'Минимум 6 символов';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            await loginUser({ username, password });

            setErrors({
                username: '',
                password: '',
                general: '',
            });

            setSuccessMessage('Успешный вход!');

            setTimeout(() => {
                navigate('/');
            }, 1500);

        } catch (error) {
            console.log(error);

            setErrors((prev) => ({
                ...prev,
                general: 'Неверный логин или пароль',
            }));
        }
    };

    return (
        <div className={cn(styles['login'])}>
            <div className={cn(styles['login_box'])}>
                <h1 className={cn(styles['login_title'])}>
                    Вход
                </h1>

                <div className={cn(styles['login_form'])}>

                    <label className={cn(styles['login_label'])}>
                        ВОЙДИТЕ, ИСПОЛЬЗУЯ ИМЯ АККАУНТА
                    </label>

                    <input
                        type="text"
                        placeholder="Логин"
                        className={cn(styles['login_input'])}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    {errors.username && (
                        <span className={cn(styles['error_text'])}>
                            {errors.username}
                        </span>
                    )}

                    <label className={cn(styles['login_label'])}>
                        ПАРОЛЬ
                    </label>

                    <input
                        type="password"
                        placeholder="Пароль"
                        className={cn(styles['login_input'])}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {errors.password && (
                        <span className={cn(styles['error_text'])}>
                            {errors.password}
                        </span>
                    )}

                    <button
                        className={cn(styles['login_button'])}
                        onClick={handleLogin}
                    >
                        Войти
                    </button>

                    {successMessage && (
                        <div className={cn(styles['success_message'])}>
                            {successMessage}
                        </div>
                    )}

                    {errors.general && (
                        <div className={cn(styles['error_text'])}>
                            {errors.general}
                        </div>
                    )}

                    <div className={cn(styles['register_block'])}>
                        <span>
                            У вас нет аккаунта?
                        </span>

                        <a
                            className={cn(styles['register_button'])}
                            href="/register"
                        >
                            Создать аккаунт
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LoginPage;