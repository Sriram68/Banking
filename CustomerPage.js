// export default CustomerPage;
import React, { useState, useEffect } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Box, IconButton, Select, MenuItem, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';

const CustomerPage = () => {
  const [customer, setCustomer] = useState(null);
  const [loanRequests, setLoanRequests] = useState([]);
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [sendMoneyDialogOpen, setSendMoneyDialogOpen] = useState(false);
  const [createAccountDialogOpen, setCreateAccountDialogOpen] = useState(false);
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [selfTransferDialogOpen, setSelfTransferDialogOpen] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  
const [transferData, setTransferData] = useState({
    senderAccount: '',
    receiverAccount: '',
    // transferAmount: '',
});

const [newName, setNewName] = useState('');

  const [loanData, setLoanData] = useState({
    amount: '',
    purpose: '',
    request_id: 2,
    status: false,
  });
  const [sendMoneyData, setSendMoneyData] = useState({
    receiverAccount: '',
    amount: '',
  });
  const [newAccountData, setNewAccountData] = useState({
    account_number: '',
    balance: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const email = sessionStorage.getItem('email');

  const submitSelfTransfer = async () => {
    const { senderAccount, receiverAccount } = transferData;

    if (!senderAccount || !receiverAccount) {
        setErrorMessage('Please fill both account numbers.');
        return;
    }

    // Check if sender and receiver account numbers are the same
    if (senderAccount === receiverAccount) {
        setErrorMessage('Sender and receiver accounts cannot be the same.');
        return;
    }

    const email = sessionStorage.getItem('email'); // Get the session email
    let customerDocId = null; // Initialize customer document ID

    try {
        // Fetch all customer documents
        const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer');
        const allCustomers = response.data.documents;

        // Find the matching customer document by userId
        const matchingCustomer = allCustomers.find(doc => doc.fields.userId.stringValue === email);

        if (!matchingCustomer) {
            setErrorMessage('No customer found with this email.');
            return;
        }

        customerDocId = matchingCustomer.name.split('/').pop(); // Get the document ID

        // Fetch current account information
        const accounts = matchingCustomer.fields.accounts.arrayValue.values;
        const sender = accounts.find(account => account.mapValue.fields.account_number.stringValue === senderAccount);
        const receiver = accounts.find(account => account.mapValue.fields.account_number.stringValue === receiverAccount);

        if (!sender || !receiver) {
            setErrorMessage('Invalid account numbers.');
            return;
        }

        // Get current balances
        const senderBalance = sender.mapValue.fields.balance.integerValue;
        const receiverBalance = parseInt(receiver.mapValue.fields.balance.integerValue, 10);
        const transferAmount = parseInt(prompt('Enter the amount to transfer:'), 10); // Prompt user for amount

        if (transferAmount <= 0 || transferAmount > senderBalance) {
            setErrorMessage('Invalid transfer amount.');
            return;
        }

        // Update balances
        sender.mapValue.fields.balance = { integerValue: senderBalance - transferAmount };
        receiver.mapValue.fields.balance = { integerValue: receiverBalance + transferAmount };

        // Create the updated document payload
        const updatedDocument = {
            fields: {
                ...matchingCustomer.fields, // Preserve existing fields
                accounts: {
                    arrayValue: {
                        values: [...accounts], // Use the updated accounts
                    },
                },
            },
        };

        // Update the Firestore document
        await axios.patch(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer/${customerDocId}`, updatedDocument);

        setSelfTransferDialogOpen(false);
        setTransferData({ senderAccount: '', receiverAccount: '' }); // Reset the transfer data
    } catch (error) {
        console.error('Error during self-transfer:', error); // Log the error for debugging
        setErrorMessage('Failed to complete self-transfer.');
    }
};






  // Function to fetch customer data based on session email
  const fetchCustomerData = async () => {
    try {
      const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer');
      const documents = response.data.documents;
      const matchingCustomer = documents.find((doc) => {
        const userId = doc.fields.userId?.stringValue;
        return userId === email;
      });

      if (matchingCustomer) {
        setCustomer(matchingCustomer.fields);
        fetchLoanRequests(email);
      } else {
        setErrorMessage('No customer found with this email');
      }
    } catch (error) {
      setErrorMessage('Failed to load customer data');
    }
  };

  // Function to fetch loan requests based on userId (email)
  const fetchLoanRequests = async (email) => {
    try {
      const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/loan');
      const documents = response.data.documents;

      const customerLoans = documents.filter((doc) => {
        const userId = doc.fields.userId?.stringValue;
        return userId === email;
      });

      setLoanRequests(customerLoans);
    } catch (error) {
      setErrorMessage('Failed to load loan requests.');
    }
  };

  // Function to submit a new account for the customer
  const submitNewAccount = async () => {
    const { balance } = newAccountData;

    if (!balance) {
      setErrorMessage('Please fill in the initial balance.');
      return;
    }

    try {
      // Fetch all customers to find the correct document by matching userId
      const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer');
      const allCustomers = response.data.documents;

      // Session storage email to match
      const sessionEmail = sessionStorage.getItem('email');
      let customerDocId = null;
      let customerData = null;

      // Find the customer document with the matching userId
      for (const customerDoc of allCustomers) {
        const userId = customerDoc.fields.userId.stringValue;
        if (userId === sessionEmail) {
          customerDocId = customerDoc.name.split('/').pop(); // Extract document ID
          customerData = customerDoc.fields;  // Store all fields in the document
          break;
        }
      }

      if (!customerDocId) {
        setErrorMessage('No customer found with this email.');
        return;
      }

      // Randomly generate a 6-digit account number
      const randomAccountNumber = Math.floor(100000 + Math.random() * 900000).toString();

      // Create the new account object
      const newAccount = {
        mapValue: {
          fields: {
            account_number: { stringValue: randomAccountNumber },
            balance: { integerValue: parseInt(balance) }, // Store balance as integer value
            IFSC_CODE: { stringValue: 'sriram6666' },
            status: { booleanValue: true }, // Set status to true
          },
        },
      };

      // Fetch the existing accounts array from the matched customer document
      const existingAccounts = customerData.accounts.arrayValue.values;

      // Update the Firestore document to add the new account to the existing array
      const updatedAccounts = [...existingAccounts, newAccount];

      // Patch the entire document, keeping all fields unchanged except accounts
      await axios.patch(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer/${customerDocId}`, {
        fields: {
          ...customerData,  // Keep all existing fields
          accounts: {       // Only update the accounts field
            arrayValue: {
              values: updatedAccounts,
            },
          },
        },
      });

      setCreateAccountDialogOpen(false);
      setErrorMessage('');
      setNewAccountData({ balance: '' });
      fetchCustomerData(); // Refresh the customer data
    } catch (error) {
      console.error('Error details:', error);
      setErrorMessage('Failed to create a new account.');
    }
};


    //fetch available accounts
    const fetchAvailableAccounts = async () => {
        const email = sessionStorage.getItem('email'); // Get session email
        try {
          // Fetch the customer document
          const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer');
          const allCustomers = response.data.documents;
      
          // Find the matching customer document by email
          const matchingCustomer = allCustomers.find(doc => doc.fields.userId.stringValue === email);
      
          if (matchingCustomer) {
            const accounts = matchingCustomer.fields.accounts.arrayValue.values.map(account => ({
              account_number: account.mapValue.fields.account_number.stringValue,
              balance: account.mapValue.fields.balance.integerValue,
            }));
            setAvailableAccounts(accounts); // Set the accounts in state
          } else {
            setErrorMessage('No customer found with this email.');
          }
        } catch (error) {
          setErrorMessage('Failed to fetch accounts.');
        }
      };



  // Function to submit a loan request
  const submitLoanRequest = async () => {
    const { amount, purpose } = loanData;

    if (!amount || !purpose) {
      setErrorMessage('Please fill all fields.');
      return;
    }

    const payload = {
      fields: {
        userId: { stringValue: email },
        account_number: { stringValue: customer?.accounts?.arrayValue?.values[0]?.mapValue?.fields?.account_number?.stringValue },
        amount: { integerValue: amount },
        purpose: { stringValue: purpose },
        request_id: { integerValue: loanData.request_id },
        status: { booleanValue: loanData.status },
      },
    };

    try {
      await axios.post('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/loan', payload);
      setLoanDialogOpen(false);
      setErrorMessage('');
      fetchLoanRequests(email);
    } catch (error) {
      setErrorMessage('Failed to submit loan request.');
    }
  };
  const submitEditName = async () => {
    try {
      const email = sessionStorage.getItem('email'); // Get email from session storage
  
      // Fetch all customer documents
      const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer');
      const allCustomers = response.data.documents;
  
      // Find the document where userId matches the session email
      const matchingCustomer = allCustomers.find((doc) => doc.fields.userId.stringValue === email);
  
      if (!matchingCustomer) {
        setErrorMessage('Customer not found.');
        return;
      }
  
      const customerDocId = matchingCustomer.name.split('/').pop(); // Extract document ID
  
      // Get the current document fields to preserve existing data
      const currentData = matchingCustomer.fields;
  
      // Update only the name field, preserving other fields
      const updatedFields = {
        ...currentData, // Preserve existing fields
        name: { stringValue: newName }, // Update only the name field
      };
  
      // Patch the document with the updated fields
      await axios.patch(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer/${customerDocId}`, {
        fields: updatedFields,
      });
  
      setEditNameDialogOpen(false); // Close the dialog
      fetchCustomerData(); // Refresh customer data to reflect the changes
    } catch (error) {
      setErrorMessage('Failed to update name.');
    }
  };
  
  
  // Function to submit send money request
  const submitSendMoneyRequest = async () => {
  const senderEmail = sessionStorage.getItem('email'); // Get the sender's email from session storage
  const amount = parseInt(sendMoneyData.amount, 10); // Get the amount to send from sendMoneyData

  try {
    // Fetch all customers
    const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer');
    const allCustomers = response.data.documents;

    let senderDocId = null;
    let senderBalance = null;
    let receiverDocId = null;
    let receiverBalance = null;
    let senderAccountIndex = null;
    let receiverAccountIndex = null;

    // Loop through all customers to find sender and receiver
    for (const customerDoc of allCustomers) {
      const email = customerDoc.fields.userId.stringValue;
      const accounts = customerDoc.fields.accounts?.arrayValue?.values;

      // Sender logic: Match the session email and the selected sender account
      if (email === senderEmail) {
        senderDocId = customerDoc.name.split('/').pop(); // Get the sender's document ID

        if (accounts) {
          // Find the selected account from the dropdown
          const selectedSenderAccount = sendMoneyData.senderAccount;

          for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            const accountNum = account.mapValue.fields.account_number.stringValue;

            if (accountNum === selectedSenderAccount) { // Match with the selected sender account
              const accountBalanceField = account.mapValue.fields.balance;

              // Store balance as integer only
              senderBalance = accountBalanceField.integerValue ? parseInt(accountBalanceField.integerValue) : 0; // Default to 0 if not found
              senderAccountIndex = i; // Store the sender's account index
              break; // Exit the loop once the selected account is found
            }
          }
        }
      }

      // Receiver logic: Match the account number for the receiver
      if (accounts) {
        for (let i = 0; i < accounts.length; i++) {
          const account = accounts[i];
          const accountNum = account.mapValue.fields.account_number.stringValue;

          if (accountNum === sendMoneyData.receiverAccount) {
            receiverDocId = customerDoc.name.split('/').pop(); // Get the receiver's document ID
            const accountBalanceField = account.mapValue.fields.balance;

            // Store balance as integer only
            receiverBalance = accountBalanceField.integerValue ? parseInt(accountBalanceField.integerValue) : 0; // Default to 0 if not found
            receiverAccountIndex = i; // Store the receiver's account index
            break; // Exit the loop once the balance is found
          }
        }
      }

      // Check if the sender and receiver are found
      if (senderDocId && receiverDocId) break;
    }

    // Error checks for sender and receiver
    if (!senderDocId) {
      setErrorMessage('Sender not found.');
      return;
    }
    if (!receiverDocId) {
      setErrorMessage('No user found with this account number.');
      return;
    }

    // Check if the sender and receiver accounts are the same
    if (senderAccountIndex === receiverAccountIndex && senderDocId === receiverDocId) {
      setErrorMessage('You cannot send money to the same account.');
      return;
    }

    // Check if sender and receiver are the same person (self-transfer)
    const receiverEmail = allCustomers.find(doc => doc.name.split('/').pop() === receiverDocId)?.fields.userId.stringValue;
    if (receiverEmail === senderEmail) {
      setErrorMessage('You cannot send money to your own accounts.');
      return;
    }

    if (senderBalance < amount) {
      setErrorMessage('Insufficient balance.');
      return;
    }

    // Fetch sender and receiver docs
    const senderDocResponse = await axios.get(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer/${senderDocId}`);
    const senderDocData = senderDocResponse.data.fields;

    const receiverDocResponse = await axios.get(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer/${receiverDocId}`);
    const receiverDocData = receiverDocResponse.data.fields;

    // Update sender's balance (for the selected account)
    const updatedSenderBalance = senderBalance - amount;
    senderDocData.accounts.arrayValue.values[senderAccountIndex].mapValue.fields.balance = {
      integerValue: updatedSenderBalance // Store balance as integer value
    };

    // Update receiver's balance
    const updatedReceiverBalance = receiverBalance + amount;
    receiverDocData.accounts.arrayValue.values[receiverAccountIndex].mapValue.fields.balance = {
      integerValue: updatedReceiverBalance // Store balance as integer value
    };

    // Patch the sender and receiver documents
    await axios.patch(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer/${senderDocId}`, {
      fields: { ...senderDocData }
    });

    await axios.patch(`https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer/${receiverDocId}`, {
      fields: { ...receiverDocData }
    });

    setSendMoneyDialogOpen(false);
    setErrorMessage('');
  } catch (error) {
    console.error("Error details:", error); // Log error details to console
    setErrorMessage('Failed to send money: ' + error.message); // Update error message
  }
};

    const navigate=useNavigate();
    const handleNavigate=()=>{
        navigate('/transferDiff');
    }


  useEffect(() => {
    fetchCustomerData(); // Call fetchCustomerData when component mounts
  }, [email]);

  return (
    <Box sx={{ padding: 4 }}>
      {customer ? (
        <div>
          <Typography variant="h5" sx={{ marginTop: 3 }}>Accounts</Typography>
            <Table sx={{ marginBottom: 3 }} size="small">
            <TableHead>
                <TableRow>
                <TableCell>Account Number</TableCell>
                <TableCell>Balance</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {customer?.accounts?.arrayValue?.values.map((account, index) => (
                <TableRow key={index}>
                    <TableCell>{account.mapValue.fields.account_number.stringValue}</TableCell>
                    <TableCell>{account.mapValue.fields.balance?.integerValue !== undefined ? account.mapValue.fields.balance.integerValue : 0}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>


          {/* Loan Request Button */}
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setLoanDialogOpen(true)}
            sx={{ marginTop: 2 }}
          >
            Request Loan
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleNavigate} 
            sx={{ marginTop: 2, marginLeft: 2 }}
            >
            Transfer Money to Another Bank
            </Button>

          {/* Send Money Button */}
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={() => {
                fetchAvailableAccounts(); // Fetch the available accounts when button is clicked
                setSendMoneyDialogOpen(true); // Open the Send Money dialog
            }} 
            sx={{ marginTop: 2, marginLeft: 2 }}
            >
            Send Money
            </Button>

          {/* Add New Account Button */}
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setCreateAccountDialogOpen(true)}
            sx={{ marginTop: 2, marginLeft: 2 }}
          >
            Add New Account
          </Button>
          {customer.accounts.arrayValue.values.length >= 2 && (
        <Button
            variant="contained"
            color="primary"
            onClick={() => setSelfTransferDialogOpen(true)}
            sx={{ marginTop: 2 }}
        >
            Self Transfer
        </Button>
    )}

          {/* Display loan requests */}
          <Typography variant="h5" sx={{ marginTop: 4 }}>Loan Requests</Typography>
        <Table size="small">
        <TableHead>
            <TableRow>
            <TableCell>Amount</TableCell>
            <TableCell>Purpose</TableCell>
            <TableCell>Status</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {loanRequests.length > 0 ? (
            loanRequests.map((loan, index) => (
                <TableRow key={index}>
                <TableCell>{loan.fields.amount.integerValue}</TableCell>
                <TableCell>{loan.fields.purpose.stringValue}</TableCell>
                <TableCell>{loan.fields.status.booleanValue ? 'Approved' : 'Pending'}</TableCell>
                </TableRow>
            ))
            ) : (
            <TableRow>
                <TableCell colSpan={3}>
                <Typography>No loan requests found.</Typography>
                </TableCell>
            </TableRow>
            )}
        </TableBody>
        </Table>

        </div>
      ) : (
        <Typography color="error">{errorMessage || 'Loading customer data...'}</Typography>
      )}
    {/*edit name dialog*/}
    <Dialog open={editNameDialogOpen} onClose={() => setEditNameDialogOpen(false)}>
  <DialogTitle>Edit Name</DialogTitle>
  <DialogContent>
    <TextField
      autoFocus
      margin="dense"
      label="New Name"
      type="text"
      fullWidth
      variant="outlined"
      value={newName}
      onChange={(e) => setNewName(e.target.value)}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setEditNameDialogOpen(false)} color="primary">Cancel</Button>
    <Button onClick={submitEditName} color="primary">Submit</Button>
  </DialogActions>
</Dialog>

      {/* Loan Request Dialog */}
      <Dialog open={loanDialogOpen} onClose={() => setLoanDialogOpen(false)}>
        <DialogTitle>Request a Loan</DialogTitle>
        <DialogContent>
          <TextField 
            autoFocus 
            margin="dense" 
            label="Amount" 
            type="number" 
            name="amount" 
            fullWidth 
            variant="outlined" 
            value={loanData.amount} 
            onChange={(e) => setLoanData({ ...loanData, amount: e.target.value })}
          />
          <TextField 
            margin="dense" 
            label="Purpose" 
            type="text" 
            name="purpose" 
            fullWidth 
            variant="outlined" 
            value={loanData.purpose} 
            onChange={(e) => setLoanData({ ...loanData, purpose: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoanDialogOpen(false)} color="primary">Cancel</Button>
          <Button onClick={submitLoanRequest} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Send Money Dialog */}
      <Dialog open={sendMoneyDialogOpen} onClose={() => setSendMoneyDialogOpen(false)}>
  <DialogTitle>Send Money</DialogTitle>
  <DialogContent>
    {/* Sender Account Dropdown */}
    <Typography>Select Sender Account:</Typography>
    <Select
      fullWidth
      value={sendMoneyData.senderAccount}
      onChange={(e) => setSendMoneyData({ ...sendMoneyData, senderAccount: e.target.value })}
    >
      {availableAccounts.map((account, index) => (
        <MenuItem key={index} value={account.account_number}>
          {account.account_number} - Balance: {account.balance}
        </MenuItem>
      ))}
    </Select>
    <TextField
      margin="dense"
      label="Receiver Account"
      type="text"
      fullWidth
      variant="outlined"
      value={sendMoneyData.receiverAccount}
      onChange={(e) => setSendMoneyData({ ...sendMoneyData, receiverAccount: e.target.value })}
    />
    <TextField
      margin="dense"
      label="Amount"
      type="number"
      fullWidth
      variant="outlined"
      value={sendMoneyData.amount}
      onChange={(e) => setSendMoneyData({ ...sendMoneyData, amount: e.target.value })}
    />
    {errorMessage && <Typography color="error">{errorMessage}</Typography>}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setSendMoneyDialogOpen(false)} color="primary">Cancel</Button>
    <Button onClick={submitSendMoneyRequest} color="primary">Send</Button>
  </DialogActions>
</Dialog>
      {/* Self Transfer Dialog */}
      <Dialog open={selfTransferDialogOpen} onClose={() => setSelfTransferDialogOpen(false)}>
    <DialogTitle>Self Transfer</DialogTitle>
    <DialogContent>
        <TextField 
            autoFocus 
            margin="dense" 
            label="Sender Account" 
            type="text" 
            fullWidth 
            variant="outlined" 
            value={transferData.senderAccount} 
            onChange={(e) => setTransferData({ ...transferData, senderAccount: e.target.value })}
        />
        <TextField 
            margin="dense" 
            label="Receiver Account" 
            type="text" 
            fullWidth 
            variant="outlined" 
            value={transferData.receiverAccount} 
            onChange={(e) => setTransferData({ ...transferData, receiverAccount: e.target.value })}
        />
        {errorMessage && <Typography color="error">{errorMessage}</Typography>}
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setSelfTransferDialogOpen(false)} color="primary">Cancel</Button>
        <Button onClick={submitSelfTransfer} color="primary">Transfer</Button>
    </DialogActions>
</Dialog>




      {/* Create New Account Dialog */}
      <Dialog open={createAccountDialogOpen} onClose={() => setCreateAccountDialogOpen(false)}>
        <DialogTitle>Create a New Account</DialogTitle>
        <DialogContent>
          {/* <TextField 
            autoFocus 
            margin="dense" 
            label="Account Number" 
            type="text" 
            name="account_number" 
            fullWidth 
            variant="outlined" 
            value={newAccountData.account_number} 
            onChange={(e) => setNewAccountData({ ...newAccountData, account_number: e.target.value })}
          /> */}
          <TextField 
            margin="dense" 
            label="Initial Balance" 
            type="number" 
            name="balance" 
            fullWidth 
            variant="outlined" 
            value={newAccountData.balance} 
            onChange={(e) => setNewAccountData({ ...newAccountData, balance: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAccountDialogOpen(false)} color="primary">Cancel</Button>
          <Button onClick={submitNewAccount} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerPage;