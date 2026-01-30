import { useState } from "react";

export default function DataOps() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState({ columns: [], rows: 0, preview: [] });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);

  const onUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setData({ columns: result.columns, rows: result.rows, preview: [] });
      setStatus("Data Loaded Successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runCommand = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setStatus("Analyzing command...");

    try {
      const res = await fetch("http://localhost:5000/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setData((prev) => ({
        ...prev,
        preview: result.preview,
        rows: result.rows,
      }));
      setStatus("Execution Complete");
    } catch (err) {
      setError(err.message);
      setStatus("Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl text-accent mb-6">Data Engine</h1>

      {/* COMMAND BAR */}
      <div className="bg-panel border border-muted/30 rounded-lg p-5 mb-6">
        <p className="text-sm text-muted mb-3 uppercase tracking-widest font-bold">
          Command Interface
        </p>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCommand()}
            placeholder="e.g. 'Show me the top 10 rows where price is above 100'..."
            className="flex-1 bg-bg border border-muted p-3 rounded text-white outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={runCommand}
            disabled={loading}
            className="bg-accent text-black px-6 py-2 rounded font-bold hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? "..." : "Execute"}
          </button>
        </div>
        
        {status && !error && (
          <p className="text-[10px] text-accent mt-3 uppercase font-bold tracking-widest animate-pulse">
            ● {status}
          </p>
        )}
        {error && (
          <p className="text-[10px] text-red-400 mt-3 uppercase font-bold tracking-widest">
            Error: {error}
          </p>
        )}
      </div>

      {/* UPLOAD & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-panel border border-muted/30 rounded-lg p-5">
          <p className="text-sm text-muted mb-4 font-bold uppercase tracking-widest">Source File</p>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={onUpload}
            className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-bg file:text-accent hover:file:opacity-80"
          />
        </div>
        <div className="bg-panel border border-muted/30 rounded-lg p-5 flex flex-col justify-center">
          <p className="text-sm text-muted uppercase tracking-widest font-bold">Dataset Info</p>
          <p className="text-2xl text-white mt-1">
            {data.rows} <span className="text-sm text-muted">Total Rows</span>
          </p>
        </div>
      </div>

      {/* RESULTS TABLE */}
      {data.preview && data.preview.length > 0 && (
        <div className="bg-panel border border-muted/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-bg/50 border-b border-muted/30">
                <tr>
                  {Object.keys(data.preview[0] || {}).map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-accent font-bold uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/10">
                {data.preview.map((row, i) => (
                  <tr key={i} className="hover:bg-bg/30 transition-colors">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-4 py-3 text-slate-300">
                        {v === null ? <span className="text-muted/30">null</span> : String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}