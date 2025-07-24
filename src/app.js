import express from 'express';
import packageRoutes from './routes/packageRoutes.js';
import cors from 'cors'
import alertRoutes from './routes/alertRoutes.js';


const app = express();

app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST'],
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Aamira Courier Tracker API');
});

// Register package routes
app.use('/api/packages', packageRoutes);
// Alert routes
app.use('/api/alerts', alertRoutes);
export default app;
