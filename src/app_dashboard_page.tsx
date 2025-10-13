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
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

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

    setLoading(true);
    if (editingStudentId) {
      // Check if email is unchanged or not a duplicate for update
      const currentStudent = students.find((s) => s.id === editingStudentId);
      if (currentStudent?.email !== email) {
        const { data: existing } = await supabase
          .from('students')
          .select('id')
          .eq('email', email)
          .neq('id', editingStudentId);
        if (existing && existing.length > 0) {
          setErrorMessage('This email is already in use by another student.');
          setTimeout(() => setErrorMessage(''), 3000);
          setLoading(false);
          return;
        }
      }
      // Update existing student in Supabase
      const { data, error } = await supabase
        .from('students')
        .update({ name, email })
        .eq('id', editingStudentId)
        .select();
      if (error) {
        const errorMsg =
          error.code === '23505'
            ? 'This email is already in use by another student.'
            : 'Failed to update student: ' + error.message;
        setErrorMessage(errorMsg);
        setTimeout(() => setErrorMessage(''), 3000);
        setLoading(false);
        return;
      }
      if (data && data.length > 0) {
        setStudents(
          students.map((student) =>
            student.id === editingStudentId ? data[0] : student
          )
        );
        setSuccessMessage(`Student updated: ${name}, ${email}`);
      }
    } else {
      // Check for duplicate email before adding
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('email', email);
      if (existing && existing.length > 0) {
        setErrorMessage('This email is already in use by another student.');
        setTimeout(() => setErrorMessage(''), 3000);
        setLoading(false);
        return;
      }
      // Add new student to Supabase
      const { data, error } = await supabase
        .from('students')
        .insert([{ name, email }])
        .select();
      if (error) {
        const errorMsg =
          error.code === '23505'
            ? 'This email is already in use by another student.'
            : 'Failed to add student: ' + error.message;
        setErrorMessage(errorMsg);
        setTimeout(() => setErrorMessage(''), 3000);
        setLoading(false);
        return;
      }
      if (data && data.length > 0) {
        setStudents([...students, data[0]]);
        setSuccessMessage(`Student added: ${name}, ${email}`);
      }
    }

    setName('');
    setEmail('');
    setEditingStudentId(null);
    setTimeout(() => setSuccessMessage(''), 3000);
    setLoading(false);
  };

  const handleEdit = (student: { id: string; name: string; email: string }) => {
    setName(student.name);
    setEmail(student.email);
    setEditingStudentId(student.id);
  };

  const handleCancelEdit = () => {
    setName('');
    setEmail('');
    setEditingStudentId(null);
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
          {loading
            ? 'Submitting...'
            : editingStudentId
              ? 'Update Student'
              : 'Add Student'}
        </button>
        {editingStudentId && (
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancelEdit}
            disabled={loading}
          >
            Cancel
          </button>
        )}
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
                <div>
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(student)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(student.id, student.name)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default DashboardPage;
