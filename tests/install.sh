#!/bin/bash

for dir in tests/e2e/samples/*; do
  echo "Install $dir"
  npm install --prefix $dir
done
