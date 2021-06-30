<?php
  require_once 'api_keys.php';

  if($_REQUEST['geoLocate']) {
    $geoLocate = $_REQUEST['geoLocate'];
  } else {
    $geoLocate = null;
  }

  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  $executionStartTime = microtime(true);

  //cURL
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

  // Gets Country Code using GeoNames
  $countryCodeUrl = "http://api.geonames.org/countryCodeJSON?formatted=true&lat=" . $_REQUEST['lat'] . "&lng=" . $_REQUEST['lng'] . "&username=" . $geonamesUsername;
  curl_setopt($ch, CURLOPT_URL, $countryCodeUrl);
  $countryCodeResponse = curl_exec($ch);

  curl_close($ch);
  
  $countryCodeResult = json_decode($countryCodeResponse, true);

  // Final output
  $output['status']['code'] = "200";
  $output['status']['name'] = "ok";
  $output['status']['description'] = "Country data retrieved";
  $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
  if(array_key_exists("countryCode", $countryCodeResult)){
    $output['countryCode']['countryCode'] = $countryCodeResult['countryCode'];
    $output['countryCode']['countryName'] = $countryCodeResult['countryName'];
  }
  $output['request']['geoLocate'] = $geoLocate;
  $output['request']['latitude'] =  $_REQUEST['lat'];
  $output['request']['longitude'] = $_REQUEST['lng'];

  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode($output); 
?>