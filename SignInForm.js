import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Snackbar } from '@mui/material';
import './signIn.css';
const SignInForm = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();

    try {
      await signIn(email, password);
      sessionStorage.setItem('email', email);

      if (email === 'everygame68@gmail.com') {
        alert("Admin sign-in successful!");
        navigate('/admin');
      } else {
        navigate('/customer');
      }
    } catch (error) {
      console.error('Sign in failed', error);
      setErrorMessage('🚨 Sign-in failed! Please check your credentials.');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="bg-container"> 
    <form onSubmit={handleSignIn} style={{ maxWidth: 400, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Sign In
      </Typography>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={errorMessage}
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
      <Button
        variant="contained"
        color="primary"
        type="submit"
        size="small"
        style={{ marginTop: '16px' }}
      >
        Sign In
      </Button>
      <Typography variant="body2" style={{ marginTop: '16px' }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </Typography>
    </form>
    </div>
  );
};

export default SignInForm;
