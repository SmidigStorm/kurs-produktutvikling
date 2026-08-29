import type { VisitView } from 'contract';
import { useEffect, useState } from 'react';
import { fetchVisit } from './api';
import { REFRESH_MS } from './config';

export function PatientView({ visitId }: { visitId: string }) {
  const [visit, setVisit] = useState<VisitView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset on identity change, or the previous patient's data stays on screen
    // while the new request is in flight.
    setVisit(null);
    setError(null);

    let ignore = false;

    const load = async () => {
      try {
        const next = await fetchVisit(visitId);
        if (!ignore) {
          setVisit(next);
          setError(null);
        }
      } catch (cause) {
        if (!ignore) setError(String(cause));
      }
    };

    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);

    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [visitId]);

  if (error) return <p role="alert">{error}</p>;
  if (!visit) return <p>Loading…</p>;

  return (
    <main>
      <h1>Hello, {visit.patientName}</h1>

      {/* role="status" is correct ARIA for values that update on their own, and
          it is what makes these readable to role locators and to the ARIA
          snapshot that playwright-bdd attaches to failures. */}
      <p role="status" aria-label="Triage level">
        Your triage level is {visit.level}
      </p>
      <p role="status" aria-label="Queue position">
        You are number {visit.position ?? '-'} in the queue
      </p>
      <p role="status" aria-label="Estimated wait">
        Estimated wait: {visit.estimatedWaitMinutes ?? '-'} minutes
      </p>
    </main>
  );
}
