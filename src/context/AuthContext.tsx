import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";


const API_URL = "https://nexa-ai-1-rel1.onrender.com";


export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}


interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => void;
}


interface AuthProviderProps {
  children: ReactNode;
}


const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);


export function AuthProvider({
  children,
}: AuthProviderProps) {

  const [user, setUser] = useState<User | null>(
    null
  );

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("nexaai_token")
  );

  const [loading, setLoading] = useState(true);


  // ============================================================
  // GET CURRENT USER
  // ============================================================

  useEffect(() => {

    const loadUser = async () => {

      if (!token) {
        setLoading(false);
        return;
      }


      try {

        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );


        if (!response.ok) {
          throw new Error(
            "Authentication expired."
          );
        }


        const currentUser: User =
          await response.json();


        setUser(currentUser);

      } catch (error) {

        console.error(
          "Authentication error:",
          error
        );

        localStorage.removeItem(
          "nexaai_token"
        );

        setToken(null);
        setUser(null);

      } finally {

        setLoading(false);

      }
    };


    loadUser();

  }, [token]);


  // ============================================================
  // REGISTER
  // ============================================================

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {

    const response = await fetch(
      `${API_URL}/api/auth/register`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          email,
          password,
        }),
      }
    );


    const data = await response.json();


    if (!response.ok) {

      throw new Error(
        data.detail ||
        "Registration failed."
      );

    }


    localStorage.setItem(
      "nexaai_token",
      data.access_token
    );


    setToken(
      data.access_token
    );


    setUser(
      data.user
    );

  };


  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (
    email: string,
    password: string
  ) => {

    const response = await fetch(
      `${API_URL}/api/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );


    const data = await response.json();


    if (!response.ok) {

      throw new Error(
        data.detail ||
        "Login failed."
      );

    }


    localStorage.setItem(
      "nexaai_token",
      data.access_token
    );


    setToken(
      data.access_token
    );


    setUser(
      data.user
    );

  };


  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {

    localStorage.removeItem(
      "nexaai_token"
    );

    setToken(null);

    setUser(null);

  };


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// ============================================================
// USE AUTH HOOK
// ============================================================

export function useAuth() {

  const context = useContext(
    AuthContext
  );


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }


  return context;
}
