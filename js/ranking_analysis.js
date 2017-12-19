var total_accuracy = {}
var weekly_accuracy_pre = {}
var weekly_accuracy_ret = {}

$( function() {
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

            update_vega()
        }
    };
    xobj.send(null);
})

function update_vega(){
    var spec = "../vega/visualizations/ranking_analysis.json"
    var dim = 500
    vega.embed('#vis', spec, {"actions":false, "width": dim, "height": dim}).then(function(result){
        var view = result.view;
        view.insert('total', total_accuracy)
        .resize()
        .run();
    });
}

