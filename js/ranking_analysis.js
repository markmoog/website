var release_dates = []
var ranking_metadata = []
var ranking_performance = []

$( function() {
    load_ranking_performance()
})

function load_ranking_performance() {
    var data_path = '/data/ranking_analysis/ranking_analysis.json'

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', data_path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            ranking_performance = JSON.parse(xobj.responseText)

            // fill in date array
            for (var week in ranking_performance){
                release_dates.push(ranking_performance[week].date)
            }

            populate_button(release_dates)
            load_ranking_metadata()
        }
    };
    xobj.send(null);
}

function populate_button(release_dates) {
    var dropdown_start = $('<div class="dropdown-menu" aria-labelledby="start-date"></div>')
    var dropdown_end = $('<div class="dropdown-menu" aria-labelledby="end-date"></div>')
    $(release_dates).each(function (i, date) {
        var selection_start = $('<button onclick="set_date(' + i + ', 0)" class="dropdown-item">' + date + '</button>')
        var selection_end = $('<button onclick="set_date(' + i + ', 1)" class="dropdown-item">' + date + '</button>')

        dropdown_start.append(selection_start)
        dropdown_end.append(selection_end)
    })
    $('#start-select').append(dropdown_start)
    $('#end-select').append(dropdown_end)

    set_date(0, 0)
    set_date(release_dates.length-1, 1)
}

function load_ranking_metadata() {
    var data_path = '/data/ranking_analysis/system_info.json'

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', data_path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            ranking_metadata = JSON.parse(xobj.responseText)
            calculate_accuracy(0, release_dates.length - 1)
        }
    };
    xobj.send(null);
}

function calculate_accuracy(start_date_index, end_date_index) {
    // loop through the selected weeks
    var total_games = {}
    var correct_games = {}
    var retrodictive_accuracy = {}

    for (var i = start_date_index; i <= end_date_index; i+=1 ) {
        var w_performance = ranking_performance[i]['systems']
        var w_games = ranking_performance[i].num_games

        Object.keys(w_performance).forEach(function(system) {
            var w_correct_games = w_performance[system][0]
            var w_retrodictive_accuracy = w_performance[system][1]

            if(system in total_games) {
                total_games[system] += w_games
                correct_games[system] += w_correct_games
                retrodictive_accuracy[system] = w_retrodictive_accuracy
            }
            else {
                total_games[system] = w_games
                correct_games[system] = w_correct_games
                retrodictive_accuracy[system] = w_retrodictive_accuracy
            }
        })
    }


    var hide_incomplete = document.getElementById("checkbox-hide").checked
    var calculated_accuracy = []

    for (var system in total_games) {
        console.log(system)
        var system_start_date_index = ranking_metadata[system][2]
        var missing_data = system_start_date_index > start_date_index
        if (hide_incomplete && missing_data) { continue }

        calculated_accuracy.push({"abbreviation": system,
                                  "retrodictive_accuracy": retrodictive_accuracy[system],
                                  "predictive_accuracy": correct_games[system] / total_games[system],
                                  "missing_data": missing_data})
    }

    update_table(calculated_accuracy)
}

function update_table(calculated_accuracy) {
    // create and fill in system info table
    var table = $('<table id="sysinfo" class="table-striped table-hover table-sm table"></table>')
    var header = $('<thead></thead>')
    var header_row = $('<tr></tr>')
    header_row.append($('<th></th>'),
                      $('<th>System</th>'),
                      $('<th>P%</th>)'),
                      $('<th>R%</th>'),
                      $('<th><small>Initial Ranking</small></th>'))

    header.append(header_row)
    table.append(header)

    var body = $('<tbody></tbody>')

    $(calculated_accuracy).each(function (i, system) {
        var row = $('<tr></tr>')
        var abbreviation = system['abbreviation']
        var predictive_accuracy = (system['predictive_accuracy'] * 100).toFixed(1)
        var retrodictive_accuracy = (system['retrodictive_accuracy'] * 100).toFixed(1)
        var system_metadata = ranking_metadata[abbreviation]
        var system_name = system_metadata[0]
        var system_link = system_metadata[1]
        var initial_release = system_metadata[2]
        var name = '<a href=' + system_link + '>' + system_name + '</a>'
        var indicator_class = ''

        if (system['missing_data']) {
            indicator_class = 'missing-data'
        }


        row.append($('<td>' + abbreviation + '</td>'),
                   $('<td>' + name + '</td>'),
                   $('<td class="' + indicator_class + '">' + predictive_accuracy + '</td>'),
                   $('<td>' + retrodictive_accuracy + '</td>'),
                   $('<td class="text-center ' + indicator_class + '"><small>' + release_dates[initial_release] + '</small></td>'))

        body.append(row)
    })

    table.append(body)
    $('.legend').html(table)

    $('#sysinfo').DataTable({
        "paging":   false,
        "searching": false,
        "info": false,
        "destroy": true,
        "columnDefs": [{
          "targets": 4,
          "orderable": false
        }]
    })

    update_vega(calculated_accuracy)
}

function update_vega(calculated_accuracy) {
    var spec = "/vega/ranking_analysis.json"
    var dim = 500
    vega.embed('#vis', spec, {"actions":false, "width": dim, "height": dim}).then(function(result){
        var view = result.view;
        view.insert('total', calculated_accuracy)
        .resize()
        .run();
    });
}

function set_date(date_index, end) {
    var date = release_dates[date_index]
    if (end == 0) { document.getElementById("start-date").innerHTML = date }
    else { document.getElementById("end-date").innerHTML = date }
}

function update_accuracy() {
    var start_date = document.getElementById("start-date").innerHTML
    var end_date = document.getElementById("end-date").innerHTML

    var start_index = release_dates.indexOf(start_date)
    var end_index = release_dates.indexOf(end_date)

    if (start_index > end_index && end_index != -1) {
        console.log("Error: unusable range!!!!!")
        return
    }

    calculate_accuracy(start_index, end_index)
}

