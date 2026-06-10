import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Courses from "@/pages/Courses";
import Learn from "@/pages/Learn";
import Profile from "@/pages/Profile";
import Community from "@/pages/Community";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses/:language" element={<Courses />} />
          <Route path="/learn/:courseId" element={<Learn />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/community" element={<Community />} />
        </Route>
      </Routes>
    </Router>
  );
}