import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import DataDetails from "./pages/DataDetails";
import { ThemeProvider } from "./hooks/useTheme";
import { DatasetProvider } from "./hooks/useDataset";
import { DataProvider } from "./context/DataContext";

import GlobalErrorBoundary from "./components/GlobalErrorBoundary";

export default function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <DataProvider>
          <DatasetProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/data" element={<DataDetails />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </DatasetProvider>
        </DataProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}

