const express = require('express');
const moment = require('moment');

const router = express.Router();

const Interval = require("../models/interval");

router.get('/delete', (req, res) => {
  res.send('Nesse endpoint, você deve efetuar uma solicitação do tipo DELETE.');
});

router.delete('/delete/:type?', (req, res) => {
  const type = req.params.type ? Number(req.params.type) : 1;
  const { start, end, month, weeks } = req.body;

  const day = moment(req.body.day, 'DD-MM-YYYY') || moment().format('DD-MM-YYYY');
  const weekDays = req.body.weekDays ? String(req.body.weekDays) : '1, 2, 3, 4, 5';

  const timestamp = moment(day).format('x');

  if (type === 1) {
    Interval.deleteOne({
      $and: [
        { $or: [{ start }, { end }] },
        { timestamp },
      ],
    })
      .then(foundOne => res.send(foundOne))
      .catch(err => res.send(err));
  } else if (type === 2) {
    Interval.find({})
      .then((all) => {
        const dataToSend = all.map((entry) => {
          const dataDay = Number(moment(entry.day, 'DD-MM-YYYY').format('M'));

          return (Number(dataDay) === Number(month)) ? entry.day : null;
        });
        return dataToSend;
      })
      .then((dataToSend) => {
        Interval.deleteMany({
          $and: [
            { day: { $in: [...dataToSend] } },
            { start },
            { end },
          ],
        })
          .then(out => res.send(out))
          .catch(e => res.send(e));
      })
      .catch(e => res.send(e));
  } else if (type === 3) {
    const numberOfWeeks = weeks ? Number(weeks) : 4;

    Interval.find({})
      .then((allData) => {
        const dataToSend = allData.map((value) => {
          const valueTimestamp = moment(value.day, 'DD-MM-YYYY').format('x');
          const minTimestamp = moment().format('x');
          const maxTimestamp = moment().add(numberOfWeeks, 'weeks').format('x');
          const indexOfDay = moment(value.day, 'DD-MM-YYYY').day();

          const result = Boolean(valueTimestamp >= minTimestamp) && (valueTimestamp <= maxTimestamp);
          const secondResult = Boolean(weekDays.indexOf(indexOfDay) >= 0);

          return (result && secondResult) ? value.day : null;
        });
        return dataToSend;
      })
      .then((dataToSend) => {
        Interval.deleteMany({
          $and: [
            { day: { $in: [...dataToSend] } },
            { start }, { end }],
        })
          .then(deleted => res.send(deleted))
          .catch(e => res.send(e));
      })
      .catch(e => res.send(e));
  }
});

module.exports = router;
