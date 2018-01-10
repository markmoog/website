var total_accuracy = {}
var weekly_accuracy_pre = {}
var weekly_accuracy_ret = {}

$( function() {
    load_rank_analysis()
})

function load_rank_analysis() {
    var data_path = '../vega/data/ranking_analysis.json'

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', data_path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            data = JSON.parse(xobj.responseText)

            total_accuracy = data.total
            weekly_accuracy_pre = data.weekly.predictive
            weekly_accuracy_ret = data.weekly.retrodictive

            load_rank_table()
            update_vega()
        }
    };
    xobj.send(null);
}

function load_rank_table() {
    var data_path = '../data/system_info.csv'

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', data_path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            data = Papa.parse(xobj.responseText).data
            create_table(data)
        }
    };
    xobj.send(null);
}

function create_table(data) {
    console.log(total_accuracy)
    // create and fill in system info table
    var table = $('<table id="sysinfo" class="display"><thead><tr><th></th><th>System</th><th>P%</th><th>R%</th></tr></thead></table>')
    var body = $('<tbody></tbody>')
    $(data).each(function (i, row_data) {
        var row = $('<tr></tr>')
        abbr = row_data[0]
        // find the predictive and retodictive accuracy for the system
        pre_acc = 0.0
        ret_acc = 0.0
        for(i=0; i< total_accuracy.length; i+=1){
            sys = total_accuracy[i]
            if (sys.system == abbr) {
                pre_acc = (sys.predict_acc * 100).toFixed(1)
                ret_acc = (sys.retro_acc * 100).toFixed(1)
                break
            }
        }
        name = '<a href=' + row_data[2] + '>' + row_data[1] + '</a>'
        row.append($('<td>' + abbr + '</td><td>' + name + '</td><td>' + pre_acc + '</td><td>' + ret_acc + '</td>'))
        body.append(row)
    })

    table.append(body)
    $('.legend').append(table)
    $('#sysinfo').DataTable({
        "paging":   false,
        "searching": false,
        "info":     false,
        "autoWidth": false
    })

}

function update_vega() {
    var spec = "../vega/visualizations/ranking_analysis.json"
    var dim = 500
    vega.embed('#vis', spec, {"actions":false, "width": dim, "height": dim}).then(function(result){
        var view = result.view;
        view.insert('total', total_accuracy)
        .resize()
        .run();
    });
}

