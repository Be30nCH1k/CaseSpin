import api from './api';

export const registerUser = async (data: {
    username: string;
    email: string;
    password: string;
}) => {
    const response = await api.post('register/', data);

    localStorage.setItem('token', response.data.access);
    localStorage.setItem('refresh', response.data.refresh);
    localStorage.setItem('username', response.data.username);

    return response.data;
};

export const loginUser = async (data: {
    username: string;
    password: string;
}) => {
    const response = await api.post('login/', data);

    localStorage.setItem('token', response.data.access);
    localStorage.setItem('refresh', response.data.refresh);
    localStorage.setItem('username', data.username);

    return response.data;
};