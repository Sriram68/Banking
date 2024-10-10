import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios'; // Import Axios
import { TextField, Button, Grid, Typography, Snackbar } from '@mui/material';
import './signIn.css';

const SignUpForm = () => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSignUp = (e) => {
    e.preventDefault();

    // Sign up the user
    signUp(email, password)
      .then(user => {
        console.log('User signed up:', user); // Log the user object

        if (user) {
          convertFileToBase64(aadhaarFile, (aadhaarBase64) => {
            console.log('Aadhaar file converted to base64:', aadhaarBase64);
            convertFileToBase64(panFile, (panBase64) => {
              console.log('PAN file converted to base64:', panBase64);
              const randomAccountNumber = generateRandomAccountNumber();
              const customerId = generateRandomCustomerId();

              // Prepare the customer data object
              const customerData = {
                documentId: email,
                aadhaar: aadhaarBase64,
                pan: panBase64,
                accounts: [{
                  account_number: randomAccountNumber,
                  balance: 1000,
                  status: false, // Set default status to false
                }],
                customer_id: customerId,
                deposit: 0,
                mobile,
                name,
              };

              console.log('Customer data prepared for Firestore:', customerData);

              // Call the function to add the user to Firestore
              addUserToCreationTable(customerData);
            });
          });
        }
      })
      .catch(error => {
        console.error('Sign up failed', error);
        setErrorMessage('🚨 Oops! Something went wrong with sign-up.');
        setSuccessMessage(''); // Clear previous success messages
        setSnackbarOpen(true);
      });
  };

  const convertFileToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(',')[1]; // Get Base64 string
      callback(base64String);
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      setErrorMessage('🚨 Failed to convert file to base64.');
      setSnackbarOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const generateRandomAccountNumber = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const generateRandomCustomerId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Using axios to POST data
  const addUserToCreationTable = (userData) => {
    const documentId = userData.documentId; // Assuming this is the email

    // Log the payload to debug
    console.log('Payload to Firestore:', {
      fields: {
        aadhaar: { stringValue: userData.aadhaar },
        pan: { stringValue: userData.pan },
        accounts: {
          arrayValue: {
            values: userData.accounts.map((account) => ({
              mapValue: {
                fields: {
                  account_number: { stringValue: account.account_number },
                  balance: { integerValue: account.balance },
                  status: { booleanValue: account.status }, // Correctly set the status as boolean
                },
              },
            })),
          },
        },
        customer_id: { stringValue: userData.customer_id },
        deposit: { integerValue: userData.deposit },
        mobile: { stringValue: userData.mobile },
        name: { stringValue: userData.name },
      },
    });

    return axios.patch(
      `https://firestore.googleapis.com/v1/projects/bankmanagement-53cc4/databases/(default)/documents/creation/${documentId}`,
      {
        fields: {
          aadhaar: { stringValue: userData.aadhaar },
          pan: { stringValue: userData.pan },
          accounts: {
            arrayValue: {
              values: userData.accounts.map((account) => ({
                mapValue: {
                  fields: {
                    account_number: { stringValue: account.account_number },
                    balance: { integerValue: account.balance },
                    status: { booleanValue: account.status }, // Correctly set the status as boolean
                  },
                },
              })),
            },
          },
          customer_id: { stringValue: userData.customer_id },
          deposit: { integerValue: userData.deposit },
          mobile: { stringValue: userData.mobile },
          name: { stringValue: userData.name },
        },
      }
    )
    .then(response => {
      console.log('User added to Firestore creation table:', response.data);
      setSuccessMessage('User added successfully!'); // Set success message
      setSnackbarOpen(true);
      return response.data;
    })
    .catch(error => {
      // Detailed error logging
      if (error.response) {
        console.error('Error adding user to Firestore:', error.response.data);
        setErrorMessage(`🚨 ${error.response.data.error.message}`);
      } else {
        console.error('Error adding user to Firestore:', error.message);
        setErrorMessage('🚨 Failed to add user to the creation table. Try again!');
      }
      setSnackbarOpen(true);
      return null;
    });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="bg-container">
    <form onSubmit={handleSignUp} style={{ maxWidth: 400, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Sign Up
      </Typography>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={errorMessage || successMessage}
      />
      <TextField
        variant="outlined"
        size="small"
        fullWidth
        margin="normal"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
      />
      <TextField
        variant="outlined"
        size="small"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <TextField
        variant="outlined"
        size="small"
        fullWidth
        margin="normal"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <TextField
        variant="outlined"
        size="small"
        fullWidth
        margin="normal"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        placeholder="Mobile"
        required
      />

      {/* Aadhaar Upload Button */}
      <Button
        variant="outlined"
        size="small"
        component="label"
        style={{ margin: '8px 0' }}
      >
        Upload Aadhaar
        <input
          type="file"
          hidden
          accept="application/pdf,image/*"
          onChange={(e) => {
            setAadhaarFile(e.target.files[0]);
          }}
          required
        />
      </Button>
      {/* Displaying Aadhaar file name */}
      {aadhaarFile && (
        <Typography variant="body2" style={{ margin: '8px 0' }}>
          Aadhaar File: {aadhaarFile.name}
        </Typography>
      )}

      {/* PAN Upload Button */}
      <Button
        variant="outlined"
        size="small"
        component="label"
        style={{ margin: '8px 0' }}
      >
        Upload PAN
        <input
          type="file"
          hidden
          accept="application/pdf,image/*"
          onChange={(e) => {
            setPanFile(e.target.files[0]);
          }}
          required
        />
      </Button>
      {/* Displaying PAN file name */}
      {panFile && (
        <Typography variant="body2" style={{ margin: '8px 0' }}>
          PAN File: {panFile.name}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        type="submit"
        size="small"
        style={{ marginTop: '16px' }}
      >
        Sign Up
      </Button>
      <Typography variant="body2" style={{ marginTop: '16px' }}>
        Already have an account? <Link to="/">Sign In</Link>
      </Typography>
    </form>
    </div>
  );
};

export default SignUpForm;
