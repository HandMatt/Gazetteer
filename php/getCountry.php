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

  // Gets country info using Geonames
  $countryInfoUrl = "http://api.geonames.org/countryInfoJSON?formatted=true&country=" . $iso_2 . "&username=" . $geonamesUsername;
  curl_setopt($ch, CURLOPT_URL, $countryInfoUrl);
  $countryInfoResponse = curl_exec($ch);
  $countryInfoResult = json_decode($countryInfoResponse, true);
  $countryData = $countryInfoResult['geonames'][0];

  // Gets country info using RestCountries
  $restCountriesUrl = "https://restcountries.eu/rest/v2/alpha/" . $iso_2;
  curl_setopt($ch, CURLOPT_URL, $restCountriesUrl);
  $restCountriesResponse = curl_exec($ch);
  $restCountriesResult = json_decode($restCountriesResponse, true);

  // Gets wiki info using GeoNames
  $geonamesWikiUrl = "http://api.geonames.org/wikipediaSearchJSON?q=" . urlencode($countryData['countryName']) . "&title=" . urlencode($countryData['countryName']) . "&maxRows=20&username=" . $geonamesUsername;
  curl_setopt($ch, CURLOPT_URL,$geonamesWikiUrl);
  $geonamesWikiResponse = curl_exec($ch);
  $geonamesWikiResult = json_decode($geonamesWikiResponse, true);
  //Filter geonames wiki result
  $geonamesWikiFiltered = array_filter($geonamesWikiResult['geonames'], function($item) use($countryData){
    return (in_array('country', $item) || (in_array($countryData['countryName'], $item)));
  });
  $geonamesWiki = reset($geonamesWikiFiltered);
  //If no result try alt name
  if (!$geonamesWiki) {
    $geonamesWikiUrl = "http://api.geonames.org/wikipediaSearchJSON?q=" . urlencode($restCountriesResult['name']) . "&title=" . urlencode($restCountriesResult['name']) . "&maxRows=10&username=" . $geonamesUsername;
    curl_setopt($ch, CURLOPT_URL,$geonamesWikiUrl);
    $geonamesWikiResponse = curl_exec($ch);
    $geonamesWikiResult = json_decode($geonamesWikiResponse, true);
    //Filter geonames wiki result
    $geonamesWikiFiltered = array_filter($geonamesWikiResult['geonames'], function($item) use($countryData){
      return (in_array('country', $item) || (in_array($countryData['countryName'], $item)));
    });
    $geonamesWiki = reset($geonamesWikiFiltered);
  }

  // Gets capital city info using GeoNames
  $geonamesSearchUrl = "http://api.geonames.org/searchJSON?q=" . $countryData['capital'] . "," . $iso_2 . "&maxRows=10&username=" . $geonamesUsername;
  curl_setopt($ch, CURLOPT_URL,$geonamesSearchUrl);
  $geonamesSearchResponse = curl_exec($ch);
  $geonamesSearchResult = json_decode($geonamesSearchResponse, true);
  ;
  
  //Filter search data and assign capital as weather coords
  if (isset($geonamesSearchResult)) {
    foreach ($geonamesSearchResult['geonames'] as &$city) {
      if ($city['fcode'] == "PPLC") {  
        $latitude = $city['lat'];
        $longitude = $city['lng'];
      }
    }
  } else {
    $latitude = $restCountriesResult['latlng'][0];
    $longitude = $restCountriesResult['latlng'][1];
  }


  // Gets weather data from OpenWeather
  $openWeatherUrl = "https://api.openweathermap.org/data/2.5/onecall?lat=".$latitude."&lon=" . $longitude . "&exclude=minutely,hourly,alerts&appid=" . $openWeatherKey;
  curl_setopt($ch, CURLOPT_URL,$openWeatherUrl);
  $openWeatherResponse = curl_exec($ch);
  $openWeatherResult = json_decode($openWeatherResponse, true);
  $fourDayForecast = array_slice($openWeatherResult['daily'], 0, 4);
  foreach ($fourDayForecast as &$day) {
    unset($day['clouds']);
    unset($day['dew_point']);
    unset($day['dt']);
    unset($day['feels_like']);
    unset($day['humidity']);
    unset($day['moon_phase']);
    unset($day['moonrise']);
    unset($day['moonset']);
    unset($day['moonset']);
    unset($day['pop']);
    unset($day['pressure']);
    unset($day['sunrise']);
    unset($day['sunset']);
    unset($day['pop']);
    unset($day['uvi']);
    unset($day['wind_gust']);
    unset($day['temp']['day']);
    unset($day['temp']['eve']);
    unset($day['temp']['morn']);
    unset($day['temp']['night']);
  }

  curl_close($ch);

  // Final output
  $output['status']['code'] = "200";
  $output['status']['name'] = "ok";
  $output['status']['description'] = "Country data retrieved";
  $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
  $output['request']['geoLocate'] = $geoLocate;
  //Country Data Object
  $output['countryData']['countryCode'] = $iso_2;
  $output['countryData']['countryName'] = $countryData['countryName'];
  $output['countryData']['capital'] = $countryData['capital'];
  $output['countryData']['population'] = $countryData['population'];
  $output['countryData']['areaInSqKm'] = $countryData['areaInSqKm'];
  if ($geonamesWiki) {
    $output['countryData']['wikiSummary'] = $geonamesWiki['summary'];
    $output['countryData']['wikipediaUrl'] = $geonamesWiki['wikipediaUrl'];
  } else {
    $output['geonamesWiki'] = $geonamesWikiResult;
  }
  $output['countryData']['flag'] = $restCountriesResult['flag'];
  $output['countryData']['region'] = $restCountriesResult['region'];
  $output['countryData']['subregion'] = $restCountriesResult['subregion'];
  $output['countryData']['language'] = $restCountriesResult['languages'][0]['name'];
  $output['countryData']['currencyName'] = $restCountriesResult['currencies'][0]['name'];
  $output['countryData']['currencySymbol'] = $restCountriesResult['currencies'][0]['symbol'];
  $output['countryData']['currencyCode'] = $restCountriesResult['currencies'][0]['code'];

  //Weather Data Object
  $output['openWeather'] = $fourDayForecast;
  
  //Testing
  //$output['countryInfo'] = $countryInfoResult;
  //$output['restCountries'] = $restCountriesResult;
  //$output['countryDataTest'] = $countryData;

  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode($output);
?>