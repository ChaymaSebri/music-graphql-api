const { EventEmitter } = require('events');

class SimplePubSub extends EventEmitter {
  publish(topic, value) {
    this.emit(topic, value);
  }

  asyncIterator(topics) {
    const self = this;
    const queue = [];
    let resolve;

    const onMessage = (value) => {
      queue.push(value);
      if (resolve) {
        const r = resolve;
        resolve = null;
        r();
      }
    };

    // Set up listeners for all topics
    topics.forEach((topic) => {
      self.on(topic, onMessage);
    });

    return {
      [Symbol.asyncIterator]() {
        return this;
      },

      async next() {
        if (queue.length > 0) {
          return { value: queue.shift(), done: false };
        }

        // Wait for a message
        return new Promise((_resolve) => {
          resolve = _resolve;
        }).then(() => {
          if (queue.length > 0) {
            return { value: queue.shift(), done: false };
          }
          return this.next();
        });
      },

      async return() {
        topics.forEach((topic) => {
          self.off(topic, onMessage);
        });
        return { done: true };
      },

      async throw(error) {
        topics.forEach((topic) => {
          self.off(topic, onMessage);
        });
        throw error;
      },
    };
  }
}

const pubsub = new SimplePubSub();
module.exports = { pubsub };