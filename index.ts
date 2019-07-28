const cool = require('cool-ascii-faces')
import express from 'express';
import { Request, Response } from 'express';
import path from 'path';
const PORT = process.env.PORT || 23564;
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req: Request, res: Response) => res.render('pages/index'))
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
    let message = req.body.message;
    if (!message) {
      console.log("no message");
      res.send('null');
    }

    if (message.type === 'InfAfterStep') { /* InfAfterStep */
      res.json({
        ciurl: [
          Math.random() < 0.5,
          Math.random() < 0.5,
          Math.random() < 0.5,
          Math.random() < 0.5,
          Math.random() < 0.5
        ],
        dat: [1, 2, 4]
      });
    } else if (message.type === 'AfterHalfAcceptance') { /* AfterHalfAcceptance */
      res.json({
        legal: true,
        dat: Math.random() < 0.5 ? {
          waterEntryHappened: true,
          ciurl: [
            Math.random() < 0.5,
            Math.random() < 0.5,
            Math.random() < 0.5,
            Math.random() < 0.5,
            Math.random() < 0.5
          ]
        } : {
          waterEntryHappened: false
        }
      });
    } else if (message.type === 'NonTamMove' || message.type === 'TamMove') { /* NormalMove */
      res.json({
        legal: true,
        dat: Math.random() < 0.5 ? {
          waterEntryHappened: true,
          ciurl: [
            Math.random() < 0.5,
            Math.random() < 0.5,
            Math.random() < 0.5,
            Math.random() < 0.5,
            Math.random() < 0.5
          ]
        } : {
          waterEntryHappened: false
        }
      });
    } else {
      res.send('{"ok":1}');
    }

    console.log(req.body);
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
