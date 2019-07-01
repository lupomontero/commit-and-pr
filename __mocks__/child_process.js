const EventEmitter = require('events');

const mockEvents = [];

exports.spawn = jest.fn().mockImplementation(() => {
  const events = mockEvents.shift();
  const ee = new EventEmitter();

  events.forEach(([name, args, delay]) => {
    setTimeout(() => ee.emit.apply(ee, [name, ...args]), delay);
  });

  return ee;
});


exports.__addMockEvents = (events) => {
  events.forEach(event => mockEvents.push(event));
};
