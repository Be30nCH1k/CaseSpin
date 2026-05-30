export type InvItem = {
    id:                number;
    weapon_name:       string;
    skin_name:         string;
    image_url:         string;
    price:             string | number;
    rarity:            string;
    inventory_item_id: number | null;
};

export type ContractResult = {
    success:      boolean;
    item?:        InvItem;
    new_balance?: string;
};