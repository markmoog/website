var ring_spacing, base_spacing = 220
var teams = []
var highlight_teams = []

$( function() {
    set_year(2019)
})

function setup_autocomplete(teams) {
    $( "#team_selection" ).autocomplete({
        source: teams
    });
};

function set_year(year){
    document.getElementById("yearSelector").innerHTML=year
    var teams_path = '/data/win_trees/teams'+year+'.json'

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', teams_path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            teams = JSON.parse(xobj.responseText)
            setup_autocomplete(teams)
        }
    };
    xobj.send(null);
}

function load_edges() {
    var year = document.getElementById("yearSelector").innerHTML
    var edge_path = '/data/win_trees/edges' + year + '.json'

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', edge_path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            var edges = JSON.parse(xobj.responseText)
            generate(edges, teams);
        }
    };
    xobj.send(null);
 }

function generate(edges, teams){
    var root_team = document.getElementById('team_selection').value
    var highlight_text = document.getElementById('highlight_selection').value

    highlight_teams = []
    for (var i in highlight_text.split(',')){
        highlight_teams.push(highlight_text.split(',')[i].trim())
    }

    var root_id = teams.indexOf(root_team);

    radial_tree = [{'id': root_id, 'name': root_team}]
    nodes_to_visit = [root_id]
    nodes_visited = [root_id]
    while(nodes_to_visit.length > 0){
        team_id = nodes_to_visit.shift()
        for (var index in edges[team_id]){
            var child_id = edges[team_id][index]
            if ($.inArray(child_id, nodes_visited) == -1){
                nodes_visited.push(child_id)
                nodes_to_visit.push(child_id)
                radial_tree.push({'id': child_id, 'parent': team_id, 'name': teams[child_id]})
            }
        }
    }
    var teams_contained = radial_tree.length
    var info_text = document.getElementById("teams_contained")
    info_text.innerHTML = "Tree contains " + teams_contained + " teams"
    transform(radial_tree);
}

function highlighted_paths(node, link_array){
    // check if we need to highlight this node
    if($.inArray(node.data.name, highlight_teams) != -1){
        // if we do, find all the node's ancestors
        var ancestors = node.ancestors()
        var old_x = node.x
        var old_y = node.y
        for(var i in ancestors){
            var anc = ancestors[i]
            link_array.push({"source":{"x":anc.x, "y":anc.y},"target":{"x": old_x, "y": old_y}})
            old_x = anc.x
            old_y = anc.y
        }
    }

    // go to all children nodes
    var children = node.children
    for(var i in children){
        highlighted_paths(children[i], link_array)
    }

    return link_array
}

function transform(input_data){
    // create tree with d3
    var tree = d3.tree()
                 .size([6.283, 1])
                 .separation(function(a, b){ return (a.parent == b.parent ? 1 : 2) / a.depth});

    var stratify = d3.stratify()
                     .id(function(d){return d.id;})
                     .parentId(function(d){return d.parent;})

    var d3_root = tree(stratify(input_data))

    if (d3_root.height < 4){
        ring_spacing = base_spacing * 1.6
    }else if (d3_root.height == 4){
        ring_spacing = base_spacing * 1.4
    }else{
        ring_spacing = base_spacing
    }
    var display_size = (d3_root.height + 1) * ring_spacing
    // links part
    var linker = d3.linkRadial()
                   .angle(function(d){ return d.x + 3.14159/2; })
                   .radius(function(d){ return d.y * (display_size - ring_spacing)/2; });

    var d3_links = d3_root.links()
    // construct the highlighted path tree
    var d3_higlight_links = highlighted_paths(d3_root, [])

    var vega_links = []
    var vega_highlight_links = []

    var chkBox = document.getElementById('large_image');
    var offset = 0
    if (chkBox.checked){
        offset = display_size/2
    }
    for (var i in d3_links){
        vega_links.push({'path': linker(d3_links[i]),
                         'x': offset,
                         'y': offset});
    }

    for (var i in d3_higlight_links){
        vega_highlight_links.push({'path': linker(d3_higlight_links[i]),
                                    'x': offset,
                                    'y': offset});
    }

    // change d3 tree to a vega tree
    var vega_tree = []
    vega_tree = vegafy_root(d3_root, vega_tree, display_size)

    // send data to vega for display
    update_vega(vega_tree, vega_links, vega_highlight_links, display_size);
}

function vegafy_root(node, vega_tree, display_size){
    var side = node.x * 57.3 > 90 && node.x * 57.3 < 270 ? true : false
    var color = "#CCCCCC"
    var bold = false
    var size = 30
    if (node.depth == 0){
        color = "#4682B4"
        bold = true
        size = 150
    } else if ($.inArray(node.data.name, highlight_teams) != -1) {
        color = "#F66"
        bold = true
        size = 100
    }
    var chkBox = document.getElementById('large_image');
    var offset = 0
    var scale = 1
    if (chkBox.checked){
        offset = display_size/2
        scale = .5
    }
    var vega_node = {'name': node.data.name,
                     'x': (display_size - ring_spacing)*node.y*Math.cos(node.x) * scale + offset,
                     'y': (display_size - ring_spacing)*node.y*Math.sin(node.x) * scale + offset,
                     'leftside': side,
                     'angle': node.x * 57.3,
                     'color': color,
                     'bold': bold,
                     'size': size}
    vega_tree.push(vega_node)

    for(var i in node.children){
        vega_tree = vegafy_root(node.children[i], vega_tree, display_size)
    }

    return vega_tree
}

function update_vega(nodes, links, highlight_links, display_size){
    var spec = "/vega/basketball_tree.json"
    var dimesnion = 0

    var chkBox = document.getElementById('large_image');
    if (chkBox.checked){
        dimension = display_size
        spec = "/vega/basketball_tree_large.json"
    }else{
        var vega_div = document.getElementById('vis');
        var position_info = vega_div.getBoundingClientRect();
        var dimension = position_info.width - 10;
    }

    vega.embed('#vis', spec, {"actions":false, "width": dimension, "height": dimension}).then(function(result){
        var view = result.view;
        view.insert('tree', nodes);
        view.insert('links', links);
        view.insert('highlight_links', highlight_links);
        view.run();
    });
}

