import type { QueueResponse, Simulation, TriageLevel, VisitStatus, VisitView } from 'contract';

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const post = <T,>(path: string, body: unknown): Promise<T> =>
  json<T>(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

export const fetchQueue = (): Promise<QueueResponse> => json<QueueResponse>('/api/queue');

export const fetchVisit = (id: string): Promise<VisitView> =>
  json<VisitView>(`/api/visits/${id}`);

export const registerArrival = (patientName: string, level: TriageLevel) =>
  post<{ id: string }>('/api/visits', { patientName, level });

export const retriage = (id: string, level: TriageLevel) =>
  post<{ id: string }>(`/api/visits/${id}/triage`, { level });

export const changeStatus = (id: string, status: VisitStatus) =>
  post<{ id: string }>(`/api/visits/${id}/status`, { status });

/** Null when the server is not running the classroom simulation. */
export const fetchSimulation = async (): Promise<Simulation | null> => {
  const response = await fetch('/api/simulation');
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GET /api/simulation failed: ${response.status}`);
  return response.json() as Promise<Simulation>;
};

export const updateSimulation = (changes: Partial<Simulation>) =>
  post<Simulation>('/api/simulation', changes);
