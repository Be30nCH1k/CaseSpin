export interface InventoryItem {
    id: number;
    weapon_name: string;
    skin_name: string;
    price: number;
    rarity: string;
    image_url: string;
}

export interface TargetItem {
    id: number;
    weapon_name: string;
    skin_name: string;
    price: number;
    rarity: string;
    image_url: string;
    chance_percentage?: number | null;
}

export interface UpgradeResult {
    success: boolean;
    won_item?: {
        id: number;
        weapon_name: string;
        skin_name: string;
        price: number;
        rarity: string;
        image_url: string;
    };
    new_balance: string;
    chance_used?: number;
    roll?: number;
    message?: string;
    lost_items?: {
        weapon_name: string;
        skin_name: string;
        price: number;
    };
    lost_balance?: string;
}