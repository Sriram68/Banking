import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, Select, MenuItem } from '@mui/material';
import emailjs from 'emailjs-com';
const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [statusSelections, setStatusSelections] = useState({});
  const [transactionLimits, setTransactionLimits] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loans, setLoans] = useState([]);  // State to hold loan requests
  const [loanStatusSelections, setLoanStatusSelections] = useState({});  // State for loan status dropdowns
  
  // Fetch users and loan requests on component load
  useEffect(() => {
    fetchUsers();
    fetchLoanRequests();
  }, []);

  // Fetch all users from Firestore
  const fetchUsers = async () => {
    try {
      const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/creation');
      const fetchedUsers = response.data.documents.map(doc => ({
        id: doc.name.split('/').pop(), // Get the document ID
        accounts: doc.fields.accounts?.arrayValue.values || [],
        transactionLimit: doc.fields.transactionLimit ? doc.fields.transactionLimit.integerValue : 100000, // Default limit to 100000
      }));
      
      setUsers(fetchedUsers);

      // Initialize status and transaction limit selections
      const initialSelections = {};
      const initialLimits = {};
      fetchedUsers.forEach(user => {
        const accountStatus = user.accounts.length > 0 ? user.accounts[0].mapValue.fields.status.booleanValue : false;
        initialSelections[user.id] = accountStatus ? 'Deactivate' : 'Activate';
        initialLimits[user.id] = user.transactionLimit;
      });
      setStatusSelections(initialSelections);
      setTransactionLimits(initialLimits);
    } catch (error) {
      console.error('Error fetching users:', error);
    //   setErrorMessage('🚨 Failed to fetch users. Please try again.');
    }
  };
  //send approval email
  const sendApprovalEmail = async (customerUserId) => {
    try {
      // Fetch all customer documents to find the matching customer by userId (email)
      const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer');
      const allCustomers = response.data.documents;
  
      // Find the customer where userId matches the provided customerUserId
      const matchingCustomer = allCustomers.find((doc) => doc.fields.userId.stringValue === customerUserId);
  
      if (!matchingCustomer) {
        console.error('Customer not found for the userId:', customerUserId);
        return;
      }
  
      const customerEmail = matchingCustomer.fields.userId.stringValue; // Get the customer's email
      const customerName = matchingCustomer.fields.name.stringValue; // Get the customer's name
  
      // EmailJS parameters for sending the email
      const templateParams = {
        subject: 'Account Request Approved!', // Dynamic subject
        to_email: customerEmail, // Dynamic recipient email from customer data
        to_name: customerName, // Dynamic recipient name from customer data
        message: `Hello ${customerName}, your account request has been approved!`, // Dynamic message
      };
  
      // Use emailjs to send the email
      emailjs.send('service_xwaal82', 'template_jgdq1xd', templateParams, 'q4XbXiVIZfPbVJhaL')
        .then((response) => {
          console.log('Email successfully sent!', response.status, response.text);
        }, (error) => {
          console.error('Failed to send email.', error);
        });
    } catch (error) {
      console.error('Error sending approval email:', error);
    }
};

  // Fetch all loan requests from Firestore
  const fetchLoanRequests = async () => {
    try {
      const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/loan');
      const fetchedLoans = response.data.documents.map(doc => ({
        id: doc.name.split('/').pop(), // Get the document ID
        amount: doc.fields.amount.integerValue,
        purpose: doc.fields.purpose.stringValue,
        status: doc.fields.status.booleanValue,
        userId: doc.fields.userId.stringValue,
      }));
      
      setLoans(fetchedLoans);

      // Initialize loan status selections
      const loanSelections = {};
      fetchedLoans.forEach(loan => {
        loanSelections[loan.id] = loan.status ? 'Approved' : 'Pending';
      });
      setLoanStatusSelections(loanSelections);
    } catch (error) {
      console.error('Error fetching loans:', error);
      setErrorMessage('🚨 Failed to fetch loan requests. Please try again.');
    }
  };

  // Handle user account status change
  const submitStatusChange = async (userId) => {
    const currentSelection = statusSelections[userId];
    const newStatus = currentSelection === 'Activate'; // Determine new status
  
    try {
      const response = await axios.get(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/creation/${userId}`);
      const currentData = response.data.fields;

      if (newStatus) {
        // Logic for activating the account
        const updatedAccounts = currentData.accounts.arrayValue.values.map(account => {
          return {
            mapValue: {
              fields: {
                account_number: account.mapValue.fields.account_number,
                balance: account.mapValue.fields.balance,
                status: { booleanValue: true },
                IFSC_CODE: { stringValue: "sriram6666" },
              },
            },
          };
        });

        // Prepare the payload for transferring the user to the 'customer' collection
        const customerPayload = {
          fields: {
            userId: { stringValue: userId },
            accounts: { arrayValue: { values: updatedAccounts } },
            transactionLimit: { integerValue: transactionLimits[userId] }, // Include transaction limit
            name: { stringValue: currentData.name.stringValue }, // Transfer name field as well
          },
        };

        // Transfer the user data to the 'customer' collection
        await axios.post(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer`, customerPayload);
        
        // Delete the user from the 'creation' collection after activation
        await axios.delete(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/creation/${userId}`);
        
        setSuccessMessage(`User ${userId} has been activated, added to the customer collection, and their name has been transferred.`);
        await sendApprovalEmail(userId); // Send approval email
      } else {
        // Logic for rejecting the account creation request
        await axios.delete(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/creation/${userId}`);
        setSuccessMessage(`User ${userId}'s account creation request has been rejected.`);
      }

      fetchUsers(); // Refresh user data
    } catch (error) {
      console.error('Error updating user status:', error);
      setErrorMessage('🚨 Failed to update user status. Please try again.');
    }
};


  const sendLoanApprovalEmail = async (customerUserId) => {
    try {
        // Fetch all customer documents to find the matching customer by userId (email)
        const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer');
        const allCustomers = response.data.documents;

        // Find the customer where userId matches the provided customerUserId
        const matchingCustomer = allCustomers.find((doc) => doc.fields.userId.stringValue === customerUserId);

        if (!matchingCustomer) {
            console.error('Customer not found for the userId:', customerUserId);
            return;
        }

        const customerEmail = matchingCustomer.fields.userId.stringValue; // Get the customer's email
        const customerName = matchingCustomer.fields.name.stringValue; // Get the customer's name

        // EmailJS parameters for sending the email
        const templateParams = {
            subject: 'Loan Request Approved!', // Dynamic subject
            to_email: customerEmail, // Dynamic recipient email from customer data
            to_name: customerName, // Dynamic recipient name from customer data
            message: `Hello ${customerName}, your loan request has been approved!`, // Dynamic message
        };

        // Use emailjs to send the email
        emailjs.send('service_xwaal82', 'template_jgdq1xd', templateParams, 'q4XbXiVIZfPbVJhaL')
            .then((response) => {
                console.log('Email successfully sent!', response.status, response.text);
            }, (error) => {
                console.error('Failed to send email.', error);
            });
    } catch (error) {
        console.error('Error sending loan approval email:', error);
    }
};


  // Handle loan approval/rejection
  const submitLoanStatusChange = async (loanId) => {
    const currentSelection = loanStatusSelections[loanId];
    const isApproved = currentSelection === 'Approved'; // Determine new status

    try {
        // Fetch the current loan data
        const response = await axios.get(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/loan/${loanId}`);
        const currentData = response.data.fields;

        if (isApproved) {
            // If approved, update the loan status
            const loanPayload = {
                fields: {
                    ...currentData,  // Preserve other fields
                    status: { booleanValue: true },  // Update the status field to approved
                },
            };

            // Update the loan status in Firestore
            await axios.patch(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/loan/${loanId}`, loanPayload);
            setSuccessMessage(`Loan request ${loanId} has been approved.`);

            // Send an email to the customer if the loan is approved
            const customerUserId = currentData.userId.stringValue; // Get the userId (email) from the loan data
            await sendLoanApprovalEmail(customerUserId); // Trigger the email function
        } else {
            // If disapproved, delete the loan document from Firestore
            await axios.delete(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/loan/${loanId}`);
            setSuccessMessage(`Loan request ${loanId} has been disapproved and removed from the records.`);
        }

        fetchLoanRequests();  // Refresh loan data after update
    } catch (error) {
        console.error('Error updating loan status:', error);
        setErrorMessage('🚨 Failed to update loan status. Please try again.');
    }
};



  // Transaction limit field change handler
  const handleTransactionLimitChange = (userId, newLimit) => {
    setTransactionLimits({ ...transactionLimits, [userId]: newLimit });
  };

  return (
    <div>
      <h2>Admin Page</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      
      {/* User Accounts Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User ID</TableCell>
            <TableCell>Accounts Status</TableCell>
            <TableCell>Transaction Limit</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.accounts.length > 0 ? (user.accounts[0].mapValue.fields.status.booleanValue ? 'Active' : 'Inactive') : 'No Accounts'}</TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={transactionLimits[user.id]}
                  onChange={(e) => handleTransactionLimitChange(user.id, e.target.value)}
                  InputProps={{ inputProps: { min: 0 } }} // Only allow positive numbers
                />
              </TableCell>
              <TableCell>
                <Select
                  value={statusSelections[user.id]}
                  onChange={(e) => setStatusSelections({ ...statusSelections, [user.id]: e.target.value })}
                >
                  <MenuItem value="Deactivate">Deactivate</MenuItem>
                  <MenuItem value="Activate">Activate</MenuItem>
                </Select>
                <Button onClick={() => submitStatusChange(user.id)} variant="contained" color="primary">
                  Submit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Loan Requests Table */}
      <h3>Loan Requests</h3>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Loan ID</TableCell>
            <TableCell>User ID</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Purpose</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loans.map(loan => (
            <TableRow key={loan.id}>
              <TableCell>{loan.id}</TableCell>
              <TableCell>{loan.userId}</TableCell>
              <TableCell>{loan.amount}</TableCell>
              <TableCell>{loan.purpose}</TableCell>
              <TableCell>
                <Select
                  value={loanStatusSelections[loan.id]}
                  onChange={(e) => setLoanStatusSelections({ ...loanStatusSelections, [loan.id]: e.target.value })}
                >
                  <MenuItem value="Approved">Approve</MenuItem>
                  <MenuItem value="Pending">Disapprove</MenuItem>
                </Select>
              </TableCell>
              <TableCell>
                <Button onClick={() => submitLoanStatusChange(loan.id)} variant="contained" color="primary">
                  Submit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminPage;

