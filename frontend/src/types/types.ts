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