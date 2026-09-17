import { SIMULATION_SPEEDS, type Simulation } from 'contract';
import { useEffect, useState } from 'react';
import { fetchSimulation, updateSimulation } from './api';

export function SimulationControls() {
  // Null means the server is not simulating, and the panel stays hidden.
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Once: whether the simulator runs does not change while the server is up.
    fetchSimulation().then(setSimulation, (cause: unknown) => setError(String(cause)));
  }, []);

  const changeSimulation = async (changes: Partial<Simulation>) => {
    try {
      setSimulation(await updateSimulation(changes));
      setError(null);
    } catch (cause) {
      setError(String(cause));
    }
  };

  return (
    <>
      {simulation && (
        <span role="group" aria-label="Simulation" className="flex items-center gap-2">
          <span>Simulation</span>
          <button
            onClick={() => void changeSimulation({ running: !simulation.running })}
            className="h-8 rounded-[8px] border border-line bg-canvas px-3 text-[13px] text-ink hover:border-ink-faint"
          >
            {simulation.running ? 'Pause' : 'Run'}
          </button>
          <label htmlFor="simulation-speed" className="sr-only">
            Speed
          </label>
          <select
            id="simulation-speed"
            value={simulation.speed}
            onChange={(e) => void changeSimulation({ speed: Number(e.target.value) })}
            className="h-8 rounded-[8px] border border-line bg-canvas px-2 text-[13px] text-ink"
          >
            {SIMULATION_SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </span>
      )}
      {error && <span role="alert" className="text-[13px] text-triage-red">{error}</span>}
    </>
  );
}
