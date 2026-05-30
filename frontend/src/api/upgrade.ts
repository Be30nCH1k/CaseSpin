import type { UpgradeRequest, UpgradeResult, UpgradeSkin } from '../types/upgrade.types';
import api from "./api.ts";

export const upgradeApi = {
    getAvailableSkins: () =>
        api.get<UpgradeSkin[]>('/upgrade/available-skins/'),

    performUpgrade: (data: UpgradeRequest) =>
        api.post<UpgradeResult>('/upgrade/perform/', data),
};