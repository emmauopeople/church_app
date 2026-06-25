import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { clearAuthSession } from '../features/auth/auth.storage';
import { resetSessionExpiredNotification, sessionExpiredMessage } from '../features/auth/session-expired';

export function SessionExpiredDialog() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleExpired = () => setIsOpen(true);
    window.addEventListener('church:session-expired', handleExpired);

    return () => window.removeEventListener('church:session-expired', handleExpired);
  }, []);

  const handleOk = () => {
    resetSessionExpiredNotification();
    clearAuthSession();
    setIsOpen(false);
    navigate('/login', { replace: true });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-[#D8C8A2] bg-white p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Session expiree</p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-[#0F3D2E]">Connexion requise</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">{sessionExpiredMessage}</p>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={handleOk} className="rounded-xl bg-[#0F3D2E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#145C43]">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
