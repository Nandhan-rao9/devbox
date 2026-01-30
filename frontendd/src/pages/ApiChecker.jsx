import { useState,useEffect } from "react"
import { saveRequest, getAllRequests, deleteRequest } from "../utils/requestStore"

export default function ApiChecker() {
  const [method, setMethod] = useState("GET")
  const [url, setUrl] = useState("")
  const [headers, setHeaders] = useState([{ key: "", value: "" }])
  const [body, setBody] = useState("")
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState([])
  const [saveName, setSaveName] = useState("")


  function updateHeader(index, field, value) {
    const copy = [...headers]
    copy[index][field] = value
    setHeaders(copy)
  }
  useEffect(() => {
  getAllRequests().then(setSaved)
}, [])


  function isJson(text) {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

function formatJson(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

async function handleSave() {
  if (!saveName || !url) return

  const reqObj = {
    id: crypto.randomUUID(),
    name: saveName,
    method,
    url,
    headers: headers.filter(h => h.key),
    body
  }

  await saveRequest(reqObj)
  const all = await getAllRequests()
  setSaved(all)
  setSaveName("")
}


function statusColor(status) {
  if (typeof status !== "number") return "text-red-400"
  if (status >= 200 && status < 300) return "text-green-400"
  if (status >= 400 && status < 500) return "text-yellow-400"
  return "text-red-400"
}


  function addHeader() {
    setHeaders([...headers, { key: "", value: "" }])
  }

  function removeHeader(index) {
    setHeaders(headers.filter((_, i) => i !== index))
  }

async function sendRequest() {
  setLoading(true)

  const headerObj = {}
  headers.forEach(h => {
    if (h.key) headerObj[h.key] = h.value
  })

  if (
  ["POST", "PUT", "PATCH"].includes(method) &&
  !headerObj["Content-Type"]
) {
  headerObj["Content-Type"] = "application/json"
}


  try {
    const res = await fetch("http://localhost:5000/api/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        method,
        url,
        headers: headerObj,
        body
      })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || "Request failed")
    }

    setResponse(data)
  } catch (err) {
    setResponse({
      status: "ERROR",
      time: "-",
      headers: {},
      body: err.message
    })
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl text-accent mb-6">API Checker</h1>

      {/* REQUEST */}
      <div className="bg-panel border border-muted/30 rounded-lg p-5 mb-6">
        <h2 className="text-lg text-accent mb-4">Request</h2>

        <div className="flex gap-3 mb-4">
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            className="bg-bg border border-muted p-2 rounded"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
          </select>

          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://api.example.com"
            className="flex-1 bg-bg border border-muted p-2 rounded"
          />
        </div>

        {/* HEADERS */}
        <div className="mb-4">
          <p className="text-sm text-muted mb-2">Headers</p>

          {headers.map((h, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="Key"
                value={h.key}
                onChange={e => updateHeader(i, "key", e.target.value)}
                className="bg-bg border border-muted p-2 rounded w-1/3"
              />
              <input
                placeholder="Value"
                value={h.value}
                onChange={e => updateHeader(i, "value", e.target.value)}
                className="bg-bg border border-muted p-2 rounded flex-1"
              />
              <button
                onClick={() => removeHeader(i)}
                className="text-red-400 px-2"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={addHeader}
            className="text-sm text-accent underline"
          >
            + Add header
          </button>
        </div>

        {/* BODY */}
        <div className="mb-4">
          <p className="text-sm text-muted mb-2">Body</p>
          <textarea
            rows={6}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder='{ "key": "value" }'
            className="w-full bg-bg border border-muted p-2 rounded font-mono"
          />
        </div>

        <button
          onClick={sendRequest}
          disabled={loading || !url}
          className="bg-accent text-black px-6 py-2 rounded
                     disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Request"}
        </button>
        <div className="flex gap-2 mt-4">
  <input
    value={saveName}
    onChange={e => setSaveName(e.target.value)}
    placeholder="Request name"
    className="bg-bg border border-muted p-2 rounded flex-1"
  />
  <button
    onClick={handleSave}
    className="border border-accent text-accent px-4 rounded"
  >
    Save
  </button>
</div>

      </div>

      {/* RESPONSE */}
<div className="bg-panel border border-muted/30 rounded-lg p-5">
  <h2 className="text-lg text-accent mb-4">Response</h2>

  {!response && (
    <p className="text-sm text-muted">
      No response yet.
    </p>
  )}

  {response && (
    <div className="space-y-4 text-sm">
      <p>
        <span className="text-muted">Status:</span>{" "}
        <span className={statusColor(response.status)}>
          {response.status}
        </span>
      </p>

      <p>
        <span className="text-muted">Time:</span>{" "}
        {response.time}
      </p>

      <div>
        <p className="text-muted mb-1">Headers</p>
        <pre className="bg-bg p-3 rounded text-xs overflow-x-auto">
{JSON.stringify(response.headers, null, 2)}
        </pre>
      </div>

      <div>
        <p className="text-muted mb-1">Body</p>
        <pre className="bg-bg p-3 rounded text-xs overflow-x-auto max-h-96">
{isJson(response.body)
  ? formatJson(response.body)
  : response.body}
        </pre>
      </div>
    </div>
  )}
</div>

{saved.length > 0 && (
  <div className="mt-8 bg-panel border border-muted/30 rounded-lg p-5">
    <h2 className="text-lg text-accent mb-4">Saved Requests</h2>

    <div className="space-y-3">
      {saved.map(r => (
        <div
          key={r.id}
          className="flex justify-between items-center border border-muted/20 p-3 rounded"
        >
          <div
            className="cursor-pointer"
            onClick={() => {
              setMethod(r.method)
              setUrl(r.url)
              setHeaders(
  r.headers.length
    ? [...r.headers, { key: "", value: "" }]
    : [{ key: "", value: "" }]
)

              setBody(r.body || "")
              setResponse(null)
            }}
          >
            <p className="text-accent">{r.name}</p>
            <p className="text-xs text-muted">
              {r.method} {r.url}
            </p>
          </div>

          <button
            onClick={async () => {
              await deleteRequest(r.id)
              setSaved(await getAllRequests())
            }}
            className="text-red-400"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  </div>
)}
    </div>
  )
}
