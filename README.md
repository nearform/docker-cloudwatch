# docker-cloudwatch

Forward all your logs to [CloudWatch Logs](http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/WhatIsCloudWatchLogs.html), like a breeze.

## Usage as a Container

The simplest way to forward all your container's log to Cloudwatch is to
run this repository as a container, with:

```sh
docker run -v /var/run/docker.sock:/var/run/docker.sock cloudwatch/docker-cloudwatch -a ACCESSKEY -s SECRET_KEY -r REGION -g GROUP_NAME -t STREAM_NAME
```

### Running container in a restricted environment.
Some environments(such as Google Compute Engine) does not allow to access the docker socket without special privileges. You will get EACCES(`Error: read EACCES`) error if you try to run the container.
To run the container in such environments add --privileged to the `docker run` command. 

Example:
```sh
docker run --privileged -v /var/run/docker.sock:/var/run/docker.sock cloudwatch/docker-cloudwatch -a ACCESSKEY -s SECRET_KEY -r REGION -g GROUP_NAME -t STREAM_NAME
```

## Usage as a CLI

1. `npm install docker-cloudwatch -g`
2. `docker-cloudwatch -a ACCESSKEY -s SECRET_KEY -r REGION -g GROUP_NAME -t STREAM_NAME`
3. ..there is no step 3


## Embedded usage

Install it with: `npm install docker-cloudwatch --save`

Then, in your JS file:

```
var cloudwatch = require('docker-cloudwatch')({
  'accessKeyId': 'ACCESS_KEY',
  'secretAccessKey': 'SECRET_KEY',
  'region': 'REGION',
  'logGroupName': 'GROUP_NAME',
  'logStreamName': 'STREAM_NAME'
})

// cloudwatch is the source stream with all the
// log lines

setTimeout(function() {
  cloudwatch.destroy()
}, 5000)
```

## Building a docker repo from this repository

First clone this repository, then:

```bash
docker build -t cloudwatch .
docker run -v /var/run/docker.sock:/var/run/docker.sock cloudwatch -a ACCESSKEY -s SECRET_KEY -r REGION -g GROUP_NAME -t STREAM_NAME
```

## How it works

This module wraps four [Docker APIs](https://docs.docker.com/reference/api/docker_remote_api_v1.17/):

* `POST /containers/{id}/attach`, to fetch the logs
* `GET /containers/{id}/stats`, to fetch the stats of the container
* `GET /containers/json`, to detect the containers that are running when
  this module starts
* `GET /events`, to detect new containers that will start after the
  module has started

This module wraps
[docker-loghose](https://github.com/mcollina/docker-loghose) and
[docker-stats](https://github.com/pelger/docker-stats) to fetch the logs and the stats as a never ending stream of data.
[cloudwatchlogs-stream](https://github.com/nearform/cloudwatchlogs-stream) to stream the logs to CloudWatch.

All the originating requests are wrapped in a
[never-ending-stream](https://github.com/mcollina/never-ending-stream).

## License

MIT
