/* Map Settings */
// Tile layers
var Esri_WorldImagery = L.tileLayer.provider('Esri.WorldImagery'),
Esri_WorldPhysical = L.tileLayer.provider('Esri.WorldPhysical'),
Voyager_StreetMap = L.tileLayer.provider('CartoDB.VoyagerNoLabels'),
Stamen_Labels = L.tileLayer.provider('Stamen.TonerHybrid'),
WaymarkedTrails_hiking = L.tileLayer.provider('WaymarkedTrails.hiking'),
WaymarkedTrails_cycling = L.tileLayer.provider('WaymarkedTrails.cycling'),
OpenWeatherMap_Clouds = L.tileLayer.provider('OpenWeatherMap.Clouds', {
    apiKey: '576f8cb6f5df3e34ed002ec22b7d0bbd'
}),
OpenWeatherMap_Pressure = L.tileLayer.provider('OpenWeatherMap.Pressure', {
    apiKey: '576f8cb6f5df3e34ed002ec22b7d0bbd'
}),
OpenWeatherMap_Wind = L.tileLayer.provider('OpenWeatherMap.Wind', {
    apiKey: '576f8cb6f5df3e34ed002ec22b7d0bbd'
});
DataMarkers = L.layerGroup([]);

// Initialise map
var map = L.map('map', {
	center: [0, 0],
	zoom: 2,
	layers: [Esri_WorldImagery, DataMarkers]
});

// Map tile layer control
var baseLayers = {
	"Satellite": Esri_WorldImagery,
	"Terrain" : Esri_WorldPhysical, 
	"Roads": Voyager_StreetMap
}
var overlays = {
	"Map Labels": Stamen_Labels,
	"Hiking trails": WaymarkedTrails_hiking, 
	"Cycle trails": WaymarkedTrails_cycling,
	"Markers": DataMarkers,
	"Clouds": OpenWeatherMap_Clouds,
	"Pressure": OpenWeatherMap_Pressure,
	"Wind": OpenWeatherMap_Wind 
}
L.control.layers(baseLayers, overlays).addTo(map);

// Select random country button
var randomButton = L.easyButton('fas fa-random fa-lg', function(_btn, _map){
	const select  = document.getElementById('country-dropdown');
	const options = select.children;  
	const random  = Math.floor(Math.random() * options.length);
	select.value = options[random].value;
	
	formData.country = $('#country-dropdown option:selected').text();
	formData.iso_a2 = $('#country-dropdown').val();
	formData.geoLocate = null;
	getGeoJSON(formData);
	getCountryData(formData);
	setNull(formData); 
}, 'Random country').addTo(map);

// Country data display buttons
var infoButton = L.easyButton('fas fa-info fa-lg', function(_btn, _map){
	$("#myTab").children().children().removeClass("active");
	$("#info-tab").addClass("active");
	$("#myTabContent").children().removeClass("active show");
	$("#info").addClass("active show");
	showData();
}, 'Info'),
weatherButton = L.easyButton('fas fa-cloud-sun-rain fa-lg', function(_btn, _map){
	$("#myTab").children().children().removeClass("active");
	$("#weather-tab").addClass("active");
	$("#myTabContent").children().removeClass("active show");
	$("#weather").addClass("active show");
	showData();
}, 'Weather'),
exchangeButton = L.easyButton('fas fa-coins fa-lg', function(_btn, _map){
	$("#myTab").children().children().removeClass("active");
	$("#exchange-tab").addClass("active");
	$("#myTabContent").children().removeClass("active show");
	$("#exchange").addClass("active show");
	showData();
}, 'Exchange');

L.easyBar([infoButton, weatherButton, exchangeButton]).addTo(map);

var disasterButton = L.easyButton({
	states: [{
		stateName: 'get-disasters',
		icon: 'fas fa-exclamation-circle fa-lg',
		title: 'Current disasters', 
		onClick: function(btn, map){
			btn.button.style.backgroundColor = 'black';
			btn.button.style.color = 'white';
			$.ajax({
				url: 'php/getWorldDisasters.php',
				type: 'GET',
				dataType: 'JSON',
				error: (jqXHR, _textStatus, errorThrown) => {
					btn.button.style.backgroundColor = 'white';
					btn.button.style.color = 'black';
					console.warn(jqXHR.responseText);
					console.log(errorThrown);
					map.spin(false);
				},
				success: (result) => {
					DataMarkers.addLayer(disasterMarkers);
					result.disasters.forEach(disaster => {
						countries = disaster.fields.affected_countries; 
						longitude = disaster.fields.primary_country.location.lon;
						latitude = disaster.fields.primary_country.location.lat;
						var popup = L.responsivePopup().setContent(
							`<div class="d-flex flex-column">
									<div class="d-flex justify-content-between">
										<h2>${disaster.fields.name}</h2>
									</div>
									<hr class="m-0 mb-2">
									<div class="d-flex justify-content-between">
										<h3 class="fs-6 m-0">Date created:</h3>
										<span class="fs-6">${disaster.fields.date}<span>									
									</div>
									<div class="d-flex justify-content-between">
										<h3 class="fs-6 m-0">Disater type:</h3>
										<span class="fs-6">${disaster.fields.primary_type.name}<span>									
									</div>
									<div class="d-flex flex-column">
										<h3 class="fs-6 m-0">Affected countries:</h3>
										<span class="fs-6 text-right">${disaster.fields.affected_countries}</span>
									</div>
									<div class="d-flex flex-column">
										<h3 class="fs-6 mb-1">Summary:</h3>
										${disaster.fields['description-html']}(...)
									</div>
									<div class="d-flex justify-content-center mt-2">
										<a class="btn btn-sm" id="wikiLink" href="${disaster.fields.url}" target="_blank" rel="noreferrer" role="button">Go to report</a>
									</div>`
						);
						L.marker([latitude, longitude], {icon: disasterIcon}).addTo(disasterMarkers)
						.bindPopup(popup, popupOptions);
					});
					map.spin(false);
					map.fitBounds(disasterMarkers.getBounds());
					btn.state('hide-disasters');
				}
			});
		}
	}, {
		stateName: 'hide-disasters',
		icon: 'fas fa-exclamation-circle fa-lg',
		title: 'Hide disasters',
		onClick: function(btn, _map){
			btn.button.style.backgroundColor = 'white';
			btn.button.style.color = 'black';
			DataMarkers.removeLayer(disasterMarkers);
			btn.state('show-disasters');
		}
	}, {
		stateName: 'show-disasters',
		icon: 'fas fa-exclamation-circle fa-lg',
		title: 'Current disasters', 
		onClick: function(btn, map){
			btn.button.style.backgroundColor = 'black';
			btn.button.style.color = 'white';
			DataMarkers.addLayer(disasterMarkers);
			btn.state('hide-disasters');
			map.fitBounds(disasterMarkers.getBounds());
		}
	}]			
});	
				
disasterButton.addTo(map);

var cityMarkers = L.markerClusterGroup();
var oceanMarkers = L.markerClusterGroup();
var disasterMarkers = L.markerClusterGroup();
DataMarkers.addLayer(cityMarkers, oceanMarkers);

// Create custom Icons
var userIcon = L.ExtraMarkers.icon({
	icon: 'fa-crosshairs',
	markerColor: 'green',
	shape: 'circle',
	prefix: 'fas'
}),
capitalIcon = L.ExtraMarkers.icon({
	icon: 'fa-city',
	markerColor: 'violet',
	shape: 'star',
	prefix: 'fas'
}),
cityIcon = L.ExtraMarkers.icon({
	icon: 'fa-city',
	markerColor: 'yellow',
	shape: 'circle',
	prefix: 'fas'
}),
oceanIcon = L.ExtraMarkers.icon({
	icon: 'fa-water',
	markerColor: 'cyan',
	shape: 'circle',
	prefix: 'fas',
}),
disasterIcon = L.ExtraMarkers.icon({
	icon: 'fa-exclamation-circle',
	markerColor: 'red',
	shape: 'square',
	prefix: 'fas'
});

const popupOptions = {
	maxWidth: 250,
	className: 'customPopup'
}

// GeoJSON variables
const geoJsonStyle = {
	"color": "#d7ceb2",
	"opacity": 0.8,
	"weight": 2,
	"dashArray": '',
	"fillOpacity": 0.1
}
let geoJsonLayer = [];

/* Input variables */
// Populate country <select>
$.ajax({
	url: 'php/getCountryList.php',
	type: 'GET',
	dataType: 'JSON',
	error: (jqXHR, _textStatus, errorThrown) => {
		console.warn(jqXHR.responseText);
		console.log(errorThrown);
	},
	success: (result) => {
		const countryDropdown = $('#country-dropdown');
		countryDropdown.empty();
		countryDropdown.append('<option selected="true" disabled>Choose a Country</option>');
		countryDropdown.prop('selectedIndex', 0);
		result['data'].forEach(country => {
			countryDropdown.append(`<option value=${country['code']}>${country['name']}</option>`);
		});
	}
});

// Populate currency <select> options
$.ajax({
	url: 'php/getCurrencyList.php',
	type: 'GET',
	dataType: 'JSON',
	error: (jqXHR, _textStatus, errorThrown) => {
		console.warn(jqXHR.responseText);
		console.log(errorThrown);
	},
	success: (result) => {
		const currencyDropdown = $('.currency-dropdown');
		currencyDropdown.empty();
		currencyDropdown.append('<option selected="true" disabled>Choose Currency</option>');
		currencyDropdown.prop('selectedIndex', 0);
		result['data'].forEach(currency => {
			currencyDropdown.append(`<option value=${currency.cc}>${currency.name} (${currency.symbol})</option>`);
		});
	}
});

// Dynamic Weather Headers
var date = new Date();
$('#thirdDay').html(addDays(date, 2));
$('#fourthDay').html(addDays(date, 3));

// Query object
var formData = {
	'iso_a2': null,
	'country': null,
	'lat': null,
	'lng': null,
	'geoLocate': null,
	'dragged': null,
}

/* Functions */
//Remove loader
function removeLoad() {
	if ($("#preloader:hidden").length == 0) {
		$("#preloader").attr("style", "display: none !important");
	}
}

// Get user location 
function getPosition() {
	return new Promise((res, rej) => {
		navigator.geolocation.getCurrentPosition(res, rej);
	});
}
function getLocation() {
		getPosition().then((res) => {
		formData.lat = res.coords.latitude;
		formData.lng = res.coords.longitude;
		formData.geoLocate = true;
		var popup = L.responsivePopup().setContent(
			`<div class="d-flex flex-column">
					<div class="d-flex justify-content-between">
						<h2>Your Location</h2>
					</div>
				</div>`
		);
		L.marker([formData.lat, formData.lng], {icon: userIcon}).addTo(DataMarkers)
			.bindPopup(popup, popupOptions);
		getCountryCode(formData);
		setNull(formData);
	}).catch((err) => {
		console.error(err.message);
		map.spin(false);
		removeLoad();
	});
}

function getCountryCode(formData) {
	$.ajax({
		url: "php/getCountryCode.php",
		type: 'GET',
		dataType: 'json',
		data: formData,
		error: (jqXHR, _textStatus, errorThrown) => {
			console.warn(jqXHR.responseText);
			console.log(errorThrown);
			map.spin(false);
			removeLoad();
		},
		success: (result) => {
			if (result.status.name == "ok") {
				countryCode = result.countryCode;
				requestObj = result.request;
				if (!countryCode) {
					formData.lat = requestObj.latitude;
					formData.lng = requestObj.longitude;
					getOceanData(formData);
				} else {
					formData.iso_a2 = countryCode.countryCode;
					formData.country = countryCode.countryName;
					formData.geoLocate = requestObj.geoLocate;
					getGeoJSON(formData);
					getCountryData(formData);
				}
			}
		}
	});
}

// Get Ocean data
function getOceanData(formData) {
	$.ajax({
		url: "php/getOcean.php",
		type: 'GET',
		dataType: 'json',
		data: formData,
		error: (jqXHR, _textStatus, errorThrown) => {
			console.warn(jqXHR.responseText);
			console.log(errorThrown);
			map.spin(false); 
			removeLoad();
		},
		success: (result) => {
			if (result.status.name == "ok") {
				map.spin(false);
				removeLoad();
				if (!result.request.dragged) {
					DataMarkers.removeLayer(oceanMarkers);
					oceanMarkers = L.markerClusterGroup();
					DataMarkers.addLayer(oceanMarkers);
					var popup = L.responsivePopup().setContent(
            `<div class="d-flex flex-column">
								<div class="d-flex justify-content-between">
									<h2>${result.ocean.asciiName}</h2>
								</div>
								<hr class="m-0 mb-2">
								<div class="d-flex justify-content-center mt-2">
									<a class="btn btn-sm" id="wikiLink" href="https://${result.ocean.wikipediaURL}" target="_blank" rel="noreferrer" role="button">Go to wiki</a>
								</div>
							</div>`
					);
					oceanMarker = L.marker([formData.lat, formData.lng], {
						icon: oceanIcon,
						draggable: 'true', 
						autoPan: 'true'}).addTo(oceanMarkers)
						.bindPopup(popup, popupOptions).openPopup();
					
					oceanMarker.on('dragend', function (e) {
						formData.lat = oceanMarker.getLatLng().lat;
						formData.lng = oceanMarker.getLatLng().lng;
						formData.dragged = "true";
						getOceanData(formData);
						setNull(formData);
					});   
				} else {
					var popup = L.responsivePopup().setContent(
						`<div class="d-flex flex-column">
								<div class="d-flex justify-content-between">
									<h2>${result.ocean.asciiName}</h2>
								</div>
								<hr class="m-0 mb-2">
								<div class="d-flex justify-content-center mt-2">
									<a class="btn btn-sm" id="wikiLink" href="https://${result.ocean.wikipediaURL}" target="_blank" rel="noreferrer" role="button">Go to wiki</a>
								</div>
							</div>`
					);
					oceanMarker.bindPopup(popup, popupOptions).openPopup();
				}
			}
		}
	});
}

// Get country border
function getGeoJSON(formData) {
	$.ajax({
		url: "php/getCountryBorder.php",
		type: 'GET',
		dataType: 'json',
		data: formData,
		error: (jqXHR, _textStatus, errorThrown) => {
			console.warn(jqXHR.responseText);
			console.log(errorThrown);
			map.spin(false);
			removeLoad();
		},
		success: (result) => {
			if (result.status.name == "ok") {
				if(geoJsonLayer){
					map.removeLayer(geoJsonLayer);
				}
				geoJsonLayer = L.geoJson(result['geoJson'], {
					style: geoJsonStyle
				}).addTo(map);
				map.fitBounds(geoJsonLayer.getBounds());
			}
		}
	});
}

// Get country data
function getCountryData(formData) {
	$.ajax({
		url: "php/getCountry.php",
		type: 'GET',
		dataType: 'json',
		data: formData,
		error: (jqXHR, _textStatus, errorThrown) => {
			console.warn(jqXHR.responseText);
			console.log(errorThrown);
			map.spin(false);
			removeLoad();
		},
		success: (result) => {
			if (result.status.name == "ok") {
				const countryData = result.countryData;
				$('#country-dropdown').val(countryData['countryCode']);

				// Country Information
				$('#country-name').html(`${countryData['countryName']}, ${countryData['countryCode']}`);
				$('.capital').html(countryData['capital']);
				$('#population').html(numberWithCommas(countryData['population']));
				$('#area').html(numberWithCommas(countryData['areaInSqKm']));
				$('#countrySummary').html(countryData['wikiSummary']);
				$('#wikiLink').attr("href", "https://" + countryData['wikipediaUrl']);
				$('.flag').attr({
					src: countryData.flag,
					alt: `The national flag of ${countryData['countryName']}`
				});
				$('#region').html(countryData.region);
				$('#subregion').html(countryData.subregion);
				$('#language').html(countryData.language);
				$('#currencyName').html(countryData.currencyName);
				$('#currencySymbol').html(`(${countryData.currencySymbol})`);

				// Update currency dropdown selection
				if (typeof countryData.currencyCode !== "undefined") {
					if (result.request.geoLocate) {
						$('#fromCurrency').val(countryData.currencyCode);
					} else {
						$('#toCurrency').val(countryData.currencyCode);
						$('#exchangeResult').html("");
					}
				} else {
					const currencyDropdown = $('.currency-dropdown');
					currencyDropdown.prop('selectedIndex', 0);
				}

				// Open Weather Data
				var openWeather = result.openWeather;
				for (let i = 0; i < 4; i++) {
					tempMax = kelvinToCelsius(openWeather[i].temp.max);
					tempMin = kelvinToCelsius(openWeather[i].temp.min);
					windSpeed = openWeather[i].wind_speed;
					windDirection = openWeather[i].wind_deg;
					weatherIcon = openWeather[i].weather[0].icon;
					weatherDescription = openWeather[i].weather[0].description;
					$('#day'+(i+1)).children().eq(1).children().eq(0).attr('src', `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`);
					$('#day'+(i+1)).children().eq(1).children().eq(1).html(
					 `<div class="d-flex justify-content-between">
              <h3 class="fs-6 m-0">High:</h3><span>${String(tempMax)+"℃"}</span>
            </div>
            <div class="d-flex justify-content-between">
              <h3 class="fs-6 m-0">Low:</h3><span>${String(tempMin)+"℃"}</span>
            </div>
						<div class="d-flex justify-content-between">
              <h3 class="fs-6 m-0">Wind:</h3><span>${windSpeed}m/s, <i class="fas fa-arrow-up" style="-webkit-transform:rotate(${windDirection}deg); transform:rotate(${windDirection}deg);"></i></i></span>
            </div>
						<div class="d-flex justify-content-between">
              <h3 class="fs-6 m-0">Weather:</h3><span>${weatherDescription}</span>
            </div>`
					);
				}

				// Remove Loader
				map.spin(false);
				removeLoad();
				showData();
				getCities(countryData['countryCode'], countryData['capital']);
			}
		}
	});
}

// Show offcanvas element
function showData() {
	const offCanvasBottom = document.getElementById("offcanvasBottom");
	const dataOffCanvas = new bootstrap.Offcanvas(offCanvasBottom);
	dataOffCanvas.show();
}

//Get cities within country
function getCities(countryCode, capital){
	formData.iso_a2 = countryCode;
	$.ajax({
		url: "php/getCities.php",
		type: 'GET',
		dataType: 'json',
		data: formData,
		error: (jqXHR, _textStatus, errorThrown) => {
			console.warn(jqXHR.responseText);
			console.log(errorThrown);
			map.spin(false);
			removeLoad();
		},
		success: (result) => {
			DataMarkers.removeLayer(cityMarkers);
			console.log(result);
			// Geonames Cities Data
			cityMarkers = L.markerClusterGroup();
			DataMarkers.addLayer(cityMarkers);
			result.data.forEach(item => {
				if (capital == item.city) {
					L.marker([item.latitude, item.longitude], {icon: capitalIcon})
					.on('click', cityOnClick)
					.addTo(DataMarkers)
				} else {
					L.marker([item.latitude, item.longitude], {icon: cityIcon})
					.on('click', cityOnClick)
					.addTo(cityMarkers)
				}
			});
		}
	});
}

// Set object key values to null
function setNull(obj) {
	Object.keys(obj).forEach(function(index) {
			obj[index] = null
	});
}

// Present long number in readable format
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Find date x days away
function addDays(date, days) {
	const copy = new Date(Number(date));
	copy.setDate(date.getDate() + days);
	let newDate = copy.toDateString().slice(0, 3);
	return newDate;
}

// Convert kelvin temp to celcius
function kelvinToCelsius(k) {
	return Math.round(k - 273.15);
}

// Get currency exchange from OpenExchange
function getCurrencyExchange() {
	exchangeAmount = parseFloat($('#exchangeAmount').val());
	fromCurrency = $('#fromCurrency option:selected').val();
	toCurrency = $('#toCurrency option:selected').val();
	// ajax php call to open
	if (exchangeAmount && (fromCurrency !== "Choose Currency" && toCurrency !== "Choose Currency")) {
		$.ajax({
			url: "php/getExchange.php",
			type: 'GET',
			dataType: 'json',
			error: (jqXHR, _textStatus, errorThrown) => {
				map.spin(false);
				console.warn(jqXHR.responseText);
				console.log(errorThrown);
			},
			success: (result) => {
				// fromCurrency to USD
				fromRate = result.exchangeRates[fromCurrency];
				amountUSD = exchangeAmount / fromRate;
				// USD to toCurrency
				toRate = result.exchangeRates[toCurrency];
				exchanged = Number.parseFloat(amountUSD * toRate).toFixed(2);
				// Generate result
				map.spin(false);
				$.getJSON('json/currencies.json', function(currencies) {
					currency = currencies.find(o => o.cc === toCurrency);
					$('#toCurrencySymbol').html(currency.symbol);
				});
				$('#exchangeResultH').html("Result:");
				$('#exchangeResult').html(`<span id="toCurrencySymbol"></span>
				<span class="ms-2" id="exchangeRecieved"></span>${numberWithCommas(exchanged)}`);
			}
			// Consider decimal place variable as not all currencies use decimal notation e.g. Albanian Lek
		});
	} else {
		map.spin(false);
		$('#exchangeResultH').html("Result:")
		$('#exchangeResult').html("Form incomplete")
	}
} 

function cityOnClick(e) {
	if (!this._popup) {
		formData.lat = e.latlng.lat;
		formData.lng = e.latlng.lng;
		$.ajax({
			url: "php/getCityData.php",
			type: 'GET',
			dataType: 'json',
			data: formData,
			error: (jqXHR, _textStatus, errorThrown) => {
				map.spin(false);
				console.warn(jqXHR.responseText);
				console.log(errorThrown);
				alert("Ohh no, there is no city data available for this location.");
			},
			success: (result) => {
				console.log(result);
				var popup = L.responsivePopup().setContent(
					`<div class="d-flex flex-column">
						<div class="d-flex justify-content-between">
							<h2>${result.cityData.cityName}</h2>
						</div>
						<hr class="m-0 mb-2">
						<h3 class="fs-6 m-0">Location:</h3>
						<div class="d-flex justify-content-between mb-1">
							<span class="fs-6 m-0">Latitude:</span><span class="fs-6">${result.cityData.wikipedia.lat}</span>
							<span class="fs-6 m-0">Longitude:</span><span class="fs-6">${result.cityData.wikipedia.lng}</span>
						</div>
						<h3 class="fs-6 mb-1">Summary:</h3>
						<div class="d-flex flex-column">
								<p class="mb-0">${result.cityData.wikipedia.summary}</p>
						</div>
						<div class="d-flex justify-content-center my-2">
							<a class="btn btn-sm" id="wikiLink" href="https://${result.cityData.wikipedia.wikipediaUrl}" target="_blank" rel="noreferrer" role="button">Go to wiki</a>
						</div>
						<hr class="m-0 mb-2">
						<div class="d-flex flex-column">
								<h3 class="fs-6 mb-1">Popular locations:</h3>
								<section id="venues">
								<div class="">
									${result.cityData.foursquare[0]}
								</div>
								<div class="">
									${result.cityData.foursquare[1]}
								</div>
								<div class="">
									${result.cityData.foursquare[2]}
								</div>
								<div class="">
									${result.cityData.foursquare[3]}
								</div>
								<div class="">
									${result.cityData.foursquare[4]}
								</div>
								</section>
						</div>	
					</div>`
				);
				this.bindPopup(popup, popupOptions).openPopup();
				map.spin(false);
			}
		});
	}
}


// Events
// Get user position and country data when document ready
$(document).ready(() => {
	getLocation();
});

$(document).ajaxStart(() => {
	map.spin(true, {
		lines: 10, length: 0,	width: 10, radius: 20, corners: 1,
		speed: .75,	color: '#d7ceb2', fadeColor: '#2c2e38', 
		shadow: '3px 3px 0px #2c2e38, 5px 5px 0px #5c5f72', 
		zIndex: 9990, className: 'spinner',
	});
});

// Select country by map click
map.on('click', function(e) {
	formData.lat = e.latlng.lat;
	formData.lng = e.latlng.lng;
	formData.geoLocate = null;
	getCountryCode(formData);
	setNull(formData);
});

// Get country data for selected country
$('#country-dropdown').on('change', () => {
	formData.country = $('#country-dropdown option:selected').text();
	formData.iso_a2 = $('#country-dropdown').val();
	formData.geoLocate = null;
	getGeoJSON(formData);
	getCountryData(formData);
	setNull(formData);
});

// Get currency exchange
$('#convertBtn').on('click', () => {
	getCurrencyExchange();
});

// Currency swap
$('#currencySwap').on('click', () => {
	$('.fa-exchange-alt').addClass("imageRot").one('webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd animationend', function () {
		$(this).removeClass("imageRot");
		let newToCurrency = $('#fromCurrency option:selected').val();
		let newFromCurrency = $('#toCurrency option:selected').val();
		$("#toCurrency").val(newToCurrency);
		$("#fromCurrency").val(newFromCurrency);
	})
});