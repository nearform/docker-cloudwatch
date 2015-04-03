#! /usr/bin/env node

var util = require('util');
var tls = require('tls');
var net = require('net');
var eos = require('end-of-stream');
var through = require('through2');
var minimist = require('minimist');
var allContainers = require('docker-allcontainers');
var statsFactory = require('docker-stats');
var logFactory = require('docker-loghose');
var CloudWatchLogs = require('cloudwatchlogs-stream');

function start(opts){
  var logsToken = opts.logstoken || opts.token;
  var statsToken = opts.statstoken || opts.token;
  var out;
  var noRestart = function() {};
  var filter = through.obj(function(obj, enc, cb) {
    addAll(opts.add, obj);
    if (obj.line) {
      this.push(obj.line + '\n');
    }
    cb()
  });

  var events = allContainers(opts);
  opts.events = events;

  var loghose = logFactory(opts);
  loghose.pipe(filter);

  if (opts.stats !== false) {
    var stats = statsFactory(opts);
    stats.pipe(filter);
  }

  pipe();

  // destroy out if loghose is destroyed
  eos(loghose, function() {
    noRestart()
    out.destroy();
  });

  return loghose;

  function addAll(proto, obj) {
    if (!proto) { return; }

    var key;
    for (key in proto) {
      if (proto.hasOwnProperty(key)) {
        obj[key] = proto[key];
      }
    }
  }

  function pipe() {
    if (out) {
      filter.unpipe(out);
    }

    out = new CloudWatchLogs(opts);
    out.on('error', function(err) {
      throw new Error(err);
    });

    filter.pipe(out, { end: false });

    // automatically reconnect on socket failure
    noRestart = eos(out, pipe);
  }
}

function cli() {
  var argv = minimist(process.argv.slice(2), {
    boolean: ['json', 'stats'],
    alias: {
      'accessKeyId': 'a',
      'secretAccessKey': 's',
      'region': 'r',
      'logGroupName': 'g',
      'logStreamName': 't',
      //'json': 'j',
      //'stats': 't'
      //'add': 'a'
    },
    default: {
      json: false,
      stats: false,
      add: []
    }
  });

  if (!(argv.accesskey || argv.secretkey || argv.groupname || argv.streamname || argv.region)) {
    console.log('Usage: docker-cloudwatch [-a ACCESS_KEY] [-k SECRET_KEY]\n' +
                '                         [-r REGION] [-g GROUP_NAME] [-s STREAM_NAME] [--json]\n');

//                '                         [--no-stats] [-a KEY=VALUE]');
    process.exit(1);
  }

  if (argv.add && !Array.isArray(argv.add)) {
    argv.add = [argv.add];
  }

  argv.add = argv.add.reduce(function(acc, arg) {
    arg = arg.split('=');
    acc[arg[0]] = arg[1];
    return acc
  }, {});

  start(argv);
}

module.exports = start;

if (require.main === module) {
  cli();
}
