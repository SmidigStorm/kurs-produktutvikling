import type { VisitView } from 'contract';
import { useEffect, useState } from 'react';
import { fetchVisit } from './api';
import { REFRESH_MS } from './config';
import { TRIAGE_CHIP } from './triageStyles';

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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col gap-5 px-5 pt-8 pb-7">
      <header className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[15px] font-bold">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Bergen legevakt
        </span>
        <span className="text-[13px] text-ink-faint">Solheimsgaten 9</span>
      </header>

      {error && (
        <p role="alert" className="rounded-2xl border border-line bg-surface p-4 text-[14px] text-triage-red">
          {error}
        </p>
      )}

      {!visit && !error && <p className="text-[15px] text-ink-faint">Loading…</p>}

      {visit && (
        <>
          <section className="flex flex-col gap-6 rounded-[20px] border border-line bg-surface px-6 pt-7 pb-6">
            <div className="flex flex-col gap-3">
              <h1 className="font-display text-3xl leading-tight">Hello, {visit.patientName}</h1>
              <p role="status" aria-label="Triage level" className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold tracking-[0.06em] ${TRIAGE_CHIP[visit.level]}`}
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                    <circle cx="5" cy="5" r="4" fill="currentColor" />
                  </svg>
                  {visit.level}
                </span>
                <span className="text-[13px] text-ink-faint">assessed on arrival</span>
              </p>
            </div>

            <hr className="border-line-soft" />

            <p role="status" aria-label="Queue position" className="text-[17px] leading-snug text-ink-muted">
              You are number{' '}
              <strong className="font-display text-[76px] font-normal leading-none tracking-tight text-ink align-middle">
                {visit.position ?? '-'}
              </strong>{' '}
              in the queue
            </p>

            <p
              role="status"
              aria-label="Estimated wait"
              className="flex items-center justify-between gap-3 rounded-2xl bg-sunk px-4 py-4 text-[15px] text-ink-muted"
            >
              Estimated wait:{' '}
              <strong className="text-[22px] text-ink">{visit.estimatedWaitMinutes ?? '-'} minutes</strong>
            </p>
          </section>

          <aside className="flex gap-3 rounded-2xl border border-line bg-surface px-4 py-4">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" className="mt-0.5 shrink-0 text-ink-faint">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5l3 2" />
            </svg>
            <span className="text-[14px] leading-relaxed text-ink-muted">
              Please stay in the waiting room. Your place can change if someone arrives who needs care more
              urgently.
            </span>
          </aside>

          <footer className="mt-auto flex items-center justify-center gap-2 text-[13px] text-ink-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
            Updates by itself every few seconds
          </footer>
        </>
      )}
    </main>
  );
}
