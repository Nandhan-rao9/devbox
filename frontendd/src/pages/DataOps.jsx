import { useState } from "react"

export default function DataOps() {
  const [file, setFile] = useState(null)
  const [datasetId, setDatasetId] = useState(null)
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState(0)

  const [dropCols, setDropCols] = useState([])
  const [removeEmpty, setRemoveEmpty] = useState(false)
  const [removeDup, setRemoveDup] = useState(false)

  const [filter, setFilter] = useState({
    column: "",
    op: ">",
    value: ""
  })

  const [preview, setPreview] = useState([])

  /* ---------- UPLOAD ---------- */

  async function uploadFile() {
    if (!file) return

    const form = new FormData()
    form.append("file", file)

    const res = await fetch("http://localhost:5000/api/data/upload", {
      method: "POST",
      body: form
    })

    const data = await res.json()
    setDatasetId(data.dataset_id)
    setColumns(data.columns)
    setRows(data.rows)
  }

  /* ---------- RUN OPS ---------- */

  async function runOps() {
    if (!datasetId) return

    const ops = []

    if (dropCols.length) {
      ops.push({ type: "drop_columns", columns: dropCols })
    }

    if (removeEmpty) ops.push({ type: "remove_empty_rows" })
    if (removeDup) ops.push({ type: "remove_duplicates" })

    if (filter.column && filter.value !== "") {
      ops.push({
        type: "filter",
        column: filter.column,
        op: filter.op,
        value: isNaN(filter.value)
          ? filter.value
          : Number(filter.value)
      })
    }

    const res = await fetch("http://localhost:5000/api/data/operate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataset_id: datasetId,
        operations: ops
      })
    })

    const data = await res.json()
    setPreview(data.preview)
    setRows(data.rows)
  }

  /* ---------- DOWNLOAD ---------- */

  function download() {
    window.location.href =
      `http://localhost:5000/api/data/export/${datasetId}`
  }

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl text-accent mb-6">Data Ops</h1>

      {/* UPLOAD */}
      <div className="bg-panel p-4 rounded mb-6">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={e => setFile(e.target.files[0])}
        />
        <button
          onClick={uploadFile}
          className="ml-4 px-4 py-2 bg-accent text-black rounded"
        >
          Upload
        </button>

        {datasetId && (
          <p className="mt-2 text-sm text-muted">
            Columns: {columns.length} | Rows: {rows}
          </p>
        )}
      </div>

      {/* OPERATIONS */}
      {datasetId && (
        <div className="bg-panel p-4 rounded mb-6 space-y-4">
          <h2 className="text-lg text-accent">Operations</h2>

          {/* DROP COLUMNS */}
          <div>
            <p className="text-sm text-muted mb-1">Remove columns</p>
            <select
              multiple
              className="bg-bg border border-muted p-2 rounded w-full"
              onChange={e =>
                setDropCols(
                  Array.from(e.target.selectedOptions, o => o.value)
                )
              }
            >
              {columns.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* CHECKBOX OPS */}
          <div className="flex gap-4">
            <label>
              <input
                type="checkbox"
                onChange={e => setRemoveEmpty(e.target.checked)}
              /> Remove empty rows
            </label>
            <label>
              <input
                type="checkbox"
                onChange={e => setRemoveDup(e.target.checked)}
              /> Remove duplicates
            </label>
          </div>

          {/* FILTER */}
          <div className="flex gap-2">
            <select
              className="bg-bg border border-muted p-2 rounded"
              onChange={e =>
                setFilter({ ...filter, column: e.target.value })
              }
            >
              <option value="">Filter column</option>
              {columns.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <select
              className="bg-bg border border-muted p-2 rounded"
              onChange={e => setFilter({ ...filter, op: e.target.value })}
            >
              <option>{">"}</option>
              <option>{"<"}</option>
              <option>{"=="}</option>
            </select>

            <input
              placeholder="Value"
              className="bg-bg border border-muted p-2 rounded"
              onChange={e =>
                setFilter({ ...filter, value: e.target.value })
              }
            />
          </div>

          <button
            onClick={runOps}
            className="px-6 py-2 bg-accent text-black rounded"
          >
            Run
          </button>
        </div>
      )}

      {/* PREVIEW */}
      {preview.length > 0 && (
        <div className="bg-panel p-4 rounded">
          <div className="flex justify-between mb-2">
            <p className="text-sm text-muted">
              Preview ({rows} rows)
            </p>
            <button
              onClick={download}
              className="text-accent underline"
            >
              Download CSV
            </button>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {Object.keys(preview[0]).map(h => (
                  <th
                    key={h}
                    className="border-b border-muted p-2 text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((v, j) => (
                    <td
                      key={j}
                      className="border-b border-muted/30 p-2"
                    >
                      {String(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
