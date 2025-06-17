import React from 'react';
import Sidebar from '../components/Nav/Sidebar';

function Classes() {
  return (
    <div className="flex w-full h-screen">
      <Sidebar />
      <div className="ml-16 flex-1 bg-gray-100 flex items-center justify-center text-xl">
      <h1 className="text-2xl">Classes!</h1>
      </div>
    </div>
  );
}

export default Classes;