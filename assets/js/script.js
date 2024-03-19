var owmAPI ="8102327b44904a33497207d0e5dc4bf6";
var activeCity = "";
var savedCity = "";

var validateResponse = (response) => {
    if (response.ok) {
        return response;
    } else {
        throw new Error(response.statusText);
    }
}   

var showCurrentWeather = (event) => {
    let city =$('#search-city').val();
    activeCity = $('#search-city').val();
    let queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${owmAPI}`;
    fetch(queryURL)
    .then(validateResponse)
    .then((response) => {
        return response.json();
    })
    .then((response) => {
        saveCityToLocalStorage(city);
        $('#search-error').text("");
        let iconURL ="http://openweathermap.org/img/wn/" + response.weather[0].icon + '.png';
        let utcTime = response.dt;
        let timezoneOffset = response.timezone;
        let currentTimeOffset = timezoneOffset / 60 / 60;
        let timeMoment = moment.unix(utcTime).utc().utcOffset(currentTimeOffset);
        updateCityList();
        fetchFiveDayForecast(event);
        $('#header-text').text(response.name);
        let currentWeatherMarkup = `
        <h3>${response.name} ${timeMoment.format("(MM/DD/YY)")}<img src="${iconURL}"></h3>
        <ul class="list-unstyled">
            <li>Temperature: ${response.main.temp}&#8457;</li>
            <li>Humidity: ${response.main.humidity}%</li>
            <li>Wind Speed: ${response.wind.speed} mph</li>
            <li id="uvIndex">UV Index:</li>
        </ul>`;
    $('#current-weather').html(currentWeatherMarkup);
    let latitude = response.coord.lat;
    let longitude = response.coord.lon;
    let uvQueryURL = "api.openweathermap.org/data/2.5/uvi?lat=" + latitude + "&lon=" + longitude + "&APPID=" + owmAPI;
    uvQueryURL = "https://cors-anywhere.herokuapp.com/" + uvQueryURL;
    fetch(uvQueryURL)
    .then(validateResponse)
    .then((response) => {
        return response.json();
    })
    .then((response) => {
        let uvIndex = response.value;
        $('#uvIndex').html(`UV Index: <span id="uvVal"> ${uvIndex}</span>`);
        if (uvIndex>=0 && uvIndex<3){
            $('#uvVal').attr("class", "uv-favorable");
        } else if (uvIndex>=3 && uvIndex<8){
            $('#uvVal').attr("class", "uv-moderate");
        } else if (uvIndex>=8){
            $('#uvVal').attr("class", "uv-severe");
        }
    });
})
}

var fetchFiveDayForecast = (event) => {
    let city = $('#search-city').val();
    let queryURL = "https://api.openweathermap.org/data/2.5/forecast?q=" + city + "&units=imperial" + "&APPID=" + owmAPI;
// Fetch from API
   fetch(queryURL)
    .then (validateResponse)
    .then((response) => {
        return response.json();
    })
    .then((response) => {
    let fiveDayForecastHTML = `
    <h2>5-Day Forecast:</h2>
    <div id="fiveDayForecastUl" class="d-inline-flex flex-wrap">`;
    // Loop over the 5 day forecast and build the template HTML using UTC offset and Open Weather Map icon
    for (let i = 0; i < response.list.length; i++) {
        let dayData = response.list[i];
        let dayTimeUTC = dayData.dt;
        let timeZoneOffset = response.city.timezone;
        let timeZoneOffsetHours = timeZoneOffset / 60 / 60;
        let thisMoment = moment.unix(dayTimeUTC).utc().utcOffset(timeZoneOffsetHours);
        let iconURL = "https://openweathermap.org/img/w/" + dayData.weather[0].icon + ".png";
        // Only displaying mid-day forecasts
        if (thisMoment.format("HH:mm:ss") === "11:00:00" || thisMoment.format("HH:mm:ss") === "12:00:00" || thisMoment.format("HH:mm:ss") === "13:00:00") {
            fiveDayForecastHTML += `
            <div class="weather-card card m-2 p0">
                <ul class="list-unstyled p-3">
                    <li>${thisMoment.format("MM/DD/YY")}</li>
                    <li class="weather-icon"><img src="${iconURL}"></li>
                    <li>Temp: ${dayData.main.temp}&#8457;</li>
                    <br>
                    <li>Humidity: ${dayData.main.humidity}%</li>
                </ul>
            </div>`;
        }
    }
    // Build the HTML template
    fiveDayForecastHTML += `</div>`;
    // Append the five-day forecast to the DOM
    $('#five-day-forecast').html(fiveDayForecastHTML);
  })
}

// Function to save the city to localStorage
var saveCityToLocalStorage = (newCity) => {
let cityExists = false;
// Check if City exists in local storage
for (let i = 0; i < localStorage.length; i++) {
    if (localStorage["cities" + i] === newCity) {
        cityExists = true;
        break;
    }
}
// Save to localStorage if city is new
if (cityExists === false) {
    localStorage.setItem('cities' + localStorage.length, newCity);
}
}

// Render the list of searched cities
var updateCityList = () => {
$('#city-results').empty();
// If localStorage is empty
if (localStorage.length===0){
    if (savedCity){
        $('#search-city').attr("value", savedCity);
    } else {
        $('#search-city').attr("value", "Austin");
    }
} else {
    // Build key of last city written to localStorage
    let lastCityKey="cities"+(localStorage.length-1);
    savedCity=localStorage.getItem(lastCityKey);
    // Set search input to last city searched
    $('#search-city').attr("value", savedCity);
    // Append stored cities to page
    for (let i = 0; i < localStorage.length; i++) {
        let city = localStorage.getItem("cities" + i);
        let cityEl;
        // Set to lastCity if currentCity not set
        if (activeCity===""){
            activeCity=savedCity;
        }
        // Set button class to active for currentCity
        if (city === activeCity) {
            cityEl = `<button type="button" class="list-group-item list-group-item-action active">${city}</button></li>`;
        } else {
            cityEl = `<button type="button" class="list-group-item list-group-item-action">${city}</button></li>`;
        } 
        // Append city to page
        $('#city-results').prepend(cityEl);
    }
    // Add a "clear" button to page if there is a cities list
    if (localStorage.length>0){
        $('#clear-storage').html($('<a id="clear-storage" href="#">clear</a>'));
    } else {
        $('#clear-storage').html('');
    }
}

}

// New city search button event listener
$('#search-button').on("click", (event) => {
event.preventDefault();
activeCity = $('#search-city').val();
showCurrentWeather(event);
});

// Old searched cities buttons event listener
$('#city-results').on("click", (event) => {
event.preventDefault();
$('#search-city').val(event.target.textContent);
activeCity=$('#search-city').val();
showCurrentWeather(event);
});

// Clear old searched cities from localStorage event listener
$("#clear-storage").on("click", (event) => {
localStorage.clear();
updateCityList();
});

// Render the searched cities
updateCityList();

// Get the current conditions (which also calls the five day forecast)
showCurrentWeather();
