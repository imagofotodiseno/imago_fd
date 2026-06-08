// Ejemplo de la función en tu botón del frontend
const handleAnalizarTendencias = async (miQuery) => {
  setLoading(true);
  setError(null);

  try {
    // 1. Iniciar la tarea de manera asíncrona
    const response = await fetch('/api/gemini/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: miQuery })
    });

    const { task_id } = await response.json();

    // 2. Crear un intervalo que verifique el estado cada 2 segundos
    const checkStatusInterval = setInterval(async () => {
      const resStatus = await fetch(`/api/gemini/status/${task_id}`);
      const tarea = await resStatus.json();

      if (tarea.status === 'success') {
        clearInterval(checkStatusInterval);
        setResultado(tarea.data); // Pintar los datos en la caja de texto
        setLoading(false);
      } else if (tarea.status === 'failed') {
        clearInterval(checkStatusInterval);
        setError('El análisis falló en el servidor.');
        setLoading(false);
      }
    }, 2000);

  } catch (err) {
    setError('Error de conexión inicial.');
    setLoading(false);
  }
};