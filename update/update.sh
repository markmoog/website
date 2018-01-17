# !/bin/bash

echo "Downloading latest game results"
wget https://kenpom.com/cbbga18.txt
mv ./cbbga18.txt ./data/cbbga18.txt

echo "Generaging edges for win tree"
./scripts/edge_generator

echo "Building graph distance matrix"
./scripts/bbtool -m ./scripts/config_file

echo "Generating ratings from graph distance matrix"
python3 ./scripts/create_ratings.py

echo "Updaing the rankings analysis"
python3 ./scripts/ranking_comparison.py

echo "Moving files into local website"
mv edges2018.json ../data/win_trees/edges2018.json
mv ratings_2018.csv ../data/ratings/ratings_2018.csv
mv ranking_analysis.json ../data/ranking_analysis/ranking_analysis.json

echo "Updating dates on local website"
# currently assuming data is from the previous day (-1d), might want to add an option to specify the date
YEAR=$(date -v -1d +%y)
MONTH=$(date -v -1d +%m)
DAY=$(date -v -1d +%d)
sed -i .bak "s/through [0-9]*\\/[0-9]*\\/[0-9]*/through $MONTH\\/$DAY\\/$YEAR/g" ../ratings
sed -i .bak "s/through [0-9]*\\/[0-9]*\\/[0-9]*/through $MONTH\\/$DAY\\/$YEAR/g" ../win_trees
sed -i .bak "s/through [0-9]*\\/[0-9]*\\/[0-9]*/through $MONTH\\/$DAY\\/$YEAR/g" ../ranking_analysis

echo "Uploading local changes to AWS"
aws s3 cp ../ratings s3://www.markmoog.com/ratings
aws s3 cp ../win_trees s3://www.markmoog.com/win_trees
aws s3 cp ../ranking_analysi s3://www.markmoog.com/ranking_analysis
aws s3 cp ../data/ratings/ratings_2018.csv s3://www.markmoog.com/data/ratings/ratings_2018.csv
aws s3 cp ../data/win_trees/edges2018.json s3://www.markmoog.com/data/win_trees/edges2018.json
aws s3 cp ../data/ranking_analysis/ranking_analysis.json s3://www.markmoog.com/data/ranking_analysis/ranking_analysis.json

echo "Invalidating old files on CloudFront"
aws cloudfront create-invalidation --distribution-id E2QBM02Z5J7Y5V --paths /ratings.html /win_trees.html /ranking_analysis.html /data/trees/edges2018.json /data/ratings/ratings_2018.csv /data/ranking_analysis/ranking_analysis.json

echo "Cleaning up"
rm output.csv
