import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import { LocaleProvider } from '@douyinfe/semi-ui';
import zh_CN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import './locales/i18n';

const router = createHashRouter([
  {
    path: '/',
    element: <App />
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <LocaleProvider locale={zh_CN}>
      <RouterProvider router={router} />
    </LocaleProvider>
  </React.StrictMode>
);
