
/* -------------------------------------------------------------------------- */
/*                                npm packages                                */
/* -------------------------------------------------------------------------- */
import express from 'express';
import cookieParser from 'cookie-parser';
import pg from 'pg';
import jsSHA from 'jssha';

const app = express();
app.listen(3004);
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static('public'));



const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
shaObj.update('Text to hash.');
const hash = shaObj.getHash('HEX');

/* -------------------------------------------------------------------------- */
/*                        DATABASE CONNECTION SETUP                           */
/* -------------------------------------------------------------------------- */
const { Pool } = pg;
const pgConnectionConfigs = {
  user: '<MY_UNIX_USERNAME>',
  host: 'localhost',
  database: '<MY_UNIX_USERNAME>',
  port: 5432, // Postgres server always runs on this port
};
const pool = new Pool(pgConnectionConfigs);


/* -------------------------------------------------------------------------- */
/*                                   ROUTES                                   */
/* -------------------------------------------------------------------------- */

app.get('/', (request, response) => {
  console.log('request came in');

  const whenDoneWithQuery = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log(result.rows[0].name);
    response.send(result.rows);
  };

  // Query using pg.Pool instead of pg.Client
  pool.query('SELECT * from cats', whenDoneWithQuery);
});

app.listen(3004);
