from bs4 import BeautifulSoup
import requests
import os
import csv

# os.environ['NO_PROXY'] = 'localhost'

url = 'https://www.masseyratings.com/cb/arch/compare2018-9.htm'
# url = 'https://www.masseyratings.com/cb/compare.htm'
raw_html = requests.get(url)
soup = BeautifulSoup(raw_html.text, 'html5lib')
text = soup.find('pre').text

conferences = ['A10', 'AAC', 'ACC', 'AEC', 'ASUN', 'B10', 'B12', 'BSC', 'BSo', 'BE', 'BWC', 'CAA', 'CUSA', 'HL', 'Ivy', 'MAC', 'MAAC', 'MEAC', 'MVC', 'MWC', 'NEC', 'OVC', 'P12', 'PL', 'SC', 'SBC', 'SEC', 'SL', 'SLC', 'SWAC', 'WAC', 'WCC', ]
header_blacklist = ['Rank,', 'Team,', 'Conf,', 'Record', 'Team', 'Mean', 'Median', 'St.Dev']

lines = text.split('\n')
algorithms = []

for line in lines:
    if 'MAS' in line:
        algorithms = [item for item in line.split() if item not in header_blacklist]
        break

rankings = []
for i, line in enumerate(lines[8:466]):
    team_name_found = False
    building_name = False

    rank_list = []
    team_name = ''

    # Skip empty rows or rows that repeat the header
    if len(line) == 0 or 'Rank' in line or '---' in line:
        continue

    for item in line.split():
        # For each item in a row, if it is a number add it to the rank list
        if item.isdigit():
            rank_list.append(int(item))
            building_name = False
        # If it is the first non-number it is the team's name, star building the name
        elif not team_name_found:
            team_name_found = True
            building_name = True
            team_name = item
        # Team names can have spaces, spanning more than one item. Build name skipping conference and win-loss record items
        elif building_name and item not in conferences and not any(str.isdigit(c) for c in item):
            team_name += ' ' + item

    # Some of the numbers found are the average team ranking, not the ranking of a system. Remove them.
    rank_list = [team_name] + [r for i, r in enumerate(rank_list) if (i-10) % 16 != 0]
    rankings.append(rank_list)

# create csv file
with open('massey.csv', 'w', newline='') as csvfile:
    writer = csv.writer(csvfile)
    # write the header
    writer.writerow(['Team'] + algorithms)
    for row in rankings:
        writer.writerow(row)

