import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SubItemPage from './pages/SubItemPage';
import SummaryPage from './pages/SummaryPage';
import OrderPrintPage from './pages/OrderPrintPage';
import AdminPage from './pages/AdminPage';
import OrdersTodayPage from './pages/OrdersTodayPage';
import DaySummaryPage from './pages/DaySummaryPage';
import ReportsPage from './pages/ReportsPage';
import Layout from './components/layout/Layout';

function App() {
  return (
    <Router basename="/restaurant-pwa">
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:categoryId" element={<SubItemPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/order/print/:orderId" element={<OrderPrintPage />} />
          <Route path="/orders" element={<OrdersTodayPage />} />
          <Route path="/day-summary" element={<DaySummaryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
