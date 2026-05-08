import api from './api';

export const registerUser = async (data: {
    username: string;
    email: string;
    password: string;
}) => {
    const response = await api.post('register/', data);

    localStorage.setItem('access', response.data.access);
    localStorage.setItem('refresh', response.data.refresh);
    localStorage.setItem('username', response.data.username);

    window.dispatchEvent(new Event('auth:login'));

    return response.data;
};

export const loginUser = async (data: {
    username: string;
    password: string;
}) => {
    const response = await api.post('login/', data);

    localStorage.setItem('access', response.data.access);
    localStorage.setItem('refresh', response.data.refresh);
    localStorage.setItem('username', data.username);

    window.dispatchEvent(new Event('auth:login'));

    return response.data;
};

export const logoutUser = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('username');
    window.dispatchEvent(new Event('auth:logout'));
    window.location.href = '/login';
};