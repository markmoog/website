var total_accuracy = {}
var weekly_accuracy_pre = {}
var weekly_accuracy_ret = {}
var dates = ['12/17/17', '12/24/17', '12/31/17', '1/7/18']

$( function() {
    load_rank_analysis()
})

function load_rank_analysis() {
    var data_path = '../data/ranking_analysis/ranking_analysis.json'

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
    var data_path = '../data/ranking_analysis/system_info.csv'

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
    // create and fill in system info table
    var table = $('<table id="sysinfo" class="table-striped table-hover table-sm table"><thead><tr><th scope="col"></th><th scope="col">System</th><th scope="col">P%</th><th scope="col">R%</th></tr></thead></table>')
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
        row.append($('<td class="text-center">' + abbr + '</td><td>' + name + '</td><td class="text-center">' + pre_acc + '</td><td class="text-center">' + ret_acc + '</td>'))
        body.append(row)
    })

    table.append(body)
    $('.legend').append(table)
    $('#sysinfo').DataTable({
        "paging":   false,
        "searching": false,
        "info":     false
    })

}

function update_vega() {
    var spec = "../vega/ranking_analysis.json"
    var dim = 500
    vega.embed('#vis', spec, {"actions":false, "width": dim, "height": dim}).then(function(result){
        var view = result.view;
        view.insert('total', total_accuracy)
        .resize()
        .run();
    });
}

function set_date(date_index, end) {
    if(end==0){
        // set the start date
        date = dates[date_index]
        document.getElementById("startdate").innerHTML=date
    }
    if(end==1){
        // set the end date
        if(date_index >= dates.length){
             document.getElementById("enddate").innerHTML='Now'
         }else{
            date = dates[date_index]
            document.getElementById("enddate").innerHTML=date
         }
    }
}

function calculate_accuracies() {
    start_date = document.getElementById("startdate").innerHTML
    end_date = document.getElementById("enddate").innerHTML

    start_index = dates.indexOf(start_date)
    end_index = dates.indexOf(end_date)

    if(start_index >= end_index && end_index != -1){
        console.log("You picked an unusable range!!!!!")
        return
    }

    console.log(start_index, end_index)
}

