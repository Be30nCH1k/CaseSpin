import cn from 'classnames';
import styles from './login.component.module.scss';
import { useState } from 'react';
import { loginUser } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);
    const [errors, setErrors] = useState({
        username: '',
        password: '',
        general:  '',
    });

    const validateForm = () => {
        const newErrors = { username: '', password: '', general: '' };
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

        setLoading(true);
        setErrors({ username: '', password: '', general: '' });

        try {
            // loginUser сохраняет токены и диспатчит 'auth:login'
            // хедер обновится сам по событию
            await loginUser({ username, password });

            navigate('/');

        } catch (error) {
            console.error(error);
            setErrors(prev => ({ ...prev, general: 'Неверный логин или пароль' }));
        } finally {
            setLoading(false);
        }
    };

    // войти по Enter
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <div className={cn(styles.login)}>
            <div className={cn(styles.login_box)}>
                <h1 className={cn(styles.login_title)}>Вход</h1>

                <div className={cn(styles.login_form)}>

                    <label className={cn(styles.login_label)}>
                        ВОЙДИТЕ, ИСПОЛЬЗУЯ ИМЯ АККАУНТА
                    </label>

                    <input
                        type="text"
                        placeholder="Логин"
                        className={cn(styles.login_input, errors.username && styles.input_error)}
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="username"
                    />
                    {errors.username && (
                        <span className={cn(styles.error_text)}>{errors.username}</span>
                    )}

                    <label className={cn(styles.login_label)}>ПАРОЛЬ</label>

                    <input
                        type="password"
                        placeholder="Пароль"
                        className={cn(styles.login_input, errors.password && styles.input_error)}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="current-password"
                    />
                    {errors.password && (
                        <span className={cn(styles.error_text)}>{errors.password}</span>
                    )}

                    {errors.general && (
                        <div className={cn(styles.error_text, styles.error_general)}>
                            {errors.general}
                        </div>
                    )}

                    <button
                        className={cn(styles.login_button, loading && styles.loading)}
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? 'Входим...' : 'Войти'}
                    </button>

                    <div className={cn(styles.register_block)}>
                        <span>У вас нет аккаунта?</span>
                        <a className={cn(styles.register_button)} href="/register">
                            Создать аккаунт
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LoginPage;