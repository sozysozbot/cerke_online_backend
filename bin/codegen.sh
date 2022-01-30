#!/bin/sh -eu

rm -rf src/codegen
mkdir -p src/codegen

TMP=`mktemp --suffix=.yaml`
# 対応: https://github.com/drwpow/openapi-typescript/issues/462
sed 's/anyOf/oneOf/' openapi.yaml > $TMP
npx openapi-typescript $TMP --output src/codegen/openapi.ts
rm $TMP
