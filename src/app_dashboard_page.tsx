import React, { useState } from 'react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Temporarily add student to state (no Supabase yet)
    const newStudent = {
      id: Math.random().toString(), // Temporary ID until Supabase is added
      name,
      email,
    };
    setStudents([...students, newStudent]);
    setName('');
    setEmail('');
    alert(`Student added: ${name}, ${email}`);
  };

  return (
    <div>
      <h2>Student Dashboard</h2>
      <p>Welcome to the school management system!</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit">Add Student</button>
      </form>
      <ul>
        {students.length === 0 ? (
          <p>No students yet.</p>
        ) : (
          students.map((student) => (
            <li key={student.id}>
              {student.name} ({student.email})
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default DashboardPage;
