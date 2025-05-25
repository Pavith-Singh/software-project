import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Signin from "./signin"
import Home from "./home"

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App
