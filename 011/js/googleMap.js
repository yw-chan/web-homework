
var gmap;
var markers = [];

function initMap() {
    //----------------------------------- 
    // 建立 google 的經緯度物件
    //-----------------------------------
    var latlng = new google.maps.LatLng(23.472145, 120.487527);

    //----------------------------------------------------------- 
    // 建立 google 地圖物件選項
    //
    // 支援的地圖類型如下：
    // ROADMAP 顯示 Google 地圖的正常、預設 2D 地圖方塊。
    // SATELLITE 可顯示攝影地圖方塊。
    // HYBRID 可顯示混合攝影地圖方塊與重要地圖項 (道路、城市名稱) 的地圖方塊圖層。
    // TERRAIN 可顯示實際起伏的地圖方塊，以呈現海拔高度和水域圖徵 (山嶽、河流等)。			
    //-----------------------------------------------------------		
    var mapOptions = {
        center: new google.maps.LatLng(23.472145, 120.487527),
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var map_div = document.getElementById("myMap");

    //----------------------------------------------------------- 
    // 建立 google 的地圖物件, 並顯示在指定的 map_div 區域
    //-----------------------------------------------------------		
    gmap = new google.maps.Map(map_div, mapOptions);

    //-------------------------------------------------------------- 
    // Adds a marker to the map and push to the array.
    //--------------------------------------------------------------
    addMarker({ '緯度': 23.472145, '經度': 120.487527, '名稱': "嘉義大學電算中心" });
}

// Adds a marker to the map and push to the array.
function addMarker(data) {
    //-------------------------------------------------------------- 
    // 建立 google 的圖釘物件, 並在先前建立的 google 地圖物件上
    //--------------------------------------------------------------
    var location = new google.maps.LatLng(data['緯度'], data['經度']);
    var marker = new google.maps.Marker({
        title: data['名稱'],
        position: location,
        map: gmap
    });
    var contentString = '<div id="content">' +
        '<div id="siteNotice">' +
        '</div>' +
        '<h4 id="firstHeading" class="firstHeading">' + data['名稱'] +
        '<small>(' + data['緯度'] + ',' + data['經度'] + ')</small>' + '</h4>' +
        '<div id="bodyContent">' +
        '<p><b>分類：</b>' + data['分類'] + '</p>' +
        '<p><b>地址：</b>' + data['地址'] + '</p>' +
        '<p><b>電話：</b>' + data['電話'] + '</p>' +//+ 
        '<p id="detail" style="display: none;"><b>介紹：</b>' +
        '<span>' + data['介紹'] + '<span>' + '</p>' +
        '<a onclick="showHide()">全部</a>' +
        '</div>' +
        '</div>';

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    marker.addListener('click', function () {
        infowindow.open(gmap, marker);
    });
    markers.push(marker);
}

function showHide() {
    $('#detail').toggle();
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
}

// Shows any markers currently in the array.
function showMarkers() {
    setMapOnAll(gmap);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
    clearMarkers();
    markers = [];
}

function newLocation(location) {
    var zoom = gmap.getZoom();
    if (zoom != 15) gmap.setZoom(15);
    gmap.panTo(location);
    //console.log(location, location.lat(), location.lng());
    //gmap.setCenter(location);
}