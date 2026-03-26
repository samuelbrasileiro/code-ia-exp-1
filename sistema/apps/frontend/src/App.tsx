import { BrowserRouter, Route, Routes } from "react-router-dom";
import TopNav from "./components/TopNav";
import Correction from "./pages/Correction";
import Exams from "./pages/Exams";
import GeneratePdf from "./pages/GeneratePdf";
import Home from "./pages/Home";
import Questions from "./pages/Questions";

export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/generate" element={<GeneratePdf />} />
          <Route path="/correction" element={<Correction />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
