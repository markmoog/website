# !/bin/bash

echo "Uploading all local files to AWS"
aws s3 cp --content-type 'text/html' ../index.html s3://www.markmoog.com/index.html
aws s3 cp --content-type 'text/html' ../404 s3://www.markmoog.com/404
aws s3 cp --content-type 'text/html' ../about s3://www.markmoog.com/about
aws s3 cp --content-type 'text/html' ../contact s3://www.markmoog.com/contact
aws s3 cp --content-type 'text/html' ../legal s3://www.markmoog.com/legal
aws s3 cp --content-type 'text/html' ../ratings s3://www.markmoog.com/ratings
aws s3 cp --content-type 'text/html' ../win_trees s3://www.markmoog.com/win_trees
aws s3 cp --content-type 'text/html' ../ranking_analysis s3://www.markmoog.com/ranking_analysis
aws s3 cp --content-type 'text/html' ../articles/graph_ratings s3://www.markmoog.com/articles/graph_ratings

aws s3 cp ../css/styles.css s3://www.markmoog.com/css/styles.css

aws s3 cp ../data/ratings/ratings_2018.csv s3://www.markmoog.com/data/ratings/ratings_2018.csv
aws s3 cp ../data/win_trees/edges2018.json s3://www.markmoog.com/data/win_trees/edges2018.json
aws s3 cp ../data/ranking_analysis/ranking_analysis.json s3://www.markmoog.com/data/ranking_analysis/ranking_analysis.json
aws s3 cp ../data/ranking_analysis/system_info.json s3://www.markmoog.com/data/ranking_analysis/system_info.json

aws s3 cp ../js/ranking_analysis.js s3://www.markmoog.com/js/ranking_analysis.js
aws s3 cp ../js/win_tree.js s3://www.markmoog.com/js/win_tree.js

aws s3 cp ../vega/basketball_tree.json s3://www.markmoog.com/vega/basketball_tree.json
aws s3 cp ../vega/basketball_tree_large.json s3://www.markmoog.com/vega/basketball_tree_large.json
aws s3 cp ../vega/ranking_analysis.json s3://www.markmoog.com/vega/ranking_analysis.json

