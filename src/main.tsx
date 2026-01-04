import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from './theme/theme.ts'
import { seedInitialData } from './services/db.ts'
import { CartProvider } from './context/CartContext.tsx'

const Root = () => {
  useEffect(() => {
    seedInitialData().catch(console.error);
  }, []);

  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <CartProvider>
          <App />
        </CartProvider>
      </ThemeProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
