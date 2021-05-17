/* Map Settings */
// Initialise map
var map = L.map('map');
map.createPane('labels');
map.setView([0, 0], 2);
map.getPane('labels').style.zIndex = 650;
map.getPane('labels').style.pointerEvents = 'none';

L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
}).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
	attribution: '©OpenStreetMap, ©CartoDB',
	pane: 'labels'
}).addTo(map);

// Create custom Icons
var MapIcon = L.Icon.extend({
	options: {
		iconSize: [25, 41],
		iconAnchor: [12, 40],
		popupAnchor: [0, -42]
	}
});
var userIcon = new MapIcon({iconUrl: 'images/userMarker.png'}),
		capitalIcon = new MapIcon({iconUrl: 'images/capitalMarker.png'}),
		cityIcon = new MapIcon({iconUrl: 'images/cityMarker.png'}),
		oceanIcon = new MapIcon({iconUrl: 'images/oceanMarker.png'});

// GeoJSON variables
const geoJsonStyle = {
	"color": "#85e384",
	"opacity": 0.8,
	"weight": 2,
}
let geoJsonLayer = [];

/* Input variables */
// Populate country <select>
$.ajax({
	url: 'php/getCountryList.php',
	type: 'GET',
	dataType: 'JSON',
	error: (jqXHR, textStatus, errorThrown) => {
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
	error: (jqXHR, textStatus, errorThrown) => {
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
	'geoLocate': null
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
		L.marker([formData.lat, formData.lng], {icon: userIcon}).addTo(map)
			.bindPopup('Your location');
		getCountryCode(formData);
		setNull(formData);
	}).catch((err) => {
		console.error(err.message);
		removeLoad();
	});
}

function getCountryCode(formData) {
	// Loading screen on search
	$("#preloader").attr("style", "display: show !important");

	$.ajax({
		url: "php/getCountryCode.php",
		type: 'GET',
		dataType: 'json',
		data: formData,
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(jqXHR.responseText);
			console.log(errorThrown);
			removeLoad();
		},
		success: (result) => {	
			if (result.status.name == "ok") {
				countryCode = result.countryCode;
				if ('status' in countryCode) {
					formData.lat = result.latitude;
					formData.lng = result.longitude;
					getOceanData(formData);
					
				} else {
					formData.iso_a2 = countryCode.countryCode;
					formData.country = countryCode.countryName;
					formData.geoLocate = result.geoLocate;
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
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(jqXHR.responseText);
			console.log(errorThrown);
			removeLoad();
		},
		success: (result) => {	
			if (result.status.name == "ok") {
				removeLoad();
				L.marker([formData.lat, formData.lng], {icon: oceanIcon}).addTo(map)
					.bindPopup(`<a href=https://${result.geonameId.wikipediaURL} target="_blank">${result.ocean.ocean.name}</a>`).openPopup();
			}
		}
	});
}

// Get country data
function getCountryData(formData) {
	// Loading screen on search
	$("#preloader").attr("style", "display: flex !important");

	$.ajax({
		url: "php/getCountry.php",
		type: 'GET',
		dataType: 'json',
		data: formData,
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(jqXHR.responseText);
			console.log(errorThrown);
			removeLoad();
		},
		success: (result) => {
			if (result.status.name == "ok") {
				document.getElementById('country-dropdown').value = result['countryCode'];
				createGeoJson(result['geoJson']);

				// Geonames data
				const geonamesInfo = result.countryInfo.geonames[0];
				$('.country-name').html(`${geonamesInfo['countryName']}, ${result['countryCode']}`);
				$('#capital').html(geonamesInfo['capital']);
				$('#population').html(numberWithCommas(geonamesInfo['population']));
				$('#area').html(numberWithCommas(geonamesInfo['areaInSqKm']));

				const geonamesWiki = result.geonamesWiki.geonames.filter(item => item.title.includes(geonamesInfo['countryName']) || item.feature == "country")[0];
				$('#countrySummary').html(geonamesWiki.summary);
				$('#wikiLink').attr("href", "https://" + geonamesWiki.wikipediaUrl);
			
				// RestCountries 
				const restCountries = result.restCountries;
				$('.flag').attr({
					src: restCountries.flag,
					alt: `The national flag of ${restCountries.name}`
				});
				$('#region').html(restCountries.region);
				$('#subregion').html(restCountries.subregion);
				$('#language').html(restCountries.languages[0].name);
				const currency = restCountries.currencies[0];
				$('#currencyName').html(currency.name);
				$('#currencySymbol').html(`(${currency.symbol})`);

				// Open Weather Data
				var openWeather = result.openWeather.daily;
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

				// Geonames Cities Data
				if (!result.geonamesCities.status) {
					const geoCities = result.geonamesCities.geonames.filter(item => item.countrycode.includes(result['countryCode']));
					let cities = geoCities.length;
					if (cities > 10) {
						cities = 10;	
					}
					for (let i = 0; i < cities; i++) {
						if (geoCities[i].fcode == "PPLC") {
							L.marker([geoCities[i].lat, geoCities[i].lng], {icon: capitalIcon}).addTo(map)
							.bindPopup(
								`<h5><a href=https://${geoCities[i].wikipedia} target="_blank">${geoCities[i].name}</a> - Capital</h3>
								<strong>Population:</strong> ${geoCities[i].population}`
							);	
						} else {
							L.marker([geoCities[i].lat, geoCities[i].lng], {icon: cityIcon}).addTo(map)
							.bindPopup(
								`<h5><a href=https://${geoCities[i].wikipedia} target="_blank">${geoCities[i].name}</a></h3>
								<strong>Population:</strong> ${geoCities[i].population}`
							);
						}
					}
				}

				// Update currency dropdown selection
				if (typeof currency !== "undefined") {
					if (result.geoLocate) {
						$('#fromCurrency').val(currency.code);
					} else {
						$('#toCurrency').val(currency.code);
						$('#exchangeResult').html("");
					}
				} else {
					currencyDropdown.prop('selectedIndex', 0);
				}

				// Remove Loader
				removeLoad();
				showData();
			}
		}
	});
}

// Render country border
function createGeoJson(geoJson) {
	if(geoJsonLayer){
			map.removeLayer(geoJsonLayer);
	}
	geoJsonLayer = L.geoJson(geoJson, {
			style: geoJsonStyle
	}).addTo(map);
	map.fitBounds(geoJsonLayer.getBounds());
}

// Show offcanvas element
function showData() {
	const offCanvasBottom = document.getElementById("offcanvasBottom");
	const dataOffCanvas = new bootstrap.Offcanvas(offCanvasBottom);
	dataOffCanvas.show();
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
			error: (jqXHR, textStatus, errorThrown) => {
				console.log(jqXHR.responseText);
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
				$.getJSON('json/currencies.json', function(currencies) {
					currency = currencies.find(o => o.cc === toCurrency);
					$('#toCurrencySymbol').html(currency.symbol);
				});
				$('#exchangeResultH').html("Result:") 
				$('#exchangeResult').html(`<span id="toCurrencySymbol"></span>
				<span class="ms-2" id="exchangeRecieved"></span>${numberWithCommas(exchanged)}`);
				
			}
			// Consider decimal place variable as not all currencies use decimal notation e.g. Albanian Lek
		});
	} else {
		$('#exchangeResultH').html("Result:")
		$('#exchangeResult').html("Form incomplete")
	}
} 

// Events
// Get user position and country data when document ready
$(document).ready(() => {
	getLocation();
});


// Remove landing page
$('#continueToApp').on('click', () => {
	$('#landingPage').attr("style", "display: none !important");
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
		document.getElementById("toCurrency").value = newToCurrency;
		document.getElementById("fromCurrency").value = newFromCurrency;
	})
});
