import express from 'express';
import packageRoutes from './routes/packageRoutes.js';
import cors from 'cors'
import alertRoutes from './routes/alertRoutes.js';
import { verifyApiToken } from "./middlewares/auth.js";

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://package-tracker-client.vercel.app'
  ],
  methods: ['GET', 'POST'],
}));

app.use(express.json());


app.use(verifyApiToken);


app.get('/', (req, res) => {
  res.send('Aamira Courier Tracker API');
});

// Register package routes
app.use('/api/packages', packageRoutes);
// Alert routes
app.use('/api/alerts', alertRoutes);
export default app;
