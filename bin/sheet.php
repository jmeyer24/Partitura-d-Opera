<?php
/* php version reading the file and displaying some html */
/* https://stackoverflow.com/questions/9139202/how-to-parse-a-csv-file-using-php */

/* this is very important, else json_encode returns an empty string... */
function utf8ize($d) {
	if (is_array($d)) {
		foreach ($d as $k => $v) {
			$d[$k] = utf8ize($v);
		}
	} else if (is_string ($d)) {
		return utf8_encode($d);
	}
	return $d;
}

/* get the file as an array and set the keys to the respective values ("composer",...) */
$data = array_map('str_getcsv', file('..' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'opera_data.csv'));
array_walk($data, function(&$a) use ($data) {
	$a = array_combine($data[0], $a);
});
array_shift($data);

/* json_encode the array, so to be usable in .js */
$json_data = json_encode(utf8ize($data));
/* this is done, as due to line 24 we mustn't have any "'" in the $json_data string */
$json_data = str_replace("'", " ", $json_data);
?>

<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>Opera Partiture</title>
		<link rel="stylesheet" media="screen" href="https://fontlibrary.org/face/symbola" type="text/css"/>
		<link rel="stylesheet" media="screen" href="sheet.css" type="text/css"/>
		<script src="https://cdn.jsdelivr.net/npm/vexflow/build/cjs/vexflow.js"></script>
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.2/papaparse.js"></script>
		<script src="https://d3js.org/d3.v7.min.js"></script>
		<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
	</head>
	<body>
		<!-- brute force with input form and buttons to load and draw -->
		<!-- <input id="inputcsv" type="file" accept=".csv"></input>
		<button id="loadbutton" accesskey="l">Load the data</button>
		<button id="drawbutton" accesskey="d">Draw the data</button> -->
<script type="text/javascript">
<?php echo "var dataset = '$json_data';";?>
/* <?php echo "console.log('this is json_data (.php): ', '$json_data');";?> */
</script>
		<div id="output" class="output"></div>
		<script src="sheet.js" type="text/javascript"></script>

<?php
/* TODO: uncomment for the flags */
/* this saves some loading time when commented... */
/* draw the flags */
$maxCountries = 7; // maximum number of different countries a composer had
$top = 75;
$interline = 10;
$interstave = 100 - $maxCountries * $interline;
$countrys = ["austria", "czech-republic", "england", "france", "germany", "italy", "netherlands", "poland", "russia"];
for($c = 0; $c < 10; $c++){
	for($i = 0; $i < $maxCountries; $i++){
		echo '<img src="img/flags/' . $countrys[array_rand($countrys)] . '-flag.jpg" style="top:' . $top . 'px; height:' . $interline-1 . 'px;">';
		$top += $interline;
	}
	$top += $interstave;
}

/* draw a table */
/* $header = $data[0]; */
/* array_shift($data); */
/* echo "<table><tr>"; */
/* foreach ($header as $field){ */
/* 	echo "<th>" . $field . "</th>"; */
/* } */
/* echo "</tr>"; */
/* foreach ($data as $show) { */
/* 	echo "<tr>"; */
/* 	foreach ($show as $field){ */
/* 		echo "<td>" . $field . "</td>"; */
/* 	} */
/* 	echo "</tr>\n"; */
/* } */
/* echo "</table>"; */
?>

	</body>
</html>
