"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="hero"><h1>We hit the net.</h1><p>Something unexpected happened. Your information is safe.</p><button className="primary" onClick={reset}>Try again</button></main>; }
