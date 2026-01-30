import { useState } from "react"

export default function ApiChecker() {
  const [method, setMethod] = useState("GET")
  const [url, setUrl] = useState("")
  const [headers, setHeaders] = useState([{ key: "", value: "" }])
  const [body, setBody] = useState("")
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  function updateHeader(index, field, value) {
    const copy = [...headers]
    copy[index][field] = value
    setHeaders(copy)
  }

  function addHeader() {
    setHeaders([...headers, { key: "", value: "" }])
  }

  function removeHeader(index) {
    setHeaders(headers.filter((_, i) => i !== index))
  }

async function sendRequest() {
  setLoading(true)
  setResponse(null)

  const headerObj = {}
  headers.forEach(h => {
    if (h.key) headerObj[h.key] = h.value
  })

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
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-muted">Status:</span>{" "}
              <span className="text-accent">{response.status}</span>
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
              <pre className="bg-bg p-3 rounded text-xs overflow-x-auto">
{response.body}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
