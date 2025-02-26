//after loaded document
$(document).ready(() => {
  const WEATHER_KEY = process.env.WEATHER_API_KEY;
  mapboxgl.accessToken = process.env.MAPBOX_API_KEY;
  const MAP_BOX = mapboxgl.accessToken;
  let map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v9",
    zoom: 10,
    center: [-98.4916, 29.4252],
  });

  const nav = new mapboxgl.NavigationControl({
    visualizePitch: true,
  });
  map.addControl(nav, "bottom-right");

  //if we need to search a new city, this will allow us to override the current cityf 
  let city = "San Antonio",
    streetName = "600 Navarro ST #350",
    state = "TX",
    zip = "78205",
    address = streetName + " " + city + " " + state + ", " + zip,
    lat = 0,
    long = 0,
    html = "",
    iconUrl = "http://openweathermap.org/img/wn/",
    iconPng = "@2x.png";

  //add stuff to html, this will add all the info into cards via bootstrap
  function appendToHTML(
    myDate,
    date,
    max,
    min,
    describe,
    speed,
    humidity,
    html,
    icon
  ) {
    hideElements();
    switch (myDate.getDay()) {
      case 0:
        myDate = "Sun";
        break;
      case 1:
        myDate = "Mon";
        break;
      case 2:
        myDate = "Tue";
        break;
      case 3:
        myDate = "Wed";
        break;
      case 4:
        myDate = "Thu";
        break;
      case 5:
        myDate = "Fri";
        break;
      default:
        myDate = "Sat";
        break;
    }
    humidity *= 0.1;
    html = `<div class="card">
            <div class="card-header text-white text-center bg-dark">
                ${myDate} <br> ${date}
            </div>
                <div class="list-group-item text-center">Hi:${max} <br> Lo:${min}</div>
                <div class="list-group-item text-center p-3">
                <img src="${
                  iconUrl + icon + iconPng
                }" alt="${describe}"> <br> ${describe}</div>
                <div class="list-group-item text-center">Wind: <br> ${speed} <br> mph </div>
                <div class="list-group-item text-center">Humidity <br> ${humidity.toFixed(
                  1
                )}%</div>
        </div>`;
    $("#forecast").append(html);
  }

  //this function adds a marker
  function addMarker(lat, long, map) {
    let coordinates = [long, lat];
    var marker = new mapboxgl.Marker().setLngLat(coordinates).addTo(map);
    //removes marker on click
    map.on("click", () => {
      marker.remove();
    });
  }
  //website decoration, basically
  function hideElements() {
    $("#nav").removeClass("bg-primary").addClass("bg-dark text-white");
    $("#hidden").addClass("hidden");
    $("button").removeClass("btn-primary").addClass("btn-dark");
  }
  function loading() {
    return `<div class="d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Recieving weather data</span>
            </div>
        </div>`;
  }
  function errorLoad() {
    $("#error").text(
      "We were unable load the current weather at this location, Please Try again later"
    );
    $("#hidden").removeClass("hidden");
  }
  function getWeatherInfo(lat, long) {
    $("#loading").append(loading());

    let api = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${long}&units=imperial&appid=${WEATHER_KEY}`;

    $.get(api)
      .done(function (data) {
        $("#loading").text("");

        $("#forecast").empty(); // Clear previous forecasts

        let processedDates = new Set();
        let forecastDays = 5; // Only collect 5 days
        let daysCollected = 0;

        $.each(data.list, function (index, value) {
            let dateKey = value.dt_txt.split(" ")[0]; // Extract YYYY-MM-DD

            if (!processedDates.has(dateKey) && daysCollected < forecastDays) {
                processedDates.add(dateKey);
                daysCollected++;

                let myDate = new Date(value.dt * 1000);
                let date = `${myDate.getMonth() + 1} / ${myDate.getDate()}`;

                appendToHTML(
                    myDate,
                    date,
                    value.main.temp_max,
                    value.main.temp_min,
                    value.weather[0].description,
                    value.wind.speed,
                    value.main.humidity,
                    html,
                    value.weather[0].icon
                );
            }
        });
      })
      .fail(function () {
        $("#loading").text("");
        errorLoad();
      });
}



  $("#searchAddress").click((e) => {
    e.preventDefault();
    streetName = $("#street").val();
    city = $("#city").val();
    state = $("#state").val();
    zip = $("#zip").val();
    address = streetName + " " + city + " " + state + ", " + zip;
    //get lat and long
    geocode(address, MAP_BOX).then(function (result) {
      //move map to result address
      lat = result[0];
      long = result[1];
      $("#forecast").text("");
      getWeatherInfo(long, lat);
      // Using easeTo options, according to documentation
      map.easeTo({
        center: [lat, long],
        zoom: 15,
        speed: 0.8,
        curve: 1,
        duration: 2000,
        easing(t) {
          return t;
        },
      });
      addMarker(long, lat, map);
    });
  });
  //when we click on map, lets add marker and get long and latitude coords
  map.on("click", (e) => {
    //console.log(typeof (e.lngLat.lat)); //returns number coord
    lat = e.lngLat.lat;
    long = e.lngLat.lng;
    /*            console.log(`long: ${long} lat: ${lat}`);
                    console.log(`long: ${typeof(long)} lat: ${typeof(lat)}`);*/
    addMarker(lat, long, map);
    map.flyTo({
      center: [long, lat],
      zoom: 11,
      speed: 1.8,
      curve: 1,
      easing(t) {
        return t;
      },
    });
    $("#forecast").text("");
    getWeatherInfo(lat, long);
  });
});
