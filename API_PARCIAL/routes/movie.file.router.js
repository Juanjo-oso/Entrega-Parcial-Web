import express from "express";
import { read, write } from "../src/utils/files.js";
import Joi from 'joi'; // JOI LIBRERÍA
import PDFDocument from 'pdfkit'; // PDFKIT LIBRERÍA
import dayjs from 'dayjs'; // DAYJS LIBRERÍA

export const movieFileRouter = express.Router();

// Función para validar los datos de una película
const validateMovie = (movie) => {
    const schema = Joi.object({
        title: Joi.string().min(1).max(255).required(),
        director: Joi.string().min(3).max(255).required(),
        release_year: Joi.number().integer().min(1888).max(new Date().getFullYear()).required(),
        genre: Joi.string().min(3).max(50).required(),
        rating: Joi.number().min(0).max(10).required(),
        duration_minutes: Joi.number().integer().min(1).required(),
        language: Joi.string().min(2).max(50).required(),
        created_at: Joi.string().optional(),
        updated_at: Joi.string().optional(),
        ip: Joi.string().optional()
    });
    return schema.validate(movie);
};


const FechaIP = (isUpdate = false) => {
    return (req, res, next) => {
        const currentDate = dayjs().format('HH:mm DD-MM-YYYY');
        let ip = req.ip || req.connection.remoteAddress;


        if (ip === '::1') {
            ip = '192.168.20.123';
        }

        if (isUpdate) {
            req.body.updated_at = currentDate;
        } else {
            req.body.created_at = currentDate;
        }
        req.body.ip = ip;

        next();
    };
};


// GET para obtener una película por ID
movieFileRouter.get('/:id', (req, res) => {
    const movies = read();
    const movie = movies.find(movie => movie.id === parseInt(req.params.id));
    if (movie) {
        res.json(movie);
    } else {
        res.status(404).json({ message: 'Película no encontrada' });
    }
});

// POST para agregar una nueva película
movieFileRouter.post('/',
    FechaIP(false),
    (req, res) => {
        const { error } = validateMovie(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const movies = read();
        const movie = {
            ...req.body,
            id: movies.length + 1
        };

        movies.push(movie);
        write(movies);

        res.status(201).json(movie);
    }
);

// PUT para actualizar una película
movieFileRouter.put('/:id',
    FechaIP(true),
    (req, res) => {
        const { error } = validateMovie(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const movies = read();
        let movie = movies.find(movie => movie.id === parseInt(req.params.id));
        if (movie) {
            movie = {
                ...movie,
                ...req.body
            };

            movies[
                movies.findIndex(m => m.id === parseInt(req.params.id))
            ] = movie;

            write(movies);
            res.json(movie);
        } else {
            res.status(404).json({ message: 'Película no encontrada' });
        }
    }
);

// DELETE para eliminar una película por ID
movieFileRouter.delete('/:id', (req, res) => {
    const movies = read();
    const movie = movies.find(movie => movie.id === parseInt(req.params.id));
    if (movie) {
        movies.splice(
            movies.findIndex(movie => movie.id === parseInt(req.params.id)),
            1
        );
        write(movies);
        res.json(movie);
    } else {
        res.status(404).json({ message: 'Película no encontrada' });
    }
});

// GET para obtener TODAS las películas con filtrado
movieFileRouter.get('/', (req, res) => {
    let movies = read();

    const { filter, limit } = req.query;

    if (filter) {
        movies = movies.filter(movie =>
            movie.genre.toLowerCase().includes(filter.toLowerCase())
        );
    }

    // Limitar la cantidad de registros mostrados
    if (limit && !isNaN(limit)) {
        movies = movies.slice(0, parseInt(limit));
    }

    res.json(movies);
});



// GET para generar PDF por ID
movieFileRouter.get('/:id/pdf', (req, res) => {
    const movies = read();
    const movie = movies.find(movie => movie.id === parseInt(req.params.id));

    if (!movie) {
        return res.status(404).json({ message: 'Película no encontrada' });
    }

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=movie_${movie.id}.pdf`);

    // Escribir el contenido del PDF
    doc.text(`Película ID: ${movie.id}`);
    doc.text(`Título: ${movie.title}`);
    doc.text(`Director: ${movie.director}`);
    doc.text(`Año de lanzamiento: ${movie.release_year}`);
    doc.text(`Género: ${movie.genre}`);
    doc.text(`Calificación: ${movie.rating}`);
    doc.text(`Duración (minutos): ${movie.duration_minutes}`);
    doc.text(`Idioma: ${movie.language}`);

    doc.pipe(res);
    doc.end();
});

// PUT para actualizar el campo "language" de todas las películas
movieFileRouter.put('/update-language', (req, res) => {
    const { language } = req.body;

    // Verificar que se proporciona el campo "language"
    if (!language || typeof language !== 'string' || language.trim().length < 2) {
        return res.status(400).json({ message: 'El campo "language" es requerido y debe ser una cadena válida.' });
    }

    const movies = read();

    const updatedMovies = movies.map(movie => ({
        ...movie,
        language,
        updated_at: dayjs().format('HH:mm DD-MM-YYYY')
    }));

    write(updatedMovies);

    res.json({
        message: 'Idioma actualizado en todas las películas.',
        updatedCount: updatedMovies.length
    });
});
