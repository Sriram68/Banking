import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, TextField, Typography, MenuItem, Select, InputLabel, FormControl, Grid, Paper } from '@mui/material';

export default function MoneyTransfer() {
  const [senderAccounts, setSenderAccounts] = useState([]);
  const [senderAccountNumber, setSenderAccountNumber] = useState('');
  const [receiverIFSC, setReceiverIFSC] = useState('');
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isTransferOtherBank, setIsTransferOtherBank] = useState(false);

  const sessionEmail = sessionStorage.getItem('email');

  useEffect(() => {
    const fetchSenderAccounts = async () => {
      try {
        const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer');
        const allCustomers = response.data.documents;
        const matchingCustomer = allCustomers.find(doc => doc.fields.userId.stringValue === sessionEmail);

        if (!matchingCustomer) {
          setErrorMessage('No customer found with this email.');
          return;
        }

        const accountsData = matchingCustomer.fields.accounts.arrayValue.values;
        setSenderAccounts(accountsData);
      } catch (error) {
        console.error('Error fetching sender accounts:', error);
        setErrorMessage('Error fetching sender accounts. Please try again.');
      }
    };
    fetchSenderAccounts();
  }, [sessionEmail]);

  const transferMoney = async (selectedSenderAccount) => {
    if (!selectedSenderAccount) {
      setErrorMessage('Please select a valid sender account.');
      return;
    }

    const senderBalance = parseInt(selectedSenderAccount.mapValue.fields.balance.integerValue, 10);

    if (parseInt(amount, 10) > senderBalance) {
      setErrorMessage('Insufficient balance.');
      return;
    }

    try {
      const senderEmail = sessionStorage.getItem('email');
      const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer');
      const allCustomers = response.data.documents;
      const matchingCustomer = allCustomers.find(doc => doc.fields.userId.stringValue === senderEmail);

      if (!matchingCustomer) {
        setErrorMessage('No customer found with this email.');
        return;
      }

      const customerDocId = matchingCustomer.name.split('/').pop();
      const existingFields = matchingCustomer.fields;

      const updatedBalance = senderBalance - parseInt(amount, 10);
      const updatedAccounts = existingFields.accounts.arrayValue.values.map(account => {
        if (parseInt(account.mapValue.fields.account_number.stringValue, 10) === parseInt(selectedSenderAccount.mapValue.fields.account_number.stringValue, 10)) {
          account.mapValue.fields.balance.integerValue = updatedBalance;
        }
        return account;
      });

      const updatedDocument = {
        fields: {
          ...existingFields,
          accounts: {
            arrayValue: {
              values: updatedAccounts
            }
          }
        }
      };

      const senderAccountUrl = `https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer/${customerDocId}`;
      await axios.patch(senderAccountUrl, updatedDocument);

      const transactionMap = {
        senderAccountNumber: { integerValue: parseInt(senderAccountNumber, 10) },
        creditAmount: { integerValue: parseInt(amount, 10) }
      };

      const receiverAccountKey = receiverAccountNumber.toString();
      const receiverUrl = `https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db/${receiverIFSC}`;
      const receiverBank = await axios.get(receiverUrl);
      const receiverAccounts = receiverBank.data.fields || {};

      if (receiverAccountKey in receiverAccounts) {
        const accountArray = receiverAccounts[receiverAccountKey].arrayValue.values;
        accountArray.push({ mapValue: { fields: transactionMap } });
      } else {
        receiverAccounts[receiverAccountKey] = {
          arrayValue: {
            values: [{ mapValue: { fields: transactionMap } }]
          }
        };
      }

      const updateUrl = `https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db/${receiverIFSC}`;
      const updatedReceiverData = {
        fields: {
          ...receiverAccounts,
          [receiverAccountKey]: {
            arrayValue: {
              values: receiverAccounts[receiverAccountKey].arrayValue.values
            }
          }
        }
      };

      await axios.patch(updateUrl, updatedReceiverData);
      setSuccessMessage('Transfer successful.');
    } catch (error) {
      console.error('Error during money transfer:', error);
      setErrorMessage('Error during transfer. Please try again.');
    }
  };

  const selectedSenderAccount = senderAccounts.find(account =>
    parseInt(account.mapValue.fields.account_number.stringValue, 10) === parseInt(senderAccountNumber, 10)
  );

  const retrieveAndCreditAmount = async () => {
    try {
      const senderEmail = sessionStorage.getItem('email');
      const response = await axios.get('https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer');
      const allCustomers = response.data.documents;
      const matchingCustomer = allCustomers.find(doc => doc.fields.userId.stringValue === senderEmail);

      if (!matchingCustomer) {
        setErrorMessage('No customer found with this email.');
        return;
      }

      const customerDocId = matchingCustomer.name.split('/').pop();
      const customerAccounts = matchingCustomer.fields.accounts.arrayValue.values;
      const userIFSCCode = 'sriram6666';

      const commonDbResponse = await axios.get(`https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db/${userIFSCCode}`);
      const commonDbAccounts = commonDbResponse.data.fields || {};
      console.log(commonDbAccounts);

      for (const account of customerAccounts) {
        const accountNumber = account.mapValue.fields.account_number.stringValue;
        console.log(accountNumber);

        if (commonDbAccounts[accountNumber]) {
          const transactions = commonDbAccounts[accountNumber].arrayValue.values;

          if (transactions.length > 0) {
            const creditTransaction = transactions[0];
            const creditAmount = parseInt(creditTransaction.mapValue.fields.creditAmount.integerValue, 10);
            console.log(creditAmount);
            account.mapValue.fields.balance.integerValue = parseInt(account.mapValue.fields.balance.integerValue) + parseInt(creditAmount);
            console.log(creditAmount);
            transactions.splice(0, 1);
            console.log(transactions);
            console.log(transactions.splice(0, 1));

            const updatedCustomerData = {
              fields: {
                ...matchingCustomer.fields,
                accounts: {
                  arrayValue: {
                    values: customerAccounts,
                  },
                },
              },
            };
            console.log(updatedCustomerData);
            const customerUpdateUrl = `https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/customer/${customerDocId}`;
            console.log(customerUpdateUrl);
            await axios.patch(customerUpdateUrl, updatedCustomerData);

            const clearPayload = {
              fields: {
                ...commonDbAccounts, // Keep all other fields intact
                [accountNumber]: {
                  arrayValue: {
                    values: [] // Clear the transaction array
                  }
                }
              }
            };
            const commonDbUpdateUrl = `https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db/${userIFSCCode}`;
            await axios.patch(commonDbUpdateUrl, clearPayload);

            console.log(`Transactions cleared for account ${accountNumber}.`);
          }
          setSuccessMessage(`Amount credited successfully.`);
          return;
        }
      }
    } catch (error) {
      console.error('Error retrieving and crediting amount:', error);
      setErrorMessage('Failed to retrieve and credit the amount. Please try again.');
    }
  };

  return (
    <Grid container justifyContent="center" alignItems="center" style={{ minHeight: '100vh' }}>
      <Grid item xs={12} md={6}>
        <Paper elevation={3} style={{ padding: '20px', backgroundColor: '#f4f6f9' }}>
          <Typography variant="h5" align="center" gutterBottom>Money Transfer</Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel id="sender-account-label">Sender Account Number</InputLabel>
            <Select
              labelId="sender-account-label"
              value={senderAccountNumber}
              onChange={(e) => setSenderAccountNumber(e.target.value)}
            >
              {senderAccounts.map(account => (
                <MenuItem
                  key={account.mapValue.fields.account_number.stringValue}
                  value={account.mapValue.fields.account_number.stringValue}
                >
                  {account.mapValue.fields.account_number.stringValue}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => setIsTransferOtherBank(!isTransferOtherBank)}
            style={{ marginTop: '20px' }}
          >
            {isTransferOtherBank ? "Transfer within same bank" : "Transfer to another bank"}
          </Button>

          {isTransferOtherBank && (
            <TextField
              label="Receiver IFSC"
              fullWidth
              value={receiverIFSC}
              onChange={(e) => setReceiverIFSC(e.target.value)}
              margin="normal"
            />
          )}

          <TextField
            label="Receiver Account Number"
            fullWidth
            value={receiverAccountNumber}
            onChange={(e) => setReceiverAccountNumber(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Amount"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            margin="normal"
          />

          <Button variant="contained" color="primary" fullWidth onClick={() => transferMoney(selectedSenderAccount)} style={{ marginTop: '20px' }}>
            Transfer
          </Button>

          {errorMessage && <Typography color="error" align="center">{errorMessage}</Typography>}
          {successMessage && <Typography color="success" align="center">{successMessage}</Typography>}

          <Typography variant="h6" align="center" gutterBottom style={{ marginTop: '40px' }}>Retrieve and Credit Amount</Typography>
          <Button variant="contained" color="secondary" fullWidth onClick={retrieveAndCreditAmount}>
            Retrieve and Credit Amount
          </Button>

          {errorMessage && <Typography color="error" align="center">{errorMessage}</Typography>}
          {successMessage && <Typography color="success" align="center">{successMessage}</Typography>}
        </Paper>
      </Grid>
    </Grid>
  );
}
