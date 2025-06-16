import Sidebar from './components/Nav/Sidebar';

function Dashboard() {
  return (
    <div className="flex w-full h-screen">
      <Sidebar />
      <div className="ml-16 flex-1 bg-gray-100 flex items-center justify-center text-xl">
        Welcome to your Dashboard!
      </div>
    </div>
  );
}

export default Dashboard;