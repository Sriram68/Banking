import React, { useState } from 'react';

const LoanRequestForm = () => {
  const [formData, setFormData] = useState({
    loanAmount: '',
    loanTerm: '',
    loanPurpose: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Perform validation here
    console.log('Loan Requested', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Request Loan</h2>
      <label>
        Loan Amount:
        <input
          type="number"
          name="loanAmount"
          value={formData.loanAmount}
          onChange={handleChange}
          required
        />
      </label>
      <br />
      <label>
        Loan Term (in years):
        <input
          type="number"
          name="loanTerm"
          value={formData.loanTerm}
          onChange={handleChange}
          required
        />
      </label>
      <br />
      <label>
        Loan Purpose:
        <input
          type="text"
          name="loanPurpose"
          value={formData.loanPurpose}
          onChange={handleChange}
          required
        />
      </label>
      <br />
      <button type="submit">Submit Loan Request</button>
    </form>
  );
};

export default LoanRequestForm;
