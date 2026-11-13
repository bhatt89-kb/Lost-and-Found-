import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedStudentId = localStorage.getItem('studentId');
    const token = localStorage.getItem('token');
    return token && savedStudentId ? { studentId: savedStudentId, token } : null;
  });

  const login = (token, studentId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('studentId', studentId);
    setUser({ studentId, token });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('studentId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);