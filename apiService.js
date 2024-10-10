import axios from 'axios';

const BASE_URL = 'https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents';
// Fetch Customer Data
export const fetchCustomerData = async () => {
  const response = await axios.get(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer`);
  return response.data.documents;
};

// Fetch Loan Requests
export const fetchLoanRequests = async () => {
  try {
    const response = await fetch(`${BASE_URL}/loan`);
    const data = await response.json();
    return data.documents.map((doc) => doc.fields);
  } catch (error) {
    console.error('Error fetching loan requests', error);
  }
};

// API to submit loan request
export const submitLoanRequest = async (loanData) => {
  const payload = {
    fields: {
      account_number: { integerValue: loanData.account_number },
      amount: { integerValue: loanData.amount },
      purpose: { stringValue: loanData.purpose },
      request_id: { integerValue: loanData.request_id },
      status: { booleanValue: loanData.status },
    },
  };
  await axios.post(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/loan`, payload);
};

// Fetch Account Creation Requests
export const fetchCreationRequests = async () => {
  try {
    const response = await fetch(`${BASE_URL}/creation`);
    const data = await response.json();
    return data.documents.map((doc) => doc.fields);
  } catch (error) {
    console.error('Error fetching creation requests', error);
  }
};

// Approve Account Creation Request
export const approveCreationRequest = async (requestId) => {
  try {
    const response = await fetch(`${BASE_URL}/creation/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error approving creation request', error);
  }
};

// Loan Approval
export const approveLoanRequest = async (loanId) => {
  try {
    const response = await fetch(`${BASE_URL}/loan/${loanId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error approving loan request', error);
  }
};

// Set Transaction Limit
export const setTransactionLimit = async (adminId, limit) => {
  try {
    const response = await fetch(`${BASE_URL}/admin/${adminId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_limit: limit }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error setting transaction limit', error);
  }
};
