const fetchStudents = async () => {
  try {
    const response = await fetch('http://localhost:5000/students');
    if (!response.ok) throw new Error('Failed to fetch students');
    const data = await response.json();
    setStudents(data);
    setLoading(false);
  } catch (error: any) {
    setError(error.message || 'Failed to fetch students');
    setLoading(false);
  }
};
// Similar changes for handleSubmit, handleEdit, handleDelete