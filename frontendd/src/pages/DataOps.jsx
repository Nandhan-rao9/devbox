import { useState } from "react";

export default function DataOps() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState({ columns: [], rows: 0, preview: [] });
  const [rawPreview, setRawPreview] = useState([]); // Initial upload preview
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
    setStatus("Uploading...");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setData({ columns: result.columns, rows: result.rows, preview: [] });
      setRawPreview(result.preview); // Show initial 10 rows
      setStatus("File Ready for Commands");
    } catch (err) {
      setError(err.message);
      setStatus("Upload Failed");
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/query`, {
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
      setRawPreview([]); // Hide raw preview once operations start
      setStatus("Execution Complete");
    } catch (err) {
      setError(err.message);
      setStatus("Query Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/export`;
  };

  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl text-accent">Data Engine</h1>
        {data.rows > 0 && (
           <button 
             onClick={handleDownload}
             className="border border-accent text-accent px-4 py-2 rounded text-sm hover:bg-accent hover:text-black transition-all"
           >
             Download CSV
           </button>
        )}
      </div>

      {/* COMMAND BAR */}
      <div className="bg-panel border border-muted/30 rounded-lg p-5 mb-6">
        <p className="text-sm text-muted mb-3 uppercase tracking-widest font-bold">Command Interface</p>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCommand()}
            placeholder="e.g. 'Remove column email and show only rows where age > 25'..."
            className="flex-1 bg-bg border border-muted p-3 rounded text-white outline-none focus:border-accent"
          />
          <button
            onClick={runCommand}
            disabled={loading || !data.columns.length}
            className="bg-accent text-black px-6 py-2 rounded font-bold hover:opacity-90 disabled:opacity-30 transition-all"
          >
            {loading ? "..." : "Execute"}
          </button>
        </div>
        {status && <p className="text-[10px] text-accent mt-3 uppercase font-bold tracking-widest animate-pulse">● {status}</p>}
      </div>

      {/* UPLOAD & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-panel border border-muted/30 rounded-lg p-5">
          <p className="text-sm text-muted mb-4 font-bold uppercase tracking-widest">Source File</p>
          <input type="file" accept=".csv,.xlsx" onChange={onUpload} className="block w-full text-sm text-muted file:bg-bg file:text-accent file:border-0 file:rounded file:px-4 file:py-2" />
        </div>
        <div className="bg-panel border border-muted/30 rounded-lg p-5 flex flex-col justify-center">
          <p className="text-sm text-muted uppercase tracking-widest font-bold">Dataset Info</p>
          <p className="text-2xl text-white mt-1">{data.rows} <span className="text-sm text-muted">Rows Loaded</span></p>
        </div>
      </div>

      {/* DATA VIEW (RAW OR RESULT) */}
      {(rawPreview.length > 0 || data.preview.length > 0) && (
        <div className="bg-panel border border-muted/30 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-muted/30 bg-bg/20 flex justify-between">
            <span className="text-xs text-muted font-bold uppercase">
              {rawPreview.length > 0 ? "Initial Data Preview" : "Query Result"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-bg/50 text-accent font-bold uppercase text-[10px]">
                <tr>
                  {Object.keys((rawPreview[0] || data.preview[0] || {})).map((h) => (
                    <th key={h} className="px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/10">
                {(rawPreview.length > 0 ? rawPreview : data.preview).map((row, i) => (
                  <tr key={i} className="hover:bg-bg/30 transition-colors">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-4 py-3 text-slate-300">{String(v)}</td>
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