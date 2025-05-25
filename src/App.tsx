import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Signin from "./signin"
import Home from "./home"
import About from "./about"

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
};

export default App
