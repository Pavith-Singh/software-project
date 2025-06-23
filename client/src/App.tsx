import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signin from "./signin";
import Home from "./home";
import Support from "./contact";
import Dashboard from "./Dashboard/Dashboard";
import Messages from "./Dashboard/messages";
import Classes from "./Dashboard/classes";
import Notes from "./Dashboard/notes";
import Account from "./Dashboard/account";
import Social from "./Dashboard/social";
import GraphingCalculator from "./Dashboard/graphing_calculator";
import Activities from "./Dashboard/activities";
import AIChat from "./Dashboard/ai_chat";
import IDE from "./Dashboard/ide";
import ClassRoom from "./Dashboard/ClassRoom";
import ChatRoom from "./Dashboard/ChatRoom";
import { useState, useEffect } from "react";

import ProtectedRoute from "./ProtectedRoute"
import { getAuth } from "firebase/auth";
import SplashScreen from "./SplashScreen";

const auth = getAuth();
console.log("Firebase auth reports:", auth.currentUser);

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timeout);
  }, []);

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Support />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/home/ai" element={
          <ProtectedRoute>
            <AIChat />
          </ProtectedRoute>
        } />
        <Route 
          path="/home/messages" 
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home/messages/:type/:id"
          element={
            <ProtectedRoute>
              <ChatRoom />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/home/classes" 
          element={
            <ProtectedRoute>
              <Classes />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/home/notes" 
          element={
            <ProtectedRoute>
              <Notes />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/home/social" 
          element={
            <ProtectedRoute>
              <Social />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/home/graph" 
          element={
            <ProtectedRoute>
              <GraphingCalculator />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/home/activities" 
          element={
            <ProtectedRoute>
              <Activities />
            </ProtectedRoute>
          }
          />
        <Route
        path = "/home/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
        />
        <Route
        path = "/home/ide"
        element={
          <ProtectedRoute>
            <IDE />
          </ProtectedRoute>
        }
        />
        <Route
        path = "/home/classroom/:id"
        element={
          <ProtectedRoute>
            <ClassRoom />
          </ProtectedRoute>
        }
        />
        <Route path ="*" element={<Navigate to='/' replace />} />
      </Routes>
    </Router>
  );
};

export default App