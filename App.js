import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminPage from './components/AdminPage';
import CustomerPage from './components/CustomerPage';
import AccountCreationForm from './components/AccountCreationForm';
import LoanRequestForm from './components/LoanRequestForm';
import TransferMoneyForm from './components/TransferMoneyForm';
import SignInForm from './components/SignInForm';
import SignUpForm from './components/SignUpForm'; // Added SignUpForm
import MoneyTransfer from './components/transferDiff';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SignInForm />} />
          <Route path="/signup" element={<SignUpForm />} /> {/* Signup Route */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/customer" element={<CustomerPage />} />
          <Route path="/create-account" element={<AccountCreationForm />} />
          <Route path="/loan-request" element={<LoanRequestForm />} />
          <Route path="/transfer-money" element={<TransferMoneyForm />} />
          <Route path="/transferDiff" element={<MoneyTransfer />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
