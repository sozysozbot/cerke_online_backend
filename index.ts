const cool = require('cool-ascii-faces')
import express from 'express';
import { Request, Response } from 'express';
import path from 'path';
import Profession = type__message.Profession;
import Color = type__message.Color;
import AbsoluteColumn = type__message.AbsoluteColumn;
import AbsoluteCoord = type__message.AbsoluteCoord;
import AbsoluteRow = type__message.AbsoluteRow;
import NormalMove = type__message.NormalMove
import NormalNonTamMove = type__message.NormalNonTamMove;
import InfAfterStep = type__message.InfAfterStep;
import AfterHalfAcceptance = type__message.AfterHalfAcceptance;
import Ciurl = type__message.Ciurl;
import Ret_InfAfterStep = type__message.Ret_InfAfterStep;
import Ret_NormalMove = type__message.Ret_NormalMove;
import Ret_AfterHalfAcceptance = type__message.Ret_AfterHalfAcceptance;

const PORT = process.env.PORT || 23564;
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

type TypeObj = { type: string };

function isTypeObj(arg: any): arg is TypeObj {
  return arg != null && 'string' === typeof arg.type;
}

function analyzeMessage(message: object): null | Ret_InfAfterStep | Ret_AfterHalfAcceptance | Ret_NormalMove {
  if (!isTypeObj(message)) {
    return {
      legal: false,
      whyIllegal: "Invalid message: The message either does not have `.type` or its `.type` is not a string"
    };
  }

  if (message.type === 'InfAfterStep') { /* InfAfterStep */
    return ({
      legal: true,
      ciurl: [
        Math.random() < 0.5,
        Math.random() < 0.5,
        Math.random() < 0.5,
        Math.random() < 0.5,
        Math.random() < 0.5
      ] as Ciurl
    } as Ret_InfAfterStep);
  } else if (message.type === 'AfterHalfAcceptance') { /* AfterHalfAcceptance */
    return ({
      legal: true,
      dat: Math.random() < 0.5 ? {
        waterEntryHappened: true,
        ciurl: [
          Math.random() < 0.5,
          Math.random() < 0.5,
          Math.random() < 0.5,
          Math.random() < 0.5,
          Math.random() < 0.5
        ] as Ciurl
      } : {
          waterEntryHappened: false
        }
    } as Ret_AfterHalfAcceptance);
  } else if (message.type === 'NonTamMove' || message.type === 'TamMove') { /* NormalMove */
    return ({
      legal: true,
      dat: Math.random() < 0.5 ? {
        waterEntryHappened: true,
        ciurl: [
          Math.random() < 0.5,
          Math.random() < 0.5,
          Math.random() < 0.5,
          Math.random() < 0.5,
          Math.random() < 0.5
        ] as Ciurl
      } : {
          waterEntryHappened: false
        }
    } as Ret_NormalMove);
  } else {
    return {
      legal: false,
      whyIllegal: `Invalid message: The message has an unrecognised \`.type\`, which is \`${message.type}\`.`
    };
  }
}

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
    console.log(req.body);
    let message: unknown = req.body.message;

    if (typeof message !== "object") {
      console.log("message is primitive");
      res.send('null');
      return;
    }

    if (message == null) {
      console.log("no message");
      res.send('null');
      return;
    }

    res.json(analyzeMessage(message));

  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
