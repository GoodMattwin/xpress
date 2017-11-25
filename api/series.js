const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const seriesRouter = express.Router();

const issuesRouter = require('./issues');

const validateData = (req, res, next) => {
  req.name = req.body.series.name;
  req.description = req.body.series.description;
  if (!req.name || !req.description) {
    res.sendStatus(400);
  } else {
    next();
  }
};

seriesRouter.param('seriesId', (req, res, next, id) => {
  db.get(`SELECT * FROM Series WHERE id = ${id}`,
    (err, data) => {
      if (err) {
        next(err);
      } else if (data) {
        req.series = data;
        next();
      } else {
        res.sendStatus(404);
      }
  });
});

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Series',
    (err, data) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({series: data})
      }
  });
});

seriesRouter.get('/:seriesId', (req, res, next) => {
  res.status(200).json({series: req.series});
});

seriesRouter.post('/', validateData, (req, res, next) => {
  db.run(`INSERT INTO Series (name, description)
          VALUES("${req.name}", "${req.description}")`,
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Series WHERE id = ${this.lastID}`,
          (err, data) => {
            if (err) {
              next(err);
            } else {
              res.status(201).json({series: data});
            }
        });
      }
  });
});

seriesRouter.put('/:seriesId', validateData, (req, res, next) => {
  db.run(`UPDATE Series SET name = "${req.name}", description = "${req.description}"
          WHERE id = ${req.params.seriesId}`,
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`,
          (err, data) => {
            if (err) {
              next(err);
            } else {
              res.status(200).json({series: data});
            }
        });
      }
  });
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
  db.get(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`,
    (err, data) => {
      if (err) {
        next(err);
      } else {
        if (data) {
          res.sendStatus(400);
        } else {
          db.run(`DELETE FROM Series WHERE id = ${req.params.seriesId}`,
            (err) => {
              if (err) {
                next(err);
              } else {
                res.sendStatus(204);
              }
          });
        }
      }
  });
});

module.exports = seriesRouter;
