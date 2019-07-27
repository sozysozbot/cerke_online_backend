const cool = require('cool-ascii-faces')
import express from 'express';
import { Request, Response } from 'express';
import path from 'path';
const PORT = process.env.PORT || 23564;
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

const showTimes = () => {
  let result = ''
  const times = process.env.TIMES || 5
  for (let i = 0; i < times; i++) {
    result += i + ' '
  }
  return result;
}

const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req: Request, res: Response) => res.render('pages/index'))
  .get('/cool', (req: Request, res: Response) => res.send(cool()))
  .get('/times', (req: Request, res: Response) => res.send(showTimes()))
  .get('/db', async (req: Request, res: Response) => {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM test_table');
      const results = { 'results': (result) ? result.rows : null };
      res.render('pages/db', results);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .post('/', (req, res) => {
    res.send('{"ok":1}');
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

