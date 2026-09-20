import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Documents from "./pages/Documents";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import APIKeys from "./pages/APIKeys";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";


function AppLayout() {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register";


  if (isAuthPage) {
    return (
      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

      </Routes>
    );
  }


  return (
    <ProtectedRoute>

      <div className="min-h-screen bg-slate-50">

        <Sidebar />

        <Navbar />

        <main className="min-h-screen pt-20 lg:pl-64">

          <div className="p-6 lg:p-8">

            <Routes>

              <Route
                path="/"
                element={<Dashboard />}
              />

              <Route
                path="/chat"
                element={<Chat />}
              />

              <Route
                path="/documents"
                element={<Documents />}
              />

              <Route
                path="/analytics"
                element={<Analytics />}
              />

              <Route
                path="/history"
                element={<History />}
              />

              <Route
                path="/api-keys"
                element={<APIKeys />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />

            </Routes>

          </div>

        </main>

      </div>

    </ProtectedRoute>
  );
}


function App() {
  return (
    <BrowserRouter>

      <AppLayout />

    </BrowserRouter>
  );
}


export default App;