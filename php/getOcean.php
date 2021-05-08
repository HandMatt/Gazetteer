<?php
  require_once 'api_keys.php';
  
  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  $executionStartTime = microtime(true);

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  
  $oceanUrl = "http://api.geonames.org/oceanJSON?formatted=true&lat=" . $_REQUEST['lat'] . "&lng=" . $_REQUEST['lng'] . "&username=" . $geonamesUsername;
  curl_setopt($ch, CURLOPT_URL, $oceanUrl);
  $oceanResponse = curl_exec($ch);
  $oceanResult = json_decode($oceanResponse, true);
  $geonameId =  $oceanResult['ocean']['geonameId'];

  $geonameGetUrl = "http://api.geonames.org/getJSON?formatted=true&geonameId=" . $geonameId . "&username=" . $geonamesUsername;
  curl_setopt($ch, CURLOPT_URL, $geonameGetUrl);
  $geonameResponse = curl_exec($ch);
  $geonameResult = json_decode($geonameResponse, true);

  curl_close($ch);

  $output['status']['code'] = "200";
  $output['status']['name'] = "ok";
  $output['status']['description'] = "success";
  $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";

  $output['ocean'] = $oceanResult;
  $output['geonameId'] = $geonameResult;

  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode($output);
?>