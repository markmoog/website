import numpy
import pandas

distance_matrix = numpy.genfromtxt('output.csv', delimiter=',')
distance_frame = pandas.DataFrame(distance_matrix)

def center(df):
    result = df.copy()
    for feature_name in df.columns:
        mean_value = df[feature_name].mean()
        result[feature_name] = df[feature_name] - mean_value
    return result

centered_frame = center(distance_frame)
ratings = centered_frame.mean(axis=1)

team_url = './data/teams.txt'
teams = []
with open(team_url) as team_file:
    for line in team_file.readlines():
        teams.append(line[1:-3])

with open('ratings_2018.csv', 'w') as ratings_file:
    first_entry = True
    for team, rating in sorted(zip(teams, ratings), key = lambda x: x[1], reverse=True):
        if not first_entry:
            ratings_file.write('\n')
        else:
            first_entry = False
        ratings_file.write(team + ', {0:.1f}'.format(rating))
