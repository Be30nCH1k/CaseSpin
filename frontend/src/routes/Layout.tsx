import { Outlet, useLocation } from 'react-router-dom';
import { HeaderComponent } from "../../src/components/header/header.component.tsx";
import FooterComponent from "../components/footer/footer.component.tsx";

function Layout() {
    const location = useLocation();

    const hideHeaderRoutes = [
        "/login",
        "/register",
    ];

    const shouldHideHeader = hideHeaderRoutes.includes(location.pathname);

    return (
        <div>
            {!shouldHideHeader && (
                <header>
                    <HeaderComponent />
                </header>
            )}

            <main>
                <Outlet />
            </main>

            {!shouldHideHeader && (
                <footer>
                    <FooterComponent />
                </footer>
            )}
        </div>
    );
}

export default Layout;