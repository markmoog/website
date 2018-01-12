import pandas
from bs4 import BeautifulSoup
import requests
from io import StringIO
import csv
import datetime
import json

# constants and initializations
ranking_dates = [datetime.date(2017,12,17), datetime.date(2017,12,24), datetime.date(2017,12,31), datetime.date(2018,1,7)]
systems = ['ARG', 'BBT', 'BUR', 'BWE', 'COL', 'DAV', 'DCI', 'DII', 'DOK', 'DOL', 'EBP', 'FAS', 'FMG', 'FSH', 'HAS', 'KPK', 'LOG', 'MAS', 'MMG', 'MOR', 'PGH', 'PIG', 'POM', 'PRR', 'RPI', 'RT', 'RTH', 'RTP', 'SAG', 'SEL', 'SGR', 'SMN', 'STH', 'TRK', 'TRP', 'WIL', 'WLK', 'WOL', 'YAG', 'ZAM']
header_blacklist = ['Rank', 'Mean', 'Trimmed', 'Median', 'StDev', 'AP', 'DES', 'USA']

teams = []
retrodictive_counts = []
predictive_counts = []

for s in systems:
    retrodictive_counts.append(0)
    predictive_counts.append(0)

with open('./data/massey_teams.csv', 'r') as f:
    reader = csv.reader(f)
    for line in reader:
        teams.append(line[0].strip())

def games():
    url = 'https://www.masseyratings.com/scores.php?s=298892&sub=11590&all=1&mode=2&format=0'
    raw_html = requests.get(url)
    soup = BeautifulSoup(raw_html.text, 'html.parser')

    data_html = soup.find('pre')
    data_text = data_html.text.replace(';', '')
    data_buffer = StringIO(data_text)

    widths = [10, 2, 22, 5, 2, 22, 5]
    col_names = ['date', 'loc1', 'team1', 'score1', 'loc2', 'team2', 'score2']
    game_df = pandas.read_fwf(data_buffer, names=col_names, header=None, widths=widths, skipfooter=3)

    return game_df


def latest_ranking(ranking_dates):
    latest_date = ranking_dates[-1]
    date_string = latest_date.strftime("%Y%m%d")
    ranking_filename = './data/compare_' + date_string + '.csv'
    ranking_df = pandas.read_csv(ranking_filename, index_col=0)
    ranking_df = ranking_df.rename(columns=lambda x: x.strip(), index=lambda x: x.strip())

    return ranking_df


def rankings(ranking_dates):
    for ranking_date in ranking_dates:
        date_string = ranking_date.strftime("%Y%m%d")
        ranking_filename = './data/compare_' + date_string + '.csv'
        ranking_df = pandas.read_csv(ranking_filename, index_col=0)
        ranking_df = ranking_df.rename(columns=lambda x: x.strip(), index=lambda x: x.strip())

        yield ranking_date, ranking_df


def retrodictive_accuracy(systems, games, ranking_dates):
    week_correct = [0] * len(systems)
    data = []

    game_count = 0

    # calculate the retrodictive accuracy
    for ranking_date, ranking_df in rankings(ranking_dates):
        for game_tuple in games.iterrows():
            game_data = game_tuple[1]

            margin = game_data[3] - game_data[6]
            team1 = game_data[2]
            team2 = game_data[5]

            date = datetime.datetime.strptime(game_data[0], '%Y-%m-%d')
            days = (date - datetime.datetime.combine(ranking_dates[-1], datetime.time())).days

            if days >= 0:
                data.append([x / game_count for x in week_correct])
                week_correct = [0 for x in week_correct]
                game_count = 0
                break

            game_count += 1

            for i, sys in enumerate(systems):
                rank = ranking_df[sys]
                ranking_prediction = ranking_df[sys][team2] - ranking_df[sys][team1]

                if ranking_prediction * margin >= 0:
                    week_correct[i] += 1

    return data


def predictive_accuracy(systems, games, ranking_dates):
    total_correct = [0] * len(systems)
    week_correct = [0] * len(systems)
    counts = []

    total_games = 0
    week_games = 0

    # load the initial ranking data
    ranking_gen = rankings(ranking_dates)
    ranking_date, ranking_df = next(ranking_gen)

    for game_tuple in game_df.iterrows():
        game_data = game_tuple[1]

        margin = game_data[3] - game_data[6]
        team1 = game_data[2]
        team2 = game_data[5]

        date = datetime.datetime.strptime(game_data[0], '%Y-%m-%d')
        days = (date - datetime.datetime.combine(ranking_date, datetime.time())).days

        if days < 0:
            continue

        if days > 7:
            print(date)
            ranking_date, ranking_df = next(ranking_gen)


            counts.append([x / week_games for x in week_correct])
            week_games = 0
            week_correct = [0 for x in week_correct]

        week_games += 1
        total_games += 1

        for i, sys in enumerate(systems):
            rank = ranking_df[sys]
            ranking_prediction = ranking_df[sys][team2] - ranking_df[sys][team1]

            if ranking_prediction * margin > 0:
                week_correct[i] += 1
                total_correct[i] += 1

    total_correct = [x / total_games for x in total_correct]

    if week_games > 0:
        counts.append([x / week_games for x in week_correct])
    else:
        counts.append([0.0 for x in week_correct])

    return total_correct, counts

def generate_dictionary(systems, dates, retro_weekly, retro_total, predict_weekly, predict_total):
    return_dict = {'total': [], 'weekly': {'predictive': [], 'retrodictive': []}}

    total = return_dict['total']

    for s, rt, pt in zip(systems, retro_total, predict_total):
        total.append({'system': s, 'retro_acc': rt, 'predict_acc': pt})

    retro_list = return_dict['weekly']['retrodictive']
    predict_list = return_dict['weekly']['predictive']

    for rw, pw, date in zip(retro_weekly, predict_weekly, dates):
        temp_dr = {'date': date.strftime('%Y-%m-%d')}
        temp_dp = {'date': date.strftime('%Y-%m-%d')}

        for s, rt, pt in zip(systems, rw, pw):
            temp_dr[s] = rt
            temp_dp[s] = pt

        retro_list.append(temp_dr)
        predict_list.append(temp_dp)

    return return_dict


game_df = games()
r_week = retrodictive_accuracy(systems, game_df, ranking_dates)
p_tot, p_week = predictive_accuracy(systems, game_df, ranking_dates)

output_json = generate_dictionary(systems, ranking_dates, r_week, r_week[-1], p_week, p_tot)

with open('ranking_analysis.json', 'w') as output_file:
    json.dump(output_json, output_file)
