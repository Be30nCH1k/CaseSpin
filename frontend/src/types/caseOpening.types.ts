export type SlotData = {
    items:     any[];
    winIdx:    number;
    translate: number;
    duration:  number;
    easing:    string;
};

export type WonItem = {
    price:        number | string;
    image_url:    string;
    weapon_name:  string;
    skin_name:    string;
    inventoryId?: number;
};