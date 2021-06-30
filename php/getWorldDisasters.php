<?php

  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  $executionStartTime = microtime(true);

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

  $worldDisastersUrl ="https://api.reliefweb.int/v1/disasters?appname=apidoc&filter[field]=status&filter[value][]=current&filter[value][]=alert&filter[operator]=OR&limit=50&profile=full&preset=latest&profile=full";
  curl_setopt($ch, CURLOPT_URL, $worldDisastersUrl);
  $disastersResponse = curl_exec($ch);
  $disastersResult = json_decode($disastersResponse, true);
  foreach ($disastersResult['data'] as &$disaster) {
    $disaster['fields']['affected_countries'] = '';
    foreach ($disaster['fields']['country'] as $countryObject) {
      $disaster['fields']['affected_countries'] .= $countryObject['name'] .= ', ';
    }
    $disaster['fields']['affected_countries'] = rtrim($disaster['fields']['affected_countries'], ", ");
    if (str_contains($disaster['fields']['affected_countries'], ',')) {
      $disaster['fields']['affected_countries'] = substr_replace($disaster['fields']['affected_countries'], ' and', strrpos($disaster['fields']['affected_countries'], ','), 1);
    }
    $disaster['fields']['name'] = explode(' - ', $disaster['fields']['name'])[0];
    $disaster['fields']['date']['created'] = explode('T', $disaster['fields']['date']['created'])[0];
    $timestamp = strtotime($disaster['fields']['date']['created']);
    $disaster['fields']['date'] = date("d-m-Y", $timestamp);
    $disaster['fields']['description-html'] = substr($disaster['fields']['description-html'], 0, 250);
    unset($disaster['fields']['country']);
    unset($disaster['fields']['current']);
    unset($disaster['fields']['glide']);
    unset($disaster['fields']['description']);
    unset($disaster['fields']['featured']);
    unset($disaster['fields']['id']);
    unset($disaster['fields']['primary_country']['href']);
    unset($disaster['fields']['primary_country']['id']);
    unset($disaster['fields']['primary_country']['iso3']);
    unset($disaster['fields']['primary_country']['name']);
    unset($disaster['fields']['primary_country']['shortname']);
    unset($disaster['fields']['primary_type']['id']);
    unset($disaster['fields']['primary_type']['code']);
    unset($disaster['fields']['profile']);
    unset($disaster['fields']['status']);
    unset($disaster['fields']['type']);
    unset($disaster['fields']['url_alias']);
    unset($disaster['href']);
    unset($disaster['id']);
    unset($disaster['score']);
  }

  curl_close($ch);

  $output['status']['code'] = "200";
  $output['status']['name'] = "ok";
  $output['status']['description'] = "success";
  $output['disasters'] = $disastersResult['data'];

  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode($output);
?>