<?php
  require_once 'api_keys.php';
  
  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  $executionStartTime = microtime(true);

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

  $dragged = $_REQUEST['dragged'];
  
  $oceanUrl = "http://api.geonames.org/oceanJSON?formatted=true&lat=" . $_REQUEST['lat'] . "&lng=" . $_REQUEST['lng'] . "&username=" . $geonamesUsername;
  curl_setopt($ch, CURLOPT_URL, $oceanUrl);
  $oceanResponse = curl_exec($ch);
  $oceanResult = json_decode($oceanResponse, true);
  if (array_key_exists('ocean', $oceanResult)) {
    $geonameId =  $oceanResult['ocean']['geonameId'];
    $geonameGetUrl = "http://api.geonames.org/getJSON?formatted=true&geonameId=" . $geonameId . "&username=" . $geonamesUsername;
    curl_setopt($ch, CURLOPT_URL, $geonameGetUrl);
    $geonameResponse = curl_exec($ch);
    $geonameResult = json_decode($geonameResponse, true);
    curl_close($ch);
    $output['ocean']['asciiName'] = $geonameResult['asciiName'];
    if (array_key_exists('wikipediaURL', $geonameResult)) {
      $output['ocean']['wikipediaURL'] = $geonameResult['wikipediaURL'];
    }
  } else {
    $output['ocean']['asciiName'] = "Too dry";
    $output['ocean']['wikipediaURL'] = "en.wikipedia.org/wiki/Don%27t_repeat_yourself";
  }
  
  $output['status']['code'] = "200";
  $output['status']['name'] = "ok";
  $output['status']['description'] = "success";
  $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
  $output['request']['dragged'] = $dragged; 
  
  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode($output);
?>