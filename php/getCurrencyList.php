<?php
    $currencyData = json_decode(file_get_contents("../json/currencies.json"), true);

    usort($currencyData, function ($item1, $item2) { 
        return $item1['name'] <=> $item2['name'];
    });

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
    $output['status']['description'] = "success";
    $output['data'] = $currencyData;
 
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($output);
?>