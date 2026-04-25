import styles from "./footer.component.module.scss"


const FooterComponent = () => {
    return (
        <footer className={styles['footer']}>
            <img
                className={styles['footer__logo']}
                src={"https://mycs2.pro/public/img/fx/items-on-logo.png?v=2"}
                alt="CS2 Pro Logo"
            />
            <div className={styles['footer__copyright']}>
                © 2024 CaseSpin. Все права защищены.
            </div>
        </footer>
    );
};

export default FooterComponent;