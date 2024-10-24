import express from 'express';
import { routerMovie } from './routes/index.js';
import fs from 'fs'; // Importar fs para manejar archivos
import dayjs from 'dayjs'; // Importar dayjs para manejar fechas

const app = express();
app.use(express.json());

// Middleware global
app.use((req, res, next) => {
    console.log('Middleware activado');
    next();
});

// Middleware para registrar todas las solicitudes HTTP
app.use((req, res, next) => {
    const currentDate = dayjs().format('DD-MM-YYYY HH:mm:ss');
    const logEntry = `${currentDate} ${req.method} ${req.path} ${JSON.stringify(req.headers)}\n`;

    // Archivo access_log.txt
    fs.appendFile("access_log.txt", logEntry, (err) => {
        if (err) {
            console.error("Error al escribir en el archivo de registro", err);
        }
    });

    next();
});

routerMovie(app);

// Iniciar servidor
app.listen(3200, () => {
    console.log('Servidor ejecutándose en el puerto 3200');
});
