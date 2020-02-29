#!/bin/sh

rm -rf src/lib/cerke_calculate_hands_core
rm -rf src/lib/cerke_online_api

mkdir src/lib/cerke_calculate_hands_core
mkdir src/lib/cerke_online_api

find cerke_calculate_hands_core -name "*.ts" | xargs -I {} cp {} src/lib/cerke_calculate_hands_core
find cerke_online_api -name "*.ts" | xargs -I {} cp {} src/lib/cerke_online_api
