#!/usr/bin/env bash

# DON'T ADD SCRIPTS TO THIS FILE. BUILD TOOLING GOES IN THE `src/build_tooling`
# directory and is all written in JS.

node scripts/bundle_build_tooling.js;
node build_output/out.js "$@";