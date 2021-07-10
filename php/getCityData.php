<?php 
require_once 'api_keys.php';

$countryCode = $_REQUEST['iso_a2'];

ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

//cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

//Get location name from latlng
$geonamesPlacesUrl = "http://api.geonames.org/findNearbyPlaceNameJSON?lat=" . $_REQUEST['lat'] . "&lng=" . $_REQUEST['lng'] . "&username=" . $geonamesUsername;
curl_setopt($ch, CURLOPT_URL, $geonamesPlacesUrl);
$geonamesPlacesResponse = curl_exec($ch);

$geonamesPlacesResult = json_decode($geonamesPlacesResponse, true);
$cityName = $geonamesPlacesResult['geonames'][0]['name'];
$countryCode = $geonamesPlacesResult['geonames'][0]['countryCode'];

//Get wikipedia article information
$wikipediaSearchUrl = "http://api.geonames.org/wikipediaSearchJSON?q=".urlencode($cityName).",".$countryCode.",city&maxRows=1&username=".$geonamesUsername;
curl_setopt($ch, CURLOPT_URL, $wikipediaSearchUrl);
$wikipediaSearchResponse = curl_exec($ch);

$wikipediaSearchResult = json_decode($wikipediaSearchResponse, true);
if ($wikipediaSearchResult['geonames'] != null) {
  $lat = round($wikipediaSearchResult['geonames'][0]['lat'], 2);
  $lng = round($wikipediaSearchResult['geonames'][0]['lng'], 2);
  $wikiLink = "<a href='https://".$wikipediaSearchResult['geonames'][0]['wikipediaUrl']."' target='_blank' rel='noreferrer'>more</a>";
  $wikiSummary = str_replace("...", $wikiLink, $wikipediaSearchResult['geonames'][0]['summary']);
} else {
  $lat = round($_REQUEST['lat'], 2);
  $lng = round($_REQUEST['lng'], 2);
}


//Get popular spots around city
$foursquareUrl = "https://api.foursquare.com/v2/venues/explore?client_id=".$foursquareId."&client_secret=".$foursquareSecret."&v=20210627&near=".urlencode($cityName).",".$countryCode."&section=topPicks&limit=5";
curl_setopt($ch, CURLOPT_URL, $foursquareUrl);
$foursquareResponse = curl_exec($ch);
$foursquareResult = json_decode($foursquareResponse, true);

curl_close($ch);

$foursquareVenues = array();
if ($foursquareResult['response'] == null) {
  $venueHTML = '<span class="fs-6 mb-1">No venue information available for '.$cityName.'</span>';
  array_push($foursquareVenues, $venueHTML);
} else {
  foreach ($foursquareResult['response']['groups'][0]['items'] as $venue) {
    $name = $venue['venue']['name'];
    $iconAlt = $venue['venue']['categories'][0]['name'];
    $icon = $venue['venue']['categories'][0]['icon'];
    if (array_key_exists('address', $venue['venue']['location'])) {
      $address = $venue['venue']['location']['address'];
    } else {
      $address = 'No address available';
    }
    if (array_key_exists('city', $venue['venue']['location'])) {
      $city = $venue['venue']['location']['city'];
    } else {
      $city = '';
    }
    if (array_key_exists('postalCode', $venue['venue']['location'])) {
      $postCode = $venue['venue']['location']['postalCode'];
    } else {
      $postCode = '';
    }

    $venueHTML = '<h3 class="fs-6 mb-1">'.$name.'</h3>
    <div class="d-flex justify-content-around mb-1">
      <img class="venueIcon" src="'.$icon['prefix'].'bg_64'.$icon['suffix'].'" title="'.$iconAlt.'" alt="'.$iconAlt.'"/>
      <div class="d-flex flex-column text-right">
        <h4 class="fs-6 mb-1">Address:</h4>
        <span>'.$address.'</span>
        <span>'.$city.'</span>
        <span>'.$postCode.'</span>
      </div>
    </div>';
    array_push($foursquareVenues, $venueHTML);
  }
}

// Final output
$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "City data retrieved";
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
$output['cityData']['cityName'] = $cityName;
if ($wikipediaSearchResult['geonames'] != null) {
  $output['cityData']['wikipedia']['summary'] = $wikiSummary;
} else {
  $output['cityData']['wikipedia']['summary'] = "Currently unavailable";
}

$output['cityData']['wikipedia']['lat'] = $lat;
$output['cityData']['wikipedia']['lng'] = $lng;
$output['cityData']['foursquare'] = $foursquareVenues;

header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output); 
?>
