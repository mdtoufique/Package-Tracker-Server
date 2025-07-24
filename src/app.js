import express from 'express';
import packageRoutes from './routes/packageRoutes.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Aamira Courier Tracker API');
});

// Register package routes
app.use('/api/packages', packageRoutes);

export default app;
