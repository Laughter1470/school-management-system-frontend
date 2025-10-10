import React, { useState } from 'react';
import './Dashboard.css';
import { supabase } from './supabase';

// Define props interface
interface DashboardPageProps {
  students: { id: string; name: string; email: string }[];
  setStudents: React.Dispatch<
    React.SetStateAction<{ id: string; name: string; email: string }[]>
  >;
}

function DashboardPage({ students, setStudents }: DashboardPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate inputs
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Please fill in both name and email fields.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Save to Supabase
    const { error } = await supabase.from('students').insert([{ name, email }]);
    if (error) {
      setErrorMessage('Failed to add student: ' + error.message);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Update local state
    const newStudent = {
      id: Math.random().toString(), // Temporary ID (we'll fetch real ID in next step)
      name,
      email,
    };
    setStudents([...students, newStudent]);
    setSuccessMessage(`Student added: ${name}, ${email}`);
    setName('');
    setEmail('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="dashboard-container">
      <h2>Student Dashboard</h2>
      <p>Welcome to the school management system!</p>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="submit-button">
          Add Student
        </button>
      </form>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <ul className="student-list">
        {students.length === 0 ? (
          <p>No students yet.</p>
        ) : (
          students.map((student) => (
            <li key={student.id} className="student-item">
              {student.name} ({student.email})
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default DashboardPage;
