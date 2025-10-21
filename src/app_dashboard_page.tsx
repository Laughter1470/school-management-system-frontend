import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';
import debounce from 'lodash/debounce';

// Define props interface
interface DashboardPageProps {
  students: { id: string; name: string; email: string }[];
  setStudents: React.Dispatch<React.SetStateAction<{ id: string; name: string; email: string }[]>>;
}

// Spinner component
const Spinner = () => (
  <div className="flex justify-center items-center mt-4">
    <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function DashboardPage({ students, setStudents }: DashboardPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'email'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState('light');
  const studentsPerPage = 5;

  // Theme toggle
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    console.log('Theme set to:', savedTheme, 'Dark class:', document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    console.log('Toggled to theme:', newTheme, 'Dark class:', document.documentElement.classList.contains('dark'));
  };

  // Email validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Real-time input validation
  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError('Name is required');
    } else {
      setNameError('');
    }
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('Email is required');
    } else if (!isValidEmail(value)) {
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
  };

  // Debounced email uniqueness check
  const checkEmailUniqueness = useMemo(
    () =>
      debounce(async (email: string, editingId: string | null) => {
        if (!email.trim() || !isValidEmail(email)) {
          setEmailCheckLoading(false);
          return;
        }
        setEmailCheckLoading(true);
        const query = supabase
          .from('students')
          .select('id')
          .eq('email', email);
        if (editingId) {
          query.neq('id', editingId);
        }
        const { data, error } = await query;
        if (error) {
          console.error('Email check error:', error.message);
          setEmailError('Error checking email');
        } else if (data && data.length > 0) {
          setEmailError('This email is already in use');
        } else {
          setEmailError('');
        }
        setEmailCheckLoading(false);
      }, 300),
    []
  );

  // Handle email input change
  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmail(value);
    if (isValidEmail(value)) {
      checkEmailUniqueness(value, editingStudentId);
    }
  };

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value);
      }, 300),
    []
  );

  // Sync inputValue with searchQuery
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Clean up debounces on component unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      checkEmailUniqueness.cancel();
    };
  }, [debouncedSearch, checkEmailUniqueness]);

  // Handle message fade-out
  useEffect(() => {
    let successTimeout: NodeJS.Timeout;
    let errorTimeout: NodeJS.Timeout;

    if (successMessage) {
      setIsSuccessVisible(true);
      successTimeout = setTimeout(() => {
        setIsSuccessVisible(false);
        setTimeout(() => setSuccessMessage(''), 1000);
      }, 3000);
    }

    if (errorMessage) {
      setIsErrorVisible(true);
      errorTimeout = setTimeout(() => {
        setIsErrorVisible(false);
        setTimeout(() => setErrorMessage(''), 1000);
      }, 3000);
    }

    return () => {
      clearTimeout(successTimeout);
      clearTimeout(errorTimeout);
    };
  }, [successMessage, errorMessage]);

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order(sortField, { ascending: sortOrder === 'asc' });
      
      if (error) {
        setErrorMessage('Failed to fetch students: ' + error.message);
      } else {
        console.log('Fetched students:', data);
        setStudents(data || []);
      }
      setLoading(false);
    };
    fetchStudents();
  }, [setStudents, sortField, sortOrder]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        (payload) => {
          console.log('Real-time payload:', payload);
          if (payload.eventType === 'INSERT') {
            setStudents((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setStudents((prev) =>
              prev.map((s) => (s.id === payload.new.id ? payload.new : s))
            );
          } else if (payload.eventType === 'DELETE') {
            setStudents((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setStudents]);

  // Reset currentPage when searchQuery, sortField, or sortOrder changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortOrder]);

  // Filter & sort memoized
  const sortedFilteredStudents = useMemo(() => {
    const filtered = students.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    console.log('Sorted filtered students:', filtered);
    return filtered.sort((a, b) => {
      const fieldA = a[sortField].toLowerCase();
      const fieldB = b[sortField].toLowerCase();
      return sortOrder === 'asc'
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    });
  }, [students, searchQuery, sortField, sortOrder]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedFilteredStudents.length / studentsPerPage) || 1;
  const paginatedStudents = sortedFilteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  // Generate pagination range with ellipsis
  const maxPagesToShow = 5;
  const pageRange = useMemo(() => {
    const pages: (number | string)[] = [];
    const delta = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, currentPage - delta);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('…');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('…');
      }
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  console.log('Paginated students:', paginatedStudents, 'Current page:', currentPage, 'Total pages:', totalPages, 'Page range:', pageRange);

  // Add / Update handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Please fill in both name and email fields.');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    setLoading(true);
    if (editingStudentId) {
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
        setLoading(false);
        return;
      }
      if (data && data.length > 0) {
        setSuccessMessage(`Student updated: ${name}, ${email}`);
      }
    } else {
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
        setLoading(false);
        return;
      }
      if (data && data.length > 0) {
        setSuccessMessage(`Student added: ${name}, ${email}`);
      }
    }

    setName('');
    setEmail('');
    setNameError('');
    setEmailError('');
    setEditingStudentId(null);
    setLoading(false);
  };

  const handleEdit = (s: { id: string; name: string; email: string }) => {
    setName(s.name);
    setEmail(s.email);
    setEditingStudentId(s.id);
    validateName(s.name);
    validateEmail(s.email);
  };

  const handleCancelEdit = () => {
    setName('');
    setEmail('');
    setNameError('');
    setEmailError('');
    setEditingStudentId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setLoading(true);
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      setErrorMessage('Failed to delete student: ' + error.message);
      setLoading(false);
      return;
    }
    setSuccessMessage(`Student ${name} deleted successfully.`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-500">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <div className="sticky top-0 bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-700 z-20 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Student Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Welcome to the school management system!</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label htmlFor="name" className="mb-1 font-semibold text-gray-700 dark:text-gray-200">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateName(e.target.value);
              }}
              disabled={loading}
              className={`p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                nameError ? 'border-red-500 animate-shake' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            />
            {nameError && (
              <p className="mt-1 text-sm text-red-600">{nameError}</p>
            )}
          </div>
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1 font-semibold text-gray-700 dark:text-gray-200">Email:</label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={loading}
                className={`p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                  emailError ? 'border-red-500 animate-shake' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              />
              {emailCheckLoading && (
                <div className="absolute right-2 top-2.5">
                  <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Submitting...' : editingStudentId ? 'Update Student' : 'Add Student'}
            </button>
            {editingStudentId && (
              <button
                type="button"
                className={`px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {successMessage && (
          <div
            key={successMessage}
            className={`mt-4 transition-opacity duration-1000 ease-in-out bg-green-100 dark:bg-green-800 p-3 rounded ${
              isSuccessVisible ? 'animate-custom-fade' : 'animate-custom-fade-out'
            }`}
          >
            <p className="text-green-600 dark:text-green-200 font-semibold">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div
            key={errorMessage}
            className={`mt-4 transition-opacity duration-1000 ease-in-out bg-red-100 dark:bg-red-800 p-3 rounded ${
              isErrorVisible ? 'animate-custom-fade' : 'animate-custom-fade-out'
            }`}
          >
            <p className="text-red-600 dark:text-red-200 font-semibold">{errorMessage}</p>
          </div>
        )}
        <div className="mt-6 space-y-2">
          <div className="flex flex-col sm:flex-row sm:space-x-2 items-start sm:items-center gap-2">
            <label htmlFor="search" className="text-gray-700 dark:text-gray-200 font-semibold">Search:</label>
            <input
              type="text"
              id="search"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                debouncedSearch(e.target.value);
              }}
              placeholder="Search by name or email"
              className="p-2 w-full border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={loading}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:space-x-2 items-start sm:items-center gap-2">
            <label htmlFor="sortField" className="text-gray-700 dark:text-gray-200 font-semibold">Sort by:</label>
            <select
              id="sortField"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as 'name' | 'email')}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={loading}
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>
            <label htmlFor="sortOrder" className="text-gray-700 dark:text-gray-200 font-semibold">Order:</label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={loading}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <ul className="mt-6 space-y-3">
              {paginatedStudents.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">No students found.</p>
              ) : (
                paginatedStudents.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                  >
                    <span className="text-gray-800 dark:text-gray-100 mb-2 sm:mb-0">{s.name} ({s.email})</span>
                    <div className="flex space-x-2">
                      <button
                        className={`px-3 py-1 bg-yellow-500 text-black dark:text-gray-100 rounded hover:bg-yellow-600 dark:hover:bg-yellow-400 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleEdit(s)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className={`px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 dark:hover:bg-red-500 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleDelete(s.id, s.name)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-4 flex flex-col sm:flex-row sm:justify-between items-center gap-2">
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition ${currentPage === 1 || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </button>
              <div className="flex space-x-1">
                {pageRange.map((page, index) =>
                  page === '…' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-3 py-1 text-gray-700 dark:text-gray-300"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      className={`px-3 py-1 rounded transition ${
                        currentPage === page
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => setCurrentPage(page as number)}
                      disabled={currentPage === page || loading}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition ${currentPage >= totalPages || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages || loading}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;