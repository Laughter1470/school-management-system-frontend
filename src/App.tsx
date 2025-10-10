import React, { useState } from 'react';
import './App.css';
import DashboardPage from './app_dashboard_page';

// Define a Student interface
interface Student {
  id: string;
  name: string;
  email: string;
}

function App() {
  const [data, setData] = useState<Student[]>([]);

  return (
    <div className="App">
      <h1>School Management System</h1>
      <DashboardPage students={data} setStudents={setData} />
    </div>
  );
}

export default App;
