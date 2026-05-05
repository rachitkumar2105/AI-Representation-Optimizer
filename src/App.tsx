import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import DataDetails from "./pages/DataDetails";
import { ThemeProvider } from "./hooks/useTheme";
import { DatasetProvider } from "./hooks/useDataset";
import { DataProvider } from "./context/DataContext";

export default function App() {
  return (
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
  );
}
