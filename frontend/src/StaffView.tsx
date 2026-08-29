import { TRIAGE_LEVELS, type QueueEntry, type TriageLevel } from 'contract';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { changeStatus, fetchQueue, registerArrival, retriage } from './api';
import { REFRESH_MS } from './config';
import { TRIAGE_CHIP } from './triageStyles';

const FIELD =
  'h-11 rounded-[10px] border border-line bg-canvas px-3 text-[15px] text-ink outline-none focus:border-ink-faint';

export function StaffView() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<TriageLevel>('GREEN');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setEntries((await fetchQueue()).entries);
      setError(null);
    } catch (cause) {
      setError(String(cause));
    }
  }, []);

  useEffect(() => {
    void reload();
    const timer = setInterval(() => void reload(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [reload]);

  const onRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await registerArrival(name, level);
    setName('');
    await reload();
  };

  const longestWait = entries.length > 0 ? Math.max(...entries.map((e) => e.estimatedWaitMinutes)) : 0;

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-6 border-b border-line bg-surface px-8 py-5">
        <span className="flex items-center gap-2.5 text-[16px] font-bold">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Bergen legevakt
          <span className="font-normal text-line">/</span>
          <span className="font-normal text-ink-muted">Queue</span>
        </span>
        <span className="flex items-center gap-5 text-[14px] text-ink-faint">
          <span>
            {entries.length} waiting · longest {longestWait} min
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-ink-ghost">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
            Live
          </span>
        </span>
      </header>

      <main className="grid grid-cols-1 items-start gap-7 px-8 py-7 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-[15px] font-bold">Register arrival</h2>
          {error && (
            <p role="alert" className="mt-3 text-[13px] text-triage-red">
              {error}
            </p>
          )}

          <form onSubmit={(event) => void onRegister(event)} className="mt-5 flex flex-col gap-4">
            <span className="flex flex-col gap-2">
              <label htmlFor="patient-name" className="text-[13px] text-ink-muted">
                Patient name
              </label>
              <input
                id="patient-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className={FIELD}
              />
            </span>

            <span className="flex flex-col gap-2">
              <label htmlFor="arrival-level" className="text-[13px] text-ink-muted">
                Triage level
              </label>
              <select
                id="arrival-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as TriageLevel)}
                className={FIELD}
              >
                {TRIAGE_LEVELS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </span>

            <button
              type="submit"
              className="h-11 rounded-[10px] bg-ink text-[15px] font-bold text-canvas hover:bg-ink-muted"
            >
              Register arrival
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line-soft text-[12px] tracking-[0.07em] text-ink-ghost">
                <th className="w-14 px-6 py-3 font-normal">#</th>
                <th className="px-2 py-3 font-normal">PATIENT</th>
                <th className="px-2 py-3 font-normal">LEVEL</th>
                <th className="px-2 py-3 font-normal">ESTIMATE</th>
                <th className="px-6 py-3 text-right font-normal">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-line-soft last:border-b-0">
                  <td className="px-6 py-4 text-[19px] font-bold">{entry.position}</td>
                  <td className="px-2 py-4 text-[15px]">
                    <a href={`#/visit/${entry.id}`} className="underline-offset-2 hover:underline">
                      {entry.patientName}
                    </a>
                  </td>
                  <td className="px-2 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-[12px] font-bold tracking-[0.05em] ${TRIAGE_CHIP[entry.level]}`}
                    >
                      {entry.level}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-[15px] font-bold">{entry.estimatedWaitMinutes} min</td>
                  <td className="px-6 py-4">
                    <span className="flex justify-end gap-2">
                      {/* Unique per row: a shared label would leave every other
                          control without a distinguishing accessible name. */}
                      <select
                        aria-label={`Triage level for ${entry.patientName}`}
                        value={entry.level}
                        onChange={(e) => void retriage(entry.id, e.target.value as TriageLevel).then(reload)}
                        className="h-9 rounded-[9px] border border-line bg-canvas px-2 text-[13px] text-ink-muted"
                      >
                        {TRIAGE_LEVELS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <button
                        aria-label={`Mark ${entry.patientName} done`}
                        onClick={() => void changeStatus(entry.id, 'DONE').then(reload)}
                        className="h-9 rounded-[9px] bg-ink px-3.5 text-[13px] font-bold text-canvas hover:bg-ink-muted"
                      >
                        Done
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {entries.length === 0 && (
            <p className="px-6 py-10 text-center text-[15px] text-ink-faint">Nobody is waiting.</p>
          )}
        </section>
      </main>
    </div>
  );
}
