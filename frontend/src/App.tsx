import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import theme from './theme/theme';
import AppRoutes from './AppRoutes';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
