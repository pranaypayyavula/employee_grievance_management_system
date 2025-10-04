import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import DashboardHome from './components/Dashboard/DashboardHome';
import GrievanceList from './components/Grievances/GrievanceList';
import CreateGrievance from './components/Grievances/CreateGrievance';
import GrievanceDetails from './components/Grievances/GrievanceDetails';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateGrievance, setShowCreateGrievance] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginPage />;
  }

  const handleCreateNew = () => {
    setShowCreateGrievance(true);
  };

  const handleViewDetails = (grievance) => {
    setSelectedGrievance(grievance);
  };

  const handleGrievanceUpdate = () => {
    setActiveTab('grievances');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome />;
      case 'grievances':
        return (
          <GrievanceList
            onCreateNew={handleCreateNew}
            onViewDetails={handleViewDetails}
          />
        );
      case 'all-grievances':
        return (
          <GrievanceList
            onCreateNew={handleCreateNew}
            onViewDetails={handleViewDetails}
          />
        );
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </DashboardLayout>

      {showCreateGrievance && (
        <CreateGrievance
          onClose={() => setShowCreateGrievance(false)}
          onSuccess={handleGrievanceUpdate}
        />
      )}

      {selectedGrievance && (
        <GrievanceDetails
          grievance={selectedGrievance}
          onClose={() => setSelectedGrievance(null)}
          onUpdate={handleGrievanceUpdate}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
