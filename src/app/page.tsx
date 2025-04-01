export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Nintendo Museum Calendar Fetcher</h1>
        <p className="text-xl mb-4">This application fetches Nintendo Museum calendar data every 30 minutes.</p>
        <p className="text-lg">Last updated: {new Date().toLocaleString()}</p>
      </div>
    </main>
  );
} 