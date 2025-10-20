import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

// Define props interface
interface DashboardPageProps {
  students: { id: string; name: string; email: string }[];
  setStudents: React.Dispatch<React.SetStateAction<{ id: string; name: string; email: string }[]>>;
}

function DashboardPage({ students, setStudents }: DashboardPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'email'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter and sort students
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const sortedStudents = [...filteredStudents].sort((a, b) => {
      const fieldA = a[sortField].toLowerCase();
      const fieldB = b[sortField].toLowerCase();
      if (sortOrder === 'asc') {
        return fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
      } else {
        return fieldA > fieldB ? -1 : fieldA < fieldB ? 1 : 0;
      }
    });
    setStudents(sortedStudents);
  }, [sortField, sortOrder, students, searchQuery, setStudents]);

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
        const errorMsg = error.code === '23505'
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
      const { data, error } = await supabase.from('students').insert([{ name, email }]).select();
      if (error) {
        const errorMsg = error.code === '23505'
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
    <div className="p-6 max-w-2xl mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Student Dashboard</h2>
      <p className="text-gray-600 mb-6">Welcome to the school management system!</p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-col">
          <label htmlFor="name" className="mb-1 font-semibold text-gray-700">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="p-2 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="email" className="mb-1 font-semibold text-gray-700">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="p-2 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Submitting...' : editingStudentId ? 'Update Student' : 'Add Student'}
          </button>
          {editingStudentId && (
            <button
              type="button"
              className={`px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleCancelEdit}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      {successMessage && (
        <p className="mt-4 text-green-600 font-semibold">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="mt-4 text-red-600 font-semibold">{errorMessage}</p>
      )}
      <div className="mt-4 flex space-x-2">
        <label htmlFor="search" className="text-gray-700 font-semibold">Search:</label>
        <input
          type="text"
          id="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email"
          className="p-2 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mt-4 flex space-x-2">
        <label htmlFor="sortField" className="text-gray-700 font-semibold">Sort by:</label>
        <select
          id="sortField"
          value={sortField}
          onChange={(e) => setSortField(e.target.value as 'name' | 'email')}
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Name</option>
          <option value="email">Email</option>
        </select>
        <label htmlFor="sortOrder" className="text-gray-700 font-semibold">Order:</label>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      {loading ? (
        <p className="mt-4 text-gray-600">Loading...</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {filteredStudents.length === 0 ? (
            <p className="text-gray-600">No students found.</p>
          ) : (
            filteredStudents.map((student) => (
              <li key={student.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded">
                <span className="text-gray-800">{student.name} ({student.email})</span>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleEdit(student)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className={`px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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