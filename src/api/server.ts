import express from 'express';
import router from './routes/routes';
import 'dotenv/config';
import { initializeDatabase } from './configs/Database';
import cors from 'cors';

const app = express();
const PORT = process.env.SERVER_PORT;

app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(cors());
app.use('/', router);

initializeDatabase().then(() => {
    app.listen(process.env.SERVER_PORT, () => {
        console.log(`Servidor rodando na porta ${process.env.SERVER_PORT}`);
    });
}).catch(err => {
    console.error("Erro ao inicializar o banco de dados:", err);
});