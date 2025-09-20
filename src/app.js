import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.status(200).send('This is CCD CCA 2');
});

export default app;
