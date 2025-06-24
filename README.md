# Parki ar minda calendar

A very simple app that gets ics files from a directory (with nginx's autoindex in json format) and renders them in a nice web calendar.

## Setup

1. Set up nginx location with `autoindex = on; autoindex_format = json` on the directory from which you intend to serve the ics files
2. Put the ics files in that directory
3. Set the location of the ics directory in [config.js](./config.js)
4. Serve this repo via http
