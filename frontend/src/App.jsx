import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/Projects/ProjectList';
import ProjectDetail from './pages/Projects/ProjectDetail';
import DrawingList from './pages/Drawings/DrawingList';
import DrawingUpload from './pages/Drawings/DrawingUpload';
import MaterialCalculation from './pages/Drawings/MaterialCalculation';
import MaterialInventory from './pages/Materials/MaterialInventory';
import MaterialRequirements from './pages/Materials/MaterialRequirements';
import OrderList from './pages/Orders/OrderList';
import OrderCreate from './pages/Orders/OrderCreate';
import OrderDetail from './pages/Orders/OrderDetail';
import VendorList from './pages/Vendors/VendorList';
import VendorForm from './pages/Vendors/VendorForm';
import ContractorList from './pages/Contractors/ContractorList';
import ContractorForm from './pages/Contractors/ContractorForm';
import DeliveryList from './pages/Deliveries/DeliveryList';
import DeliveryUpload from './pages/Deliveries/DeliveryUpload';
import NotificationList from './pages/Notifications/NotificationList';
import Reports from './pages/Reports/Reports';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><NotificationProvider><Layout /></NotificationProvider></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="drawings" element={<DrawingList />} />
        <Route path="drawings/upload" element={<DrawingUpload />} />
        <Route path="drawings/:id/calculate" element={<MaterialCalculation />} />
        <Route path="materials" element={<MaterialInventory />} />
        <Route path="materials/requirements" element={<MaterialRequirements />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/new" element={<OrderCreate />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="vendors" element={<VendorList />} />
        <Route path="vendors/new" element={<VendorForm />} />
        <Route path="vendors/:id/edit" element={<VendorForm />} />
        <Route path="contractors" element={<ContractorList />} />
        <Route path="contractors/new" element={<ContractorForm />} />
        <Route path="contractors/:id/edit" element={<ContractorForm />} />
        <Route path="deliveries" element={<DeliveryList />} />
        <Route path="deliveries/:orderId/upload" element={<DeliveryUpload />} />
        <Route path="notifications" element={<NotificationList />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '10px', background: '#333', color: '#fff' } }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
