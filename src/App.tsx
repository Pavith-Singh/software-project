import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Signin from "./signin"

const App = () => {
  return (
    <Router>
      <Routes></Routes>
        <Route path="/signin" element={<Signin />} />
    </Router>
  );
};

export default App
