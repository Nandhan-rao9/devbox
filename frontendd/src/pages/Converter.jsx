import { useRef, useState } from "react"

export default function Converter() {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [format, setFormat] = useState("image/png")
  const [outputUrl, setOutputUrl] = useState(null)
  const [originalSize, setOriginalSize] = useState(null)
  const [convertedSize, setConvertedSize] = useState(null)

  function handleFile(f) {
    if (!f || !f.type.startsWith("image/")) return
    setFile(f)
    setOriginalSize(f.size)
    setOutputUrl(null)
  }

  function onDrop(e) {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  function convertImage() {
    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        blob => {
          setConvertedSize(blob.size)
          setOutputUrl(URL.createObjectURL(blob))
        },
        format,
        0.92
      )
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl text-accent mb-6">File Converter</h1>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInputRef.current.click()}
        className="border border-dashed border-muted
                   p-10 rounded-lg text-center cursor-pointer
                   hover:border-accent transition"
      >
        <p className="text-muted">
          Drag & drop image here or click to select
        </p>
        <input
          type="file"
          ref={fileInputRef}
          hidden
          accept="image/*"
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {file && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="block mb-2 text-muted">Convert to</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              className="bg-panel border border-muted p-2 rounded"
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>

          <button
            onClick={convertImage}
            className="bg-accent text-black px-6 py-2 rounded
                       hover:opacity-90"
          >
            Convert
          </button>
        </div>
      )}

      {outputUrl && (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-muted">
            Original: {(originalSize / 1024).toFixed(1)} KB  
            → Converted: {(convertedSize / 1024).toFixed(1)} KB
          </p>

          <a
            href={outputUrl}
            download={`converted.${format.split("/")[1]}`}
            className="inline-block text-accent underline"
          >
            Download converted file
          </a>
        </div>
      )}

      <p className="mt-12 text-xs text-muted">
        Runs entirely in your browser. No uploads. No tracking.
      </p>
    </div>
  )
}
