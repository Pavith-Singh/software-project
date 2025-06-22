import express, {Express, Response, Request} from 'express';
const app = express();
const port = 9000;

app.get('/', (req, res) => {
    res.send('Express + TypeScript Server');
});

app.get('/hello', (req, res) => {
    res.send('hello');
});


app.listen(port, () => {
    console.log(`now listening on port ${port}`);
});