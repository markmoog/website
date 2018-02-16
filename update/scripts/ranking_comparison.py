import pandas
from bs4 import BeautifulSoup
import requests
from io import StringIO
import csv
import datetime
import json

# constants and initializations
ranking_dates = [datetime.date(2017,11,12), datetime.date(2017,11,19), datetime.date(2017,11,26), datetime.date(2017,12,3), datetime.date(2017,12,10), datetime.date(2017,12,17), datetime.date(2017,12,24), datetime.date(2017,12,31), datetime.date(2018,1,7), datetime.date(2018,1,14), datetime.date(2018,1,21), datetime.date(2018,1,28), datetime.date(2018,2,4), datetime.date(2018,2,11)]
header_blacklist = ['', 'Conf', 'WL', 'Rank', 'Mean', 'Trimmed', 'Median', 'StDev', 'AP', 'DES', 'USA', 'BNT', 'REW', 'PGH', 'RT']

teams = []

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
    ranking_filename = './data/massey_' + date_string + '.csv'
    ranking_df = pandas.read_csv(ranking_filename, index_col=0)
    ranking_df = ranking_df.rename(columns=lambda x: x.strip(), index=lambda x: x.strip())

    return ranking_df


def rankings(ranking_dates):
    for ranking_date in ranking_dates:
        date_string = ranking_date.strftime("%Y%m%d")
        ranking_filename = './data/massey_' + date_string + '.csv'
        ranking_df = pandas.read_csv(ranking_filename, index_col=0)
        ranking_df = ranking_df.rename(columns=lambda x: x.strip(), index=lambda x: x.strip())

        yield ranking_date, ranking_df


def retrodictive_accuracy(games, ranking_dates):
    data = []
    current_ranking = {}
    week_correct = {}
    game_count = 0

    # calculate the retrodictive accuracy
    for ranking_date, ranking_df in rankings(ranking_dates):
        # this allows us to use an algorithm's ranking from previous weeks if its current ranking is unavailable
        for system in ranking_df.columns.values.tolist():
            if system not in header_blacklist:
                current_ranking[system] = ranking_df[system]

        week_correct = {system: 0 for system in current_ranking.keys()}

        # Currently looping through all games every week, consider changing it
        # so games are only looped through once if this starts taking too long.
        for game_tuple in games.iterrows():
            game_data = game_tuple[1]

            margin = game_data[3] - game_data[6]
            team1 = game_data[2]
            team2 = game_data[5]

            if team1 == "SIUE":
                team1 = "Edwardsville"

            if team2 == "SIUE":
                team2 = "Edwardsville"

            date = datetime.datetime.strptime(game_data[0], '%Y-%m-%d')
            days = (date - datetime.datetime.combine(ranking_dates[-1], datetime.time())).days

            if days >= 0:
                data.append({system: correct / game_count for system, correct in week_correct.items()})
                game_count = 0
                break

            game_count += 1

            for system, ranking in current_ranking.items():
                try:
                    ranking_prediction = ranking[team2] - ranking[team1]
                except:
                    print(system, team1, team2)
                    break

                if ranking_prediction * margin >= 0:
                    week_correct[system] += 1

    return data


def predictive_accuracy(games, ranking_dates):
    # the number of correctly predicted games for the week for each system
    games_correct = []

    # number of total games in a given week
    games_total = []

    # incrementer for games in a week
    game_inc = 0

    # load the initial ranking data
    ranking_gen = rankings(ranking_dates)
    ranking_date, ranking_df = next(ranking_gen)
    current_ranking = {system: ranking_df[system] for system in ranking_df.columns.values.tolist() if system not in header_blacklist}

    week_correct = {system: 0 for system in current_ranking.keys()}

    for game_tuple in game_df.iterrows():
        game_data = game_tuple[1]

        margin = game_data[3] - game_data[6]
        team1 = game_data[2]
        team2 = game_data[5]

        if team1 == "SIUE":
            team1 = "Edwardsville"

        if team2 == "SIUE":
            team2 = "Edwardsville"

        date = datetime.datetime.strptime(game_data[0], '%Y-%m-%d')
        days = (date - datetime.datetime.combine(ranking_date, datetime.time())).days

        if days < 0:
            continue

        if days > 7:
            print(date)
            games_correct.append(week_correct)
            games_total.append(game_inc)

            game_inc = 0

            # load next set of rankings and update the current_rankings dictionary with the new rankings
            ranking_date, ranking_df = next(ranking_gen)
            for system in ranking_df.columns.values.tolist():
                if system not in header_blacklist:
                    current_ranking[system] = ranking_df[system]

            # reset the number of correct games picked this week, we are starting a new week
            week_correct = {system: 0 for system in current_ranking.keys()}

        game_inc += 1

        for system, ranking in current_ranking.items():
            try:
                ranking_prediction = ranking[team2] - ranking[team1]
            except:
                print("Error with system: " + system)
                print(ranking[team2])

            if ranking_prediction * margin > 0:
                week_correct[system] += 1

    if game_inc > 0:
        games_correct.append(week_correct)
        games_total.append(game_inc)

    return games_correct, games_total

def generate_dictionary(dates, games_total, predict_correct, retro_accuracy):
    return_dict = []

    for date, num_games, correct_dict, retro_dict in zip(dates, games_total, predict_correct, retro_accuracy):
        system_performance = {}
        for system in correct_dict.keys():
            correct = correct_dict[system]
            retro_acc = retro_dict[system]
            system_performance[system] = [correct,retro_acc]

        week_data = {'date': date.strftime('%m/%d/%Y'), 'num_games': num_games, 'systems': system_performance}
        return_dict.append(week_data)

    return return_dict

game_df = games()

retro_accuracy = retrodictive_accuracy(game_df, ranking_dates)
predict_correct, games_total = predictive_accuracy(game_df, ranking_dates)
output_json = generate_dictionary(ranking_dates, games_total, predict_correct, retro_accuracy)

with open('ranking_analysis.json', 'w') as output_file:
    json.dump(output_json, output_file)
