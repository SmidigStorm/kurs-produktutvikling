import { TRIAGE_LEVELS, type QueueEntry, type TriageLevel } from 'contract';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { changeStatus, fetchQueue, registerArrival, retriage } from './api';
import { REFRESH_MS } from './config';

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

  return (
    <main>
      <h1>Staff — queue</h1>
      {error && <p role="alert">{error}</p>}

      <form onSubmit={(event) => void onRegister(event)}>
        {/* htmlFor/id rather than nesting: wrapping a <select> in its <label>
            folds the option text into the label's text content, so the
            accessible name becomes "Triage level RED ORANGE YELLOW ..." and
            getByLabel('Triage level') no longer matches. */}
        <label htmlFor="patient-name">Patient name</label>
        <input id="patient-name" value={name} onChange={(e) => setName(e.target.value)} />

        <label htmlFor="arrival-level">Triage level</label>
        <select
          id="arrival-level"
          value={level}
          onChange={(e) => setLevel(e.target.value as TriageLevel)}
        >
          {TRIAGE_LEVELS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button type="submit">Register arrival</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Level</th>
            <th>Estimate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.position}</td>
              <td>
                <a href={`#/visit/${entry.id}`}>{entry.patientName}</a>
              </td>
              <td>{entry.level}</td>
              <td>{entry.estimatedWaitMinutes} min</td>
              <td>
                {/* Unique per row: a shared htmlFor would label only row one,
                    leaving every other control without an accessible name. */}
                <select
                  aria-label={`Triage level for ${entry.patientName}`}
                  value={entry.level}
                  onChange={(e) =>
                    void retriage(entry.id, e.target.value as TriageLevel).then(reload)
                  }
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
                >
                  Done
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
