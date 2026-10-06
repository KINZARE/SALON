'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main className="empty-state"><h1>Er ging iets mis</h1><p>Je opgeslagen uitgaven blijven bewaard. Probeer het scherm opnieuw te openen.</p><button className="button primary" onClick={reset}>Opnieuw proberen</button></main>;}
