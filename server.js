const express = require('express');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EPI Helper Backend is running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});