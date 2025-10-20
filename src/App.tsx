import { useState } from 'react';
import DashboardPage from './app_dashboard_page.tsx';
import './App.css';

function App() {
  const [students, setStudents] = useState<{ id: string; name: string; email: string }[]>([]);

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardPage students={students} setStudents={setStudents} />
    </div>
  );
}

export default App;