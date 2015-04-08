# docker-cloudwatchlogs
#
# VERSION 0.1.0

FROM node:0.10-onbuild
MAINTAINER Damian Beresford <@dberesford>

ENTRYPOINT ["/usr/src/app/index.js"]
CMD []
