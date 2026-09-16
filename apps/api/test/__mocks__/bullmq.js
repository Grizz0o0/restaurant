module.exports = {
  InjectQueue: () => () => {},
  Processor: () => () => {},
  Process: () => () => {},
  getQueueToken: (name) => `BullQueue_${name}`,
};
