/**
 * Created by Lipman on 7/30/15.
 */

landmarks = 0;
measures = 0;


$.urlParam = function (name) {
    var results = new RegExp('\#(.*)').exec(window.location.href);
    if (results == null) {
        return null;
    }
    else {
        return results[1] || 0;
    }
};

setUpPage = function(){
    console.log($.urlParam('shortname'));
    if ($.urlParam('shortname') == null){
        window.location.hash = 'maxcranwidth';
    }
    loadJsonDocs(); //also set up nav bar and fill in little text things and draw face
    drawGraphs();
};

$(document).ready(function () {
    setUpPage();

});

var loadJsonDocs = function () {
    $.getJSON('../tdfn_landmarks.JSON', function (data) {
        landmarks = data;
        $.getJSON('../tdfn_measures.JSON', function (data) {
            measures = data["facial-measures"];
            setUpNav();
            thisLandmarks = displayLandMarks($.urlParam('shortname'), measures, landmarks);
            displayDescription($.urlParam('shortname'), measures, landmarks);
            displayMethod($.urlParam('shortname'), measures, landmarks);
            displayHead($.urlParam('shortname'), measures, landmarks);
        });
    });


};
setUpNav = function () {
    var items = [];
    items.push("<h4>Caliper Facial Measures</h4>");

    first_one = false;
    $.each(measures, function (object) {
        if (measures[object]['shortname'] == 'cranbasewidth'){
            items.push("<h4>3D Facial Measures</h4>");
        }
        items.push("<li><a onclick='setUpPage()' href='#" + measures[object]['shortname'] + "'>" + measures[object]['name'] + "</a></li>");
    });

    $('#navElements').html(items.join(""));
};

displayLandMarks = function (shortname, measures, landmarks) {
    var items = [];
    var thisLandmarks;
    $.each(measures, function (object) {
        if (measures[object]['shortname'] == shortname) {
            $('#measure').text(measures[object]['name']);
            thisLandmarks = measures[object]['landmarks'];

            $.each(landmarks, function (object) {

                if ($.inArray(landmarks[object]['id'], thisLandmarks) != -1) {
                    items.push("<li><strong>" + landmarks[object]['name'] + ":</strong> " + landmarks[object]['description'] + "</li>");
                }

            });
        }

    });

    $('#landMarks').html(items.join(""));

    return thisLandmarks;
};

displayDescription = function (shortname, measures, landmarks) {
    $.each(measures, function (object) {
        if (measures[object]['shortname'] == shortname) {
            $("#measurementDescription").text(measures[object]['measurement_description']);
        }
    });

};

displayMethod = function (shortname, measures, landmarks) {
    $.each(measures, function (object) {
        if (measures[object]['shortname'] == shortname) {
            $("#measurementMethod").text(measures[object]['measurement_method']);
        }
    });

};

displayHead = function (shortname, measures, landmarks) {
    $.each(measures, function (object) {
        if (measures[object]['shortname'] == shortname) {
            thisLandmarks = measures[object]['landmarks'];
            view = measures[object]['view_orientation'];
            console.log(view);

            if (view == 'frontal') {
                $('#faceWrapper').attr("style", "width: 200px; height: 264px; padding: 0px; position: relative; background-image: url(../images/face-" + view + ".jpg); background-size: contain");
                $('#faceWrapper').html('<canvas class="base" width="200" height="264"></canvas><canvas class="overlay" width="200" height="264" style="position: absolute; left: 0px; top: 0px;"></canvas>');
            } else if (view.indexOf("oblique") != -1) {
                $('#faceWrapper').attr("style", "width: 200px; height: 247px; padding: 0px; position: relative; background-image: url(../images/face-" + view + ".jpg); background-size: contain");
                $('#faceWrapper').html('<canvas class="base" width="200" height="247"></canvas><canvas class="overlay" width="200" height="247" style="position: absolute; left: 0px; top: 0px;"></canvas>');
            } else {
                $('#faceWrapper').attr("style", "width: 200px; height: 228px; padding: 0px; position: relative; background-image: url(../images/face-" + view + ".jpg); background-size: contain");
                $('#faceWrapper').html('<canvas class="base" width="200" height="228"></canvas><canvas class="overlay" width="200" height="228" style="position: absolute; left: 0px; top: 0px;"></canvas>');
            }


            points = [];
            var f = 0;
            $.each(landmarks, function (object) {
                if ($.inArray(landmarks[object]['id'], thisLandmarks) != -1) {
                    points.push([landmarks[object][view]['x'], landmarks[object][view]['y']])
                }
            });
            console.log(points);
            var dataset = [{
                data: points,
                points: {show: true, radius: 3, lineWidth: 0, fill: true, fillColor: '#00a'},
                lines: {show: true},
                color: '#00a'
            }];

            if (view == 'frontal') {
                var xmax = 560;
                var ymax = 740;
            } else if (view.indexOf("oblique") != -1) {
                var xmax = 600;
                var ymax = 740;
            } else {
                var xmax = 650;
                var ymax = 740;
            }


            $.plot($('#faceWrapper'), dataset, {
                xaxis: {show: false, min: 0, max: xmax},
                yaxis: {show: false, min: 0, max: ymax},
                series: {show: false},
                grid: {show: false}
            });


        }
    });

};

drawGraphs = function () {
    $.ajax({
        type: "GET",
        url: "../tdfn_gui_summary.csv",
        dataType: "text",
        success: function (data) {
            graphData = proccessCSV(data);
            drawEachGraph(graphData);

            drawTables(graphData);
        }
    });
};

drawEachGraph = function (data) {

    function generateData(gender) {
        var means = [];
        var sd = [];

        data.sort(function (a, b) {
            return [a][0][2] - [b][0][2]
        });

        for (line in data) {
            if (data[line][4] == gender && $.urlParam('shortname') == data[line][1]) {
                means.push([parseInt(data[line][2]), parseInt(data[line][6])]);
                sd.push(parseFloat(data[line][7]));
            }
        }


        var logfit = regression('logarithmic', means);


        var sdSup = [];

        for (var i = 0; i < logfit.points.length; i++) {
            sdSup[i] = [logfit.points[i][0], logfit.points[i][1] + sd[i]];
        }

        sdSup = regression('logarithmic', sdSup).points;

        var sdInf = [];

        for (var i = 0; i < logfit.points.length; i++) {
            sdInf[i] = [logfit.points[i][0], logfit.points[i][1] - sd[i]];
        }

        sdInf = regression('logarithmic', sdInf).points;

        var sd2Sup = [];

        for (var i = 0; i < logfit.points.length; i++) {
            sd2Sup[i] = [logfit.points[i][0], logfit.points[i][1] + (2 * sd[i])];
        }

        sd2Sup = regression('logarithmic', sd2Sup).points;


        var sd2Inf = [];

        for (var i = 0; i < logfit.points.length; i++) {
            sd2Inf[i] = [logfit.points[i][0], logfit.points[i][1] - (2 * sd[i])];
        }

        sd2Inf = regression('logarithmic', sd2Inf).points;


        var to_graph_data = {
            means: means,
            logfit: logfit.points,
            sdSup: sdSup,
            sdInf: sdInf,
            sd2Sup: sd2Sup,
            sd2Inf: sd2Inf
        };
        return to_graph_data;
    }


    var male_data = generateData(1);
    var female_data = generateData(2);
    var combined_data = generateData(3);


    function plotDataSet(d) {
        var dataset = [
            {id: 'sdSup', data: d.sdSup, lines: {show: true, lineWidth: 0, fill: false}, color: '#999'},
            {
                id: 'sdInf',
                data: d.sdInf,
                lines: {show: true, lineWidth: 0, fill: 0.2},
                color: '#999',
                fillBetween: 'sdSup'
            },
            {id: 'sd2Inf', data: d.sd2Inf, lines: {show: true, lineWidth: 0, fill: false}, color: '#999'},
            {
                id: 'sd2Sup',
                data: d.sd2Sup,
                lines: {show: true, lineWidth: 0, fill: 0.2},
                color: '#999',
                fillBetween: 'sd2Inf'
            },

            {
                data: d.means,
                points: {show: true, radius: 1, lineWidth: 0, fill: true, fillColor: '#666'},
                color: '#666'
            },
            {data: d.logfit, lines: {show: true, lineWidth: 2}, color: '#00a'}
        ];
        return dataset;
    };
    var plotOptions = {
        xaxis: {
            tickDecimals: 0, tickFormatter: function (v) {
                return v + 'yr';
            }, ticks: 10
        },
        yaxis: {
            tickFormatter: function (v) {
                return v + 'mm';
            }, ticks: 8
        },
        legend: {},
        series: {fillBetween: true}
    };
    $.plot($('#male_graph'), plotDataSet(male_data), plotOptions);
    $.plot($('#female_graph'), plotDataSet(female_data), plotOptions);
    $.plot($('#combined_graph'), plotDataSet(combined_data), plotOptions);


};

proccessCSV = function (text) {
    var temp = [];
    lines = text.split('\n');
    for (singleLine in lines) {
        tempLine = [];
        line = lines[singleLine].split(',');
        temp.push(line);
    }

    return temp;
};

drawTables = function(data){
    var age_map = {31: "31-32", 33: "33-34", 35: "35-36", 37: "37-38", 39: "39-40"}

    function map_age(age){
        if (age in age_map){ return age_map[age]}
        return age;
    }

    function generateData(gender) {
        table = [];
        data.sort(function (a, b) {
            return [a][0][2] - [b][0][2]
        });

        for (line in data) {
            if (data[line][4] == gender && $.urlParam('shortname') == data[line][1]) {
                table.push('<tr><td>'+ map_age(data[line][2]) +'</td><td>'+ data[line][5] +'</td><td style="text-align: right;">'+ data[line][6] +'</td><td style="text-align: right;">'+ data[line][7] +'</td> </tr>');
            }
        }
        return table
    }
    var male_data = generateData(1);
    $('#male_table').html(male_data);

    var female_data = generateData(2);
    $('#female_table').html(female_data);

    var combined_data = generateData(3);
    $('#combined_table').html(combined_data);

    //$.each(measures, function (object) {
        //items.push("<li><a href='?shortname=" + measures[object]['shortname'] + "'>" + measures[object]['name'] + "</a></li>");
    //});
    //<tr><td>3</td><td>11</td><td style="text-align: right;">9.41</td><td style="text-align: right;">1.04</td> </tr>
};
function get_sex_string(sex){
    if (sex == 1) {
        return "male";
    } else if (sex == 2){
        return "female";
    }
    return "both";
}
downloadData = function(){
    $.ajax({
        type: "GET",
        url: "../tdfn_gui_summary.csv",
        dataType: "text",
        success: function (data) {
            data = proccessCSV(data);

            data.sort(function (a, b) {
                return [a][0][2] - [b][0][2]
            });
            

            table = 'sex, age, n, mean, s.d.\n';
            for (line in data) {
                if ($.urlParam('shortname') == data[line][1]) {
                    table += (get_sex_string(data[line][4]) + ',' + data[line][2] +', '+ data[line][5] +', '+ data[line][6] +', '+ data[line][7].trim() +'\n');
                }
            }

            var blob = new Blob([table], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "facial_normative_data.csv");

        }
    });


};
