import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Converter from "./pages/Converter"
import DataOps from "./pages/DataOps"
import ApiChecker from "./pages/ApiChecker"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/convert" element={<Converter />} />
        <Route path="/data-ops" element={<DataOps />} />
        <Route path="/api-checker" element={<ApiChecker />} />
      </Routes>
    </BrowserRouter>
  )
}
