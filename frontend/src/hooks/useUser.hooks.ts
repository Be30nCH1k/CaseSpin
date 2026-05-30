import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

export type UserInfo = {
    username:   string;
    balance:    string;
    avatar_url: string;
};

export const useUserHooks = () => {
    const [user, setUser]       = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('access');
        if (!token) { setLoading(false); return; }

        try {
            const { data } = await api.get<UserInfo>('/me/');
            setUser(data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUser(); }, [fetchUser]);

    return { user, loading, refreshUser: fetchUser };
};