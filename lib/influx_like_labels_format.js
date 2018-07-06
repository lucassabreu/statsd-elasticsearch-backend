'use strict';

const dateFormat = (ts) => (new Date(ts)).toISOString()
/**
 * @param {string} key 
 */
const keyToPayload = (key) => {
  if (key.indexOf(',') == -1) {
    return { metric: key }
  }

  let payload = { metric: key.substr(0, key.indexOf(',')) };

  const labels = key.substr(payload.metric.length + 1).split(/(?<!\\),/)
  return labels.map(s => 'labels.' + s).reduce(
    (p, c) => {
      if (c.indexOf('=') == -1) {
        p[c] = true
        return p
      }

      p[c.substr(0, c.indexOf('='))] = c.substr(c.indexOf('=') + 1).replace('\\,', ',')
      return p
    },
    payload
  );
}

const counters = function (key, value, ts, bucket) {
  bucket.push(Object.assign(
    keyToPayload(key),
    {
      "val": value,
      "@timestamp": dateFormat(ts)
    }
  ));
  return 1;
}

const timers = function (key, series, ts, bucket) {
  const payload = keyToPayload(key)
  var keyTimer = 0;
  for (keyTimer in series) {
    bucket.push(Object.assign(payload, {
      "val": series[keyTimer],
      "@timestamp": dateFormat(ts)
    }));
  }
  return series.length;
}

const timer_data = function (key, value, ts, bucket) {
  value = Object.assign(value, keyToPayload(key))
  value["@timestamp"] = dateFormat(ts);
  if (value['histogram']) {
    for (var keyH in value['histogram']) {
      value[keyH] = value['histogram'][keyH];
    }
    delete value['histogram'];
  }
  bucket.push(value);
}

exports.counters = counters;
exports.timers = timers;
exports.timer_data = timer_data;
exports.gauges = counters;
