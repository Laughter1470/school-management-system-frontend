import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);

  // Email validation regex
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fetch students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('students').select('*');
      if (error) {
        setErrorMessage('Failed to fetch students: ' + error.message);
        setTimeout(() => setErrorMessage(''), 3000);
      } else {
        setStudents(data || []);
      }
      setLoading(false);
    };
    fetchStudents();
  }, [setStudents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate inputs
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Please fill in both name and email fields.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Save to Supabase
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .insert([{ name, email }])
      .select();
    if (error) {
      setErrorMessage('Failed to add student: ' + error.message);
      setTimeout(() => setErrorMessage(''), 3000);
      setLoading(false);
      return;
    }

    // Update local state with real data from Supabase
    if (data && data.length > 0) {
      setStudents([...students, data[0]]);
      setSuccessMessage(`Student added: ${name}, ${email}`);
      setName('');
      setEmail('');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      setErrorMessage('Failed to delete student: ' + error.message);
      setTimeout(() => setErrorMessage(''), 3000);
      setLoading(false);
      return;
    }

    // Update local state to remove deleted student
    setStudents(students.filter((student) => student.id !== id));
    setSuccessMessage(`Student ${name} deleted successfully.`);
    setTimeout(() => setSuccessMessage(''), 3000);
    setLoading(false);
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
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Submitting...' : 'Add Student'}
        </button>
      </form>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="student-list">
          {students.length === 0 ? (
            <p>No students yet.</p>
          ) : (
            students.map((student) => (
              <li key={student.id} className="student-item">
                {student.name} ({student.email})
                <button
                  className="delete-button"
                  onClick={() => handleDelete(student.id, student.name)}
                  disabled={loading}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default DashboardPage;
