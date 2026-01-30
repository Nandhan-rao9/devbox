import ToolCard from "../components/ToolCard"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-5xl font-bold text-accent mb-12 tracking-wide">
        DEVBOX
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <ToolCard
          title="File Converter"
          desc="Private, client-side file conversion"
          path="/convert"
        />
        <ToolCard
          title="Data Cleaner"
          desc="Clean CSV data instantly"
          path="/data-ops"
        />
        <ToolCard
          title="Share Once"
          desc="One-time secure data sharing"
          path="/share"
        />
        <ToolCard
          title="Api checker"
          desc="check your api endpoints"
          path="/api-checker"
        />
      </div>
    </div>
  )
}
