import { useEffect, useRef, useState } from 'react';
import { TaskStore } from '../datos/almacenamiento';

const MENSAJE = 'No se pudieron guardar los cambios. Revisa el almacenamiento del navegador (modo privado o espacio lleno).';

// Banner no intrusivo que aparece cuando la persistencia en localStorage falla.
// Se auto-registra en TaskStore.onSaveError, igual que la versión vanilla.
export default function Aviso() {
  const [montado, setMontado] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = TaskStore.onSaveError(() => {
      setMontado(true);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 6000);
    });
    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!montado) return null;

  return (
    <div id="aviso-global" role="alert" className={visible ? 'visible' : ''}>
      {MENSAJE}
    </div>
  );
}
