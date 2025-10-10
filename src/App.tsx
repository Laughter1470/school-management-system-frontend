import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

interface Student {
  id: number;
  name: string;
  email: string;
}

const DashboardPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase.from('students').select('*');
        if (error) throw error;
        setStudents(data as Student[]);
        setLoading(false);
      } catch (error: any) {
        setError(error.message || 'Failed to fetch students');
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>School Management Dashboard</h1>
      <h2>Students</h2>
      <ul>
        {students.map((student) => (
          <li key={student.id}>
            {student.name} ({student.email})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DashboardPage;