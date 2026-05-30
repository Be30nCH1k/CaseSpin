export interface Item {
    id: number;
    weapon_name: string;
    skin_name: string;
    price: number;
    image_url: string;
    rarity?: 'blue' | 'purple' | 'pink' | 'red' | 'gold';
}

export interface User {
    id: number;
    balance: number;
    username?: string;
}

export type SpinResult = 'win' | 'lose' | null;

export interface UpgradeResponse {
    success: boolean;
    new_balance?: number;
    error?: string;
}