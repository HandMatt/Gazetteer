<?php 
  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  $executionStartTime = microtime(true);
  
  /*Getting the geoJson for the country*/
  $iso_2 = $_REQUEST['iso_a2'];
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

  //Final output
  $output['status']['code'] = "200";
  $output['status']['name'] = "ok";
  $output['status']['description'] = "Country data retrieved";
  $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
  $output['geoJson'] = $countryGeoJson;

  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode($output);
?>