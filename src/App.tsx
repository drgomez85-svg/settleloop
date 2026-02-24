import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BankingHome } from './pages/BankingHome';
import { SettleLoopDashboard } from './pages/SettleLoopDashboard';
import { MissionDetail } from './pages/MissionDetail';
import { SettlementFlow } from './pages/SettlementFlow';
import { NewMission } from './pages/NewMission';
import { SendMoney } from './pages/SendMoney';
import { RequestMoney } from './pages/RequestMoney';
import { PayBill } from './pages/PayBill';
import { AccountDetail } from './pages/AccountDetail';
import { Login } from './pages/Login';
import { RecurringExpenses } from './pages/RecurringExpenses';
import { useAuthStore } from './store/authStore';
import './styles/global.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <BankingHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settleloop"
          element={
            <ProtectedRoute>
              <SettleLoopDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mission/new"
          element={
            <ProtectedRoute>
              <NewMission />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mission/:id"
          element={
            <ProtectedRoute>
              <MissionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mission/:id/settle"
          element={
            <ProtectedRoute>
              <SettlementFlow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/send"
          element={
            <ProtectedRoute>
              <SendMoney />
            </ProtectedRoute>
          }
        />
        <Route
          path="/request"
          element={
            <ProtectedRoute>
              <RequestMoney />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pay-bill"
          element={
            <ProtectedRoute>
              <PayBill />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/:id"
          element={
            <ProtectedRoute>
              <AccountDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recurring-expenses"
          element={
            <ProtectedRoute>
              <RecurringExpenses />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
