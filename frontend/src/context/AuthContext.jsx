import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => { setUser(res.data.user); localStorage.setItem('user', JSON.stringify(res.data.user)); })
        .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (...roles) => roles.includes(user?.role);

  const canApprove = () => hasRole('director', 'builder', 'chairperson', 'admin');
  const canRequest = () => hasRole(
    'site_engineer', 'civil_contractor', 'plumbing_contractor', 'color_contractor',
    'lift_contractor', 'electric_contractor', 'tile_contractor',
    'acp_contractor', 'aluminium_contractor', 'door_lock_contractor',
    'director', 'builder', 'admin'
  );
  const isVendor = () => hasRole('vendor');
  const isDeliveryOp = () => hasRole('delivery_operator');
  const isAdmin = () => hasRole('director', 'builder', 'chairperson', 'admin');

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, canApprove, canRequest, isVendor, isDeliveryOp, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
