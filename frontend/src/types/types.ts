export interface Item {
    id: number;
    name: string;
    price: string;
    rarity: 'blue' | 'purple' | 'pink' | 'red' | 'gold';
    image_url: string;
}

export interface Case {
    id: number;
    name: string;
    price: string;
    image_url?: string;
    category: string;
    items: { item: Item; chance: number }[];
}
export interface DropEntry {
    id: number;
    dropped_at: string;
    is_sold: boolean;
    inventory_item_id: number | null;
    item: {
        id: number;
        weapon_name: string;
        skin_name: string;
        price: string;
        rarity: string;
        image_url: string;
    };
}
export interface UserInfo {
    username: string;
    balance: string;
    avatar_url: string;
    best_drop: {
        weapon_name: string;
        skin_name: string;
        price: string;
        image_url: string;
        rarity: string;
    } | null;
}