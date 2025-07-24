import express from 'express';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Aamira Courier Tracker API');
});

export default app;
