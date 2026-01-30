import { useNavigate } from "react-router-dom"

export default function ToolCard({ title, desc, path }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(path)}
      className="cursor-pointer bg-panel border border-muted/30
                 p-5 rounded-lg hover:border-accent
                 transition-all"
    >
      <h2 className="text-xl text-accent mb-2">{title}</h2>
      <p className="text-sm text-muted">{desc}</p>
    </div>
  )
}
