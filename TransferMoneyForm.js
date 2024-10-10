import React, { useState } from 'react';

const TransferMoneyForm = () => {
  const [formData, setFormData] = useState({
    recipientAccount: '',
    amount: '',
    description: ''
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
    console.log('Money Transferred', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Transfer Money</h2>
      <label>
        Recipient Account Number:
        <input
          type="text"
          name="recipientAccount"
          value={formData.recipientAccount}
          onChange={handleChange}
          required
        />
      </label>
      <br />
      <label>
        Amount:
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
        />
      </label>
      <br />
      <label>
        Description:
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </label>
      <br />
      <button type="submit">Transfer</button>
    </form>
  );
};

export default TransferMoneyForm;
