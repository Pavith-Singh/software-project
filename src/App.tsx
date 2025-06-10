import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Signin from "./signin"
import Home from "./home"
import Support from "./contact"

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Support />} />
      </Routes>
    </Router>
  );
};

export default App
