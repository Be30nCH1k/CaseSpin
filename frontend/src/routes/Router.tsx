import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout.tsx';
import { MainPage } from "../pages/main/main.page.tsx";
import { UpgradePage } from "../pages/upgrade/upgrade.page.tsx";
import { ContractPage } from "../pages/contract/contract.page.tsx";
import LoginPage from "../components/login/login.component.tsx";
import DetailPage from "../pages/detail/detail.page.tsx";
import {RegisterPage} from "../pages/register/register.page.tsx";
export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <MainPage /> },
            { path: "upgrade", element: <UpgradePage /> },
            { path: "contract", element: <ContractPage /> },
            { path: "case/:id", element: <DetailPage /> },
            { path: "login", element: <LoginPage />},
            { path: "register", element: <RegisterPage />}
        ],
    },
]);