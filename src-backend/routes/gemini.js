const express = require('express');
const router = express.Router();
const { spawn } = require('child_process'); // Para ejecutar tu script de Python de fondo

// Objeto temporal en memoria para almacenar estados de las tareas
const tareasEstado = {};

// POST: /api/gemini (Inicia la investigación de fondo)
router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    const taskId = Math.random().toString(36).substring(7);

    // Inicializamos el estado de la tarea
    tareasEstado[taskId] = { status: 'processing', data: null };

    // Ejecutamos tu script de Python 'gemini.py' en segundo plano sin bloquear Node.js
    // Pasamos el query como argumento al script
    const pythonProcess = spawn('python3', ['src-backend/routes/gemini.py', query]);

    let pythonData = "";
    pythonProcess.stdout.on('data', (data) => {
      pythonData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        tareasEstado[taskId] = { status: 'success', data: pythonData.trim() };
      } else {
        tareasEstado[taskId] = { status: 'failed', error: 'Error en el proceso de Python' };
      }
    });

    // Respondemos INMEDIATAMENTE a Vercel para evitar el timeout (Status 202)
    return res.status(202).json({ status: 'processing', task_id: taskId });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET: /api/gemini/status/:taskId (El frontend consulta aquí cada 2 segundos)
router.get('/status/:taskId', (req, res) => {
  const { taskId } = req.params;
  const tarea = tareasEstado[taskId];

  if (!tarea) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }
  return res.json(tarea);
});

// CRÍTICO: Esto es lo que Express necesita para no lanzar el TypeError que viste en el log
module.exports = router;