$(document).on("ready", function () {
    readTextFile('./poi.csv', successReadFile);
    setupClick();
});

var position;
var desPos = {lat: 23.472145, lng: 120.487527};

function successReadFile(response) {
    //console.log(response);
    // var position = $.csv.toObjects('"foo, the column",bar\n2,3\n"4, the value",5');
    position = $.csv.toObjects(response);
    //console.log(position);
    buildHtmlTable(position, '#myTable');
    // var myPosition = position;
    // for (var i = 0; i < myPosition.length; i++) {
    //     addMarker(myPosition[i]);
    // }
}

function tableFilter() {
    var input, filter;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    buildHtmlTable(position.filter(function (item, index, array) {
        //console.log(item);
        return item["名稱"].indexOf(filter) != -1 || item["分類"].indexOf(filter) != -1;

    }), '#myTable');
}

//-------------------------------------------------------------
//  設定所有cell均接收click事件
//-------------------------------------------------------------			
function setupClick() {
    $('td').click(function () {
        // var tabName = $(this).closest('table').attr('id');
        var row_index = $(this).parent().index();
        // var col_index = $(this).index();
        // var data = $(this).parent();
        var data = position[row_index];
        //console.log('click', row_index, data);

        desPos = new google.maps.LatLng(data['緯度'], data['經度']);
        newLocation(desPos);
        deleteMarkers();
        addMarker(data);
    });
}

// Builds the HTML Table out of myList.
function buildHtmlTable(myList, selector) {
    $(selector).empty();
    var columns = addAllColumnHeaders(myList, selector);

    for (var i = 0; i < myList.length; i++) {
        var row$ = $('<tr/>');
        for (var colIndex = 0; colIndex < columns.length; colIndex++) {
            var cellValue = myList[i][columns[colIndex]];
            if (cellValue == null) cellValue = "";
            if (cellValue.length > 70) {
                cellValue = cellValue.substring(0, 70) + '...';
            }
            row$.append($('<td/>').html(cellValue));
        }
        $(selector).append(row$);
    }
    setupClick();
}

// Adds a header row to the table and returns the set of columns.
// Need to do union of keys from all records as some records may not contain
// all records.
function addAllColumnHeaders(myList, selector) {
    var columnSet = [];
    var headerTr$ = $('<thead/>');

    for (var i = 0; i < myList.length; i++) {
        var rowHash = myList[i];
        for (var key in rowHash) {
            if ($.inArray(key, columnSet) == -1) {
                columnSet.push(key);
                headerTr$.append($('<th/>').html(key));
            }
        }
    }
    $(selector).append(headerTr$);

    return columnSet;
}

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                //var allText = rawFile.responseText;
                //alert(allText);
                callback(rawFile.responseText);
            }
        }
    }
    rawFile.send(null);
}

function howto() {
    var myPos = {};
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            myPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            //console.log(myPos, desPos);
            if(desPos == null)return;
            calculateAndDisplayRoute(myPos, desPos);
            /*var marker = new google.maps.Marker({
                position: pos,
                map: gmap
            });
            //gmap.setZoom(17);
            gmap.panTo(pos);*/
        });
    } else {
        // Browser doesn't support Geolocation
        alert("未允許或遭遇錯誤！");
    }
}