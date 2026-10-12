import React, { useState, useEffect } from 'react';

export default function App() {
  const [step, setStep] = useState('phone'); // phone, otp, dashboard
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhone(formattedPhone);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otp.trim(), name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('dashboard');
      fetchExpenses();
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchExpenses = async () => {
    const res = await fetch(`http://localhost:5000/api/expenses?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    setExpenses(data);
  };

  const addExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount) return;
    await fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, title, amount: parseFloat(amount), category })
    });
    setTitle('');
    setAmount('');
    setCategory('');
    fetchExpenses();
  };

  const deleteExpense = async (id) => {
    await fetch(`http://localhost:5000/api/expenses/${id}`, { method: 'DELETE' });
    fetchExpenses();
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', color: '#0f172a' }}>Personal Expense Tracker</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {step === 'phone' && (
        <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <input type="text" placeholder="10-digit Mobile Number" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <button type="submit" style={{ padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Send OTP</button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b' }}>OTP sent to {phone}</p>
          <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <button type="submit" style={{ padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Verify & Login</button>
        </form>
      )}

      {step === 'dashboard' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span>Welcome, <strong>{name}</strong></span>
            <button onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>Logout</button>
          </div>

          <form onSubmit={addExpense} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <input type="text" placeholder="Expense Title (e.g. Coffee)" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            <input type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            <input type="text" placeholder="Category (e.g. Food)" value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            <button type="submit" style={{ padding: '8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add Expense</button>
          </form>

          <h3>Your Expenses</h3>
          {expenses.length === 0 ? <p style={{ color: '#64748b' }}>No expenses logged yet.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {expenses.map(exp => (
                <li key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '10px', marginBottom: '8px', borderRadius: '6px' }}>
                  <span>{exp.title} ({exp.category}) - <strong>₹{exp.amount}</strong></span>
                  <button onClick={() => deleteExpense(exp.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}