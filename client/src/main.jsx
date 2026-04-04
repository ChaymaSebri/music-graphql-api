import React from 'react';
import ReactDOM from 'react-dom/client';
import { MainApp } from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { theme, globalStyles } from './styles/theme.js';

const style = document.createElement('style');
style.textContent = globalStyles;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  </React.StrictMode>
);
