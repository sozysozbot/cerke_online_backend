const cool = require('cool-ascii-faces')
const uuidv4 = require('uuid/v4');
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
import RandomEntry = type__message.Ret_RandomEntry;
import Ret_RandomPoll = type__message.Ret_RandomPoll;
import * as t from "io-ts";
import { pipe } from 'fp-ts/lib/pipeable'
import { fold } from 'fp-ts/lib/Either'

const ColorVerifier = t.union([t.literal(0), t.literal(1)]);
const ProfessionVerifier = t.union([
  t.literal(0), t.literal(1), t.literal(2),
  t.literal(3), t.literal(4), t.literal(5),
  t.literal(6), t.literal(7), t.literal(8),
  t.literal(9)]);

const AbsoluteRowVerifier = t.union([
  t.literal(0), t.literal(1), t.literal(2),
  t.literal(3), t.literal(4), t.literal(5),
  t.literal(6), t.literal(7), t.literal(8)]);

const AbsoluteColumnVerifier = t.union([
  t.literal(0), t.literal(1), t.literal(2),
  t.literal(3), t.literal(4), t.literal(5),
  t.literal(6), t.literal(7), t.literal(8)]);

const AbsoluteCoordVerifier = t.tuple([AbsoluteRowVerifier, AbsoluteColumnVerifier]);

const InfAfterStepVerifier = t.strict({
  type: t.literal('InfAfterStep'),
  color: ColorVerifier,
  prof: ProfessionVerifier,
  src: AbsoluteCoordVerifier,
  step: AbsoluteCoordVerifier,
  plannedDirection: AbsoluteCoordVerifier
});

const AfterHalfAcceptanceVerifier = t.strict({
  type: t.literal('AfterHalfAcceptance'),
  dest: t.union([AbsoluteCoordVerifier, t.null])
});

const NormalNonTamMoveVerifier = t.strict({
  type: t.literal('NonTamMove'),
  data: t.union([t.strict({
    type: t.literal('FromHand'),
    color: ColorVerifier,
    prof: ProfessionVerifier,
    dest: AbsoluteCoordVerifier
  }), t.strict({
    type: t.literal('SrcDst'),
    src: AbsoluteCoordVerifier,
    dest: AbsoluteCoordVerifier
  }), t.strict({
    type: t.literal('SrcStepDstFinite'),
    src: AbsoluteCoordVerifier,
    step: AbsoluteCoordVerifier,
    dest: AbsoluteCoordVerifier
  })])
});

const TamMoveVerifier = t.strict({
  type: t.literal('TamMove'),
  stepStyle: t.union([t.literal('NoStep'), t.literal('StepsDuringFormer'), t.literal('StepsDuringLatter')]),
  src: AbsoluteCoordVerifier,
  firstDest: AbsoluteCoordVerifier,
  secondDest: AbsoluteCoordVerifier
});


const Verifier = t.union([
  InfAfterStepVerifier,
  AfterHalfAcceptanceVerifier,
  NormalNonTamMoveVerifier,
  TamMoveVerifier
]);

const PollVerifier = t.strict({
  access_token: t.string
})

const PORT = process.env.PORT || 23564;
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

function isWater([row, col]: AbsoluteCoord): boolean {
  return (row === 4 && col === 2)
    || (row === 4 && col === 3)
    || (row === 4 && col === 4)
    || (row === 4 && col === 5)
    || (row === 4 && col === 6)
    || (row === 2 && col === 4)
    || (row === 3 && col === 4)
    || (row === 5 && col === 4)
    || (row === 6 && col === 4)
    ;
}

function analyzeAfterHalfAcceptance(msg: AfterHalfAcceptance): Ret_AfterHalfAcceptance {
  if (msg.dest == null) {
    // hasn't actually moved, so the water entry cannot fail
    return {
      legal: true,
      dat: {
        waterEntryHappened: false
      }
    };
  }

  // FIXME: should not fail if Nuak1, Vessel, 船, felkana
  // FIXME: should not fail if the starting point is also on water

  return ({
    legal: true,
    dat: isWater(msg.dest) ? {
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
}

function analyzeInfAfterStep(msg: InfAfterStep): Ret_InfAfterStep {
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
}

function analyzeMessage(message: object): Ret_InfAfterStep | Ret_AfterHalfAcceptance | Ret_NormalMove {
  const onLeft = (errors: t.Errors): Ret_InfAfterStep | Ret_AfterHalfAcceptance | Ret_NormalMove => ({
    legal: false,
    whyIllegal: `Invalid message format: ${errors.length} error(s) found during parsing`
  })

  return pipe(
    Verifier.decode(message),
    fold(onLeft, function (msg: InfAfterStep | AfterHalfAcceptance | NormalMove) {
      if (msg.type === 'InfAfterStep') { /* InfAfterStep */
        return analyzeInfAfterStep(msg);
      } else if (msg.type === 'AfterHalfAcceptance') {
        return analyzeAfterHalfAcceptance(msg);
      } else if (msg.type === 'NonTamMove') {
        if (msg.data.type === 'FromHand') {
          // never fails
          return {
            legal: true,
            dat: {
              waterEntryHappened: false
            }
          };
        }

        if (isWater(msg.data.src)) {
          // never fails
          return {
            legal: true,
            dat: {
              waterEntryHappened: false
            }
          };
        }

        // FIXME: should not fail if Nuak1, Vessel, 船, felkana
        // FIXME: should not fail if the starting point is also on water
        return ({
          legal: true,
          dat: isWater(msg.data.dest) ? {
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
      } else if (msg.type === 'TamMove') {

        // Tam2 never fails water entry
        return ({
          legal: true,
          dat: {
            waterEntryHappened: false
          }
        } as Ret_NormalMove);
      } else {
        let _should_not_reach_here: never = msg;
        throw new Error("should not reach here");
      }
    })
  );
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
  .post('/', main)
  .post('/slow', (req, res) => {
    (async () => {
      let time = Math.random() * 1000 | 0;
      console.log(`start waiting for ${time}ms`);
      await new Promise(r => setTimeout(r, time));

      console.log("finish waiting");
      main(req, res);
    })();
  })
  .post('/random/entry', random_entrance)
  .post('/random/poll', random_poll)
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

function main(req: Request, res: Response) {
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
}

type RoomId = string & { __RoomIdBrand: never };
type AccessToken = string & { __AccessTokenBrand: never };

var waiting_list = new Set<AccessToken>();
var person_to_room = new Map<AccessToken, RoomId>();

function open_a_room(token1: AccessToken, token2: AccessToken): RoomId {
  console.log("A match between", token1, "and", token2, "will begin.");

  // FIXME
  return uuidv4() as RoomId;
}

function randomEntry(): RandomEntry {
  const newToken: AccessToken = uuidv4() as AccessToken;
  for (let token of waiting_list) {
    waiting_list.delete(token);
    const room_id = open_a_room(token, newToken);
    person_to_room.set(newToken, room_id);
    person_to_room.set(token, room_id);

    // exit after finding the first person
    return {
      "state": "let_the_game_begin",
      "access_token": newToken
    };
  }

  // If you are still here, that means no one is found
  waiting_list.add(newToken);
  return {
    "state": "in_waiting_list",
    "access_token": newToken
  };

}

function random_poll(req: Request, res: Response) {
  const onLeft = (errors: t.Errors): Ret_RandomPoll => ({
    legal: false,
    whyIllegal: `Invalid message format: ${errors.length} error(s) found during parsing`
  })

  return res.json(pipe(
    PollVerifier.decode(req.body),
    fold(onLeft, function (msg: { "access_token": string }): Ret_RandomPoll {
      const access_token = msg.access_token as AccessToken
      const maybe_room_id: RoomId | undefined = person_to_room.get(access_token)
      if (typeof maybe_room_id !== "undefined") {
        return {
          "state": "let_the_game_begin",
          "access_token": msg.access_token
        }
      } else if (waiting_list.has(access_token)) { // not yet assigned a room, but is in the waiting list
        return {
          "state": "in_waiting_list",
          "access_token": msg.access_token
        }
      } else { // You sent me a poll, but  I don't know you. Hmm...
        return {
          legal: false,
          whyIllegal: `Invalid access token: 
          I don't know your access token, which is ${access_token}.
          Please reapply by sending an empty object to random/entry .`
        }

        // FIXME: in the future, I might let you reapply. This will of course change your UUID.
      }
    })));
}

function random_entrance(_req: Request, res: Response) {
  res.json(randomEntry());
}
