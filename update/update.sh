# !/bin/bash

echo "Downloading latest game results"
wget https://www.kenpom.com/cbbga18.txt
mv ./cbbga18.txt ./data/cbbga18.txt

echo "Generaging edges for win tree"
./scripts/edge_generator

echo "Building graph distance matrix"
./scripts/bbtool -m ./scripts/config_file

echo "Generating ratings from graph distance matrix"
python3 ./scripts/create_ratings.py

echo "Moving files into local website"
mv edges2018.json ../trees/edges2018.json
mv ratings_2018.csv ../ratings/ratings_2018.csv

echo "Updating dates on local website"
# currently assuming data is from the previous day (-1d), might want to add an option to specify the date
YEAR=$(date -v -1d +%y)
MONTH=$(date -v -1d +%m)
DAY=$(date -v -1d +%d)
sed -i .bak "s/through [0-9]*\\/[0-9]*\\/[0-9]*/through $MONTH\\/$DAY\\/$YEAR/g" ../documents/ratings.html
sed -i .bak "s/through [0-9]*\\/[0-9]*\\/[0-9]*/through $MONTH\\/$DAY\\/$YEAR/g" ../documents/win_trees.html


echo "Uploading local changes to AWS"
aws s3 cp ../documents/ratings.html s3://www.markmoog.com/documents/ratings.html
aws s3 cp ../documents/win_trees.html s3://www.markmoog.com/documents/win_trees.html
aws s3 cp ../ratings/ratings_2018.csv s3://www.markmoog.com/ratings/ratings_2018.csv
aws s3 cp ../trees/edges2018.json s3://www.markmoog.com/trees/edges2018.json

echo "Invalidating old files on CloudFront"
aws cloudfront create-invalidation --distribution-id E2QBM02Z5J7Y5V --paths /documents/ratings.html /documents/win_trees.html /trees/edges2018.json /ratings/ratings_2018.csv

echo "Cleaning up"
rm output.csv
