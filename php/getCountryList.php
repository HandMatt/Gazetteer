<?php
    $countryData = json_decode(file_get_contents("../json/countryBorders.geo.json"), true);

    $countries = [];

    foreach ($countryData['features'] as $feature) {
        $country['code'] = $feature['properties']['iso_a2'];
        $country['name'] = $feature['properties']['name'];
        array_push($countries, $country);
    }

    usort($countries, function ($country1, $country2) { 
        return $country1['name'] <=> $country2['name'];
    });

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
    $output['status']['description'] = "success";
    $output['data'] = $countries;
 
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($output);
?>