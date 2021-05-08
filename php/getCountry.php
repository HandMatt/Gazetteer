<?php
  require_once 'api_keys.php';

  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  $executionStartTime = microtime(true);

  // cURL
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  
  $geoLocate = $_REQUEST['geoLocate'];
  $iso_2 = $_REQUEST['iso_a2'];
  $countryName = $_REQUEST['country'];

  /*Getting the geoJson for the country*/
  $geoJsonString = file_get_contents("../json/countryBorders.geo.json");

  $geoJsonDecode = json_decode($geoJsonString, true);
  $geoJsonCountries = $geoJsonDecode['features'];
  $countryGeoJson = '';

  foreach($geoJsonCountries as $country){
    if($country['properties']['iso_a2'] == $iso_2){
      $countryGeoJson = $country['geometry'];
      break;
    } 
  }

  // Gets country info using Geonames
  $countryInfoUrl = "http://api.geonames.org/countryInfoJSON?formatted=true&country=" . $iso_2 . "&username=" . $geonamesUsername;
  curl_setopt($ch, CURLOPT_URL, $countryInfoUrl);
  $countryInfoResponse = curl_exec($ch);

  // Gets country info using RestCountries
  $restCountriesUrl = "https://restcountries.eu/rest/v2/alpha/" . $iso_2;
  curl_setopt($ch, CURLOPT_URL, $restCountriesUrl);
  $restCountriesResponse = curl_exec($ch);

  // Set latlng values for weather
  $restCountriesResult = json_decode($restCountriesResponse, true);
  $latitude = $restCountriesResult['latlng'][0];
  $longitude = $restCountriesResult['latlng'][1];

  // Gets wiki info using GeoNames
  $geonamesWikiUrl = "http://api.geonames.org/wikipediaSearchJSON?q=" . urlencode($countryName) . "&maxRows=10&username=" . $geonamesUsername;
  curl_setopt($ch, CURLOPT_URL,$geonamesWikiUrl);
  $geonamesWikiResponse = curl_exec($ch);

  // Gets weather data from OpenWeather
  $openWeatherUrl = "https://api.openweathermap.org/data/2.5/onecall?lat=".$latitude."&lon=" . $longitude . "&exclude=minutely,hourly,alerts&appid=" . $openWeatherKey;
  curl_setopt($ch, CURLOPT_URL,$openWeatherUrl);
  $openWeatherResponse = curl_exec($ch);

  curl_close($ch);
  
  $countryInfoResult = json_decode($countryInfoResponse, true);
  $geonamesWikiResult = json_decode($geonamesWikiResponse, true);
  $openWeatherResult = json_decode($openWeatherResponse, true);

  // Final output
  $output['status']['code'] = "200";
  $output['status']['name'] = "ok";
  $output['status']['description'] = "Country data retrieved";
  $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
  $output['geoLocate'] = $geoLocate;
  $output['countryCode'] = $iso_2;
  $output['geoJson'] = $countryGeoJson;
  $output['countryInfo'] = $countryInfoResult;
  $output['restCountries'] = $restCountriesResult;
  $output['geonamesWiki'] = $geonamesWikiResult;
  $output['openWeather'] = $openWeatherResult;

  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode($output);
?>