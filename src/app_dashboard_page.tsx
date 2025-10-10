import React, { useState } from 'react';
import './Dashboard.css';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Temporarily add student to state (no Supabase yet)
    const newStudent = {
      id: Math.random().toString(), // Temporary ID until Supabase is added
      name,
      email,
    };
    setStudents([...students, newStudent]);
    setSuccessMessage(`Student added: ${name}, ${email}`);
    setName('');
    setEmail('');
    // Clear success message after 3 seconds
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
