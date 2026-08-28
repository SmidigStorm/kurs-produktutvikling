import { useEffect, useState } from 'react';
import { PatientView } from './PatientView';
import { StaffView } from './StaffView';

const currentHash = (): string => window.location.hash.replace(/^#/, '');

export function App() {
  const [route, setRoute] = useState(currentHash());

  useEffect(() => {
    const onChange = () => setRoute(currentHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const visitMatch = /^\/visit\/(.+)$/.exec(route);
  return visitMatch?.[1] ? <PatientView visitId={visitMatch[1]} /> : <StaffView />;
}
