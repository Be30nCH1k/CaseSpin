import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/Router.tsx';
import './assets/styles/global.scss';

createRoot(document.getElementById('root')!).render(
    <RouterProvider router={router} />
);