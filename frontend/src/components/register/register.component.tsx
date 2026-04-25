import cn from 'classnames';
import styles from './register.component.module.scss';
import { useState } from 'react';
import { registerUser } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

const RegisterComponent = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [successMessage, setSuccessMessage] = useState('');
    const [errors, setErrors] = useState({
        username: '',
        email: '',
        password: '',
        general: '',
    });

    const validateForm = () => {
        const newErrors = {
            username: '',
            email: '',
            password: '',
            general: '',
        };

        let isValid = true;

        if (!username.trim()) {
            newErrors.username = 'Введите логин';
            isValid = false;
        }

        if (!email.trim()) {
            newErrors.email = 'Введите email';
            isValid = false;
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            newErrors.email = 'Некорректный email';
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

    const handleRegister = async () => {
        if (!validateForm()) return;

        try {
            await registerUser({ username, email, password });

            setSuccessMessage('Аккаунт успешно создан!');

            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (error) {
            console.log(error);
            setErrors((prev) => ({
                ...prev,
                general: 'Ошибка регистрации',
            }));
        }
    };

    return (
        <div className={cn(styles['register'])}>
            <div className={cn(styles['register_box'])}>
                <h1 className={cn(styles['register_title'])}>Регистрация</h1>

                <div className={cn(styles['register_form'])}>
                    <label className={cn(styles['register_label'])}>
                        ИМЯ ПОЛЬЗОВАТЕЛЯ
                    </label>

                    <input
                        type="text"
                        placeholder="Введите логин"
                        className={cn(styles['register_input'])}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    {errors.username && (
                        <span className={cn(styles['error_text'])}>{errors.username}</span>
                    )}

                    <label className={cn(styles['register_label'])}>
                        EMAIL
                    </label>

                    <input
                        type="email"
                        placeholder="Введите email"
                        className={cn(styles['register_input'])}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {errors.email && (
                        <span className={cn(styles['error_text'])}>{errors.email}</span>
                    )}

                    <label className={cn(styles['register_label'])}>
                        ПАРОЛЬ
                    </label>

                    <input
                        type="password"
                        placeholder="Введите пароль"
                        className={cn(styles['register_input'])}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {errors.password && (
                        <span className={cn(styles['error_text'])}>{errors.password}</span>
                    )}

                    <button
                        className={cn(styles['register_button'])}
                        onClick={handleRegister}
                    >
                        Создать аккаунт
                    </button>

                    {successMessage && (
                        <div className={cn(styles['success_message'])}>
                            {successMessage}
                        </div>
                    )}

                    {errors.general && (
                        <div className={cn(styles['error_text'])}>{errors.general}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterComponent;
