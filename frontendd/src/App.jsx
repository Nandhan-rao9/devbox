import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Converter from "./pages/Converter"
// import Cleaner from "./pages/Cleaner"
// import ShareOnce from "./pages/ShareOnce"
import ApiChecker from "./pages/ApiChecker"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/convert" element={<Converter />} />
        {/* <Route path="/clean" element={<Cleaner />} />
        <Route path="/share" element={<ShareOnce />} />
        <Route path="/replay" element={<FormReplay />} /> */}
        <Route path="/api-checker" element={<ApiChecker />} />
      </Routes>
    </BrowserRouter>
  )
}
