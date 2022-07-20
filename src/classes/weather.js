"use strict";
const { DatabaseController } = require('./../Controllers/DatabaseController')

function generate() {
  let output = {};

  let db = DatabaseController.getDatabase();
  // set weather
  if (db.gameplay.location.forceWeatherEnabled) {
    output = db.weather[db.gameplay.location.forceWeatherId];
  } else {
    output = db.weather[utility.getRandomInt(0, db.weather.length - 1)];
  }

  // replace date and time
  if (db.gameplay.location.realTimeEnabled) {
    // Apply acceleration to time computation.
    let timeInSeconds = new Date().getTime() / 1000; // date in seconds
    let deltaSeconds = utility.getServerUptimeInSeconds() * output.acceleration;

    let newDateInSeconds = timeInSeconds + deltaSeconds;

    let newDateObj = new Date(newDateInSeconds * 1000);

    let time = utility.formatTime(newDateObj).replace("-", ":").replace("-", ":");
    let date = utility.formatDate(newDateObj);
    let datetime = `${date} ${time}`;

    output.weather.timestamp = ~~ (newDateObj / 1000);
    output.weather.date = date;
    output.weather.time = datetime;
    output.date = date;
    output.time = time;
  }

  return output;
}

module.exports.generate = generate;
