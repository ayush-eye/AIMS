import React, { createContext, useContext, useState, useEffect } from "react";
import { api, tokenStorage, registerUnauthorizedCallback } from "../services/api";
import { useRouter } from "expo-router";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      router.replace("/");
    };

    registerUnauthorizedCallback(handleUnauthorized);

    return () => {
      registerUnauthorizedCallback(null);
    };
  }, [router]);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedUser = await tokenStorage.getUser();
        const storedToken = await tokenStorage.getAccessToken();
        if (storedUser && storedToken) {
          setUser(storedUser);
        }
      } catch (e) {
        console.error("Error loading stored auth:", e);
      } finally {
        setLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  const login = async (mobile, role, extraDetails = {}) => {
    setLoading(true);
    try {
      const payload = { mobile, role, ...extraDetails };
      const response = await api.post("/api/auth/login", payload);
      
      if (response.data.requiresRegistration) {
        return response.data;
      }
      
      const { accessToken, refreshToken, user: loggedUser } = response.data;
      const userData = {
        id: loggedUser.id,
        mobile: loggedUser.mobile,
        name: loggedUser.name,
        firstName: loggedUser.firstName,
        lastName: loggedUser.lastName,
        address: loggedUser.address,
        email: loggedUser.email,
        role: loggedUser.role,
        status: loggedUser.status,
        assignedCourses: loggedUser.assignedCourses || [],
      };

      await tokenStorage.saveTokens(accessToken, refreshToken, userData);
      setUser(userData);
      return userData;
    } catch (error) {
      await tokenStorage.clear();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (user) {
        await api.post("/api/auth/logout", { userId: user.id });
      }
    } catch (e) {
      console.warn("Logout api call failed, clearing tokens anyway", e);
    } finally {
      await tokenStorage.clear();
      setUser(null);
      setLoading(false);
      router.replace("/");
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      await api.get("/courses");
    } catch (error) {
      console.error("Failed to verify token validity:", error);
      await logout();
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.post("/api/auth/update-profile", {
        userId: user.id,
        ...updates
      });
      const updatedUser = response.data.user;
      const userData = {
        id: updatedUser.id,
        mobile: updatedUser.mobile,
        name: updatedUser.name,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        address: updatedUser.address,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        assignedCourses: updatedUser.assignedCourses || [],
      };
      
      const token = await tokenStorage.getAccessToken();
      const rtoken = await tokenStorage.getRefreshToken();
      await tokenStorage.saveTokens(token, rtoken, userData);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
