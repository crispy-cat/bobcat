#!/bin/sh
rm -rf dist/*;
tsc && node dist/index.js;
