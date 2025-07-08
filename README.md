# Parki ar minda calendar

A very simple app that gets ics files from a directory (with webdav or nginx's autoindex in json format) and renders them in a nice web calendar.

## Setup

1. Install nginx and the webdav modules: [`ngx_http_dav_module`](https://nginx.org/en/docs/http/ngx_http_dav_module.html) and [`dav-ext-module`](https://github.com/arut/nginx-dav-ext-module)
2. Set up nginx location with `dav_methods off; dav_ext_methods OPTIONS PROPFIND;` on the directory from which you intend to serve the ics files
3. Put the ics files in that directory
4. Set the location of the ics directory in [config.js](./config.js)
5. Serve this repo via http
