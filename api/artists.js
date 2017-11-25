const express = require('express');
const artistsRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const validateData = (req, res, next) => {
  req.name = req.body.artist.name;
  req.dateOfBirth = req.body.artist.dateOfBirth;
  req.biography = req.body.artist.biography;
  req.isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  if (!req.name || !req.dateOfBirth || !req.biography) {
    return res.sendStatus(400);
  }
  else {
    next();
  }
};

artistsRouter.param('artistId', (req, res, next, id) => {
  db.get('SELECT * FROM Artist WHERE id = $id', {$id: id},
    (err, data) => {
      if (err) {
        next(err);
      } else if (data) {
        req.artist = data;
        next();
      } else {
        res.sendStatus(404);
      }
  });
})

artistsRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Artist WHERE is_currently_employed = 1',
    (err, data) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({artists: data});
      }
    });
});

artistsRouter.get('/:artistId', (req, res, next) => {
  res.status(200).json({artist: req.artist});
});

artistsRouter.post('/', validateData, (req, res, next) => {
  db.run(`INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed)
          VALUES ("${req.name}", "${req.dateOfBirth}", "${req.biography}", "${req.isCurrentlyEmployed}")`,
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Artist WHERE id = ${this.lastID}`,
          (err, data) => {
            res.status(201).json({artist: data});
        });
      }
  });
});

artistsRouter.put('/:artistId', validateData, (req, res, next) => {
  db.run(`UPDATE Artist SET name = "${req.name}", date_of_birth = "${req.dateOfBirth}",
            biography = "${req.biography}", is_currently_employed = "${req.isCurrentlyEmployed}"
          WHERE id = ${req.params.artistId}`,
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`,
          (err, data) => {
            res.status(200).json({artist: data});
        });
      }
  });
});

artistsRouter.delete('/:artistId', (req, res, next) => {
  db.run(`UPDATE Artist SET is_currently_employed = 0 WHERE id = ${req.params.artistId}`,
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`,
          (err, data) => {
            res.status(200).json({artist: data});
        });
      }
  });
});

module.exports = artistsRouter;
