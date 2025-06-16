import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Signin from "./signin"
import Home from "./home"
import Support from "./contact"
import Dashboard from "./Dashboard"
import ProtectedRoute from "./ProtectedRoute"
import { getAuth } from "firebase/auth";

const auth = getAuth();
console.log("Firebase auth reports:", auth.currentUser);

const App = () => {
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
      </Routes>
    </Router>
  );
};

export default App