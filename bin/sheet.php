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
// $data = array_map('str_getcsv', file('data' . DIRECTORY_SEPARATOR . 'opera_data.csv'));
$data = array_map('str_getcsv', file('..' . DIRECTORY_SEPARATOR. 'data' . DIRECTORY_SEPARATOR . 'opera_data.csv'));
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
		<!--script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script-->
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.2/papaparse.js"></script>
		<script src="https://d3js.org/d3.v7.min.js"></script>
		<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
	</head>
	<body>
<script type="text/javascript">
<?php echo "var dataset = '$json_data';";?>
// <?php echo "console.log('this is json_data (.php): ', '$json_data');";?>
</script>
		<div id="output" class="output">
			<canvas id="partiture"></canvas>
			<!-- <div id="partiture"></div> -->
			<div id="legend">
				<div class="timeline"></div>
				<div class="title"><a id="link">partitura d'opera</a></div>
				<div class="timeline"></div>
				<div id="legend-text">
					<h2 id="noteforcond">Note for the conductor</h2>
					<p>
						This partiture depicts <span>10 composers</span> and their opera shows <span>between 1775 and 1833</span> as a musical piece<br>
						<span>A single note</span> represents <span>one show</span> of an opera of the respective composer in the respective year<br>
					</p>
					<p>
						<span>Pitch and length</span> of such a note give <span>country and librettist</span> of the performance, respectively<br>
						More frequent librettist have shorter note lengths<br>
					</p>
					<p>
						Flags correspond to pitch and are sorted:<br>
						- vertically by means of country latitude (see graph on the right)<br>
						- horizontally by number of overall shows in this country<br>
						countries with more shows are arranged to the left
					</p>
					<p>
						An overview of the information is as follows:						
					</p>
					<table>
						<tr><th>musical notation</th><th>data</th></tr>
						<tr><td>grand staff</td><td>composer</td></tr>
						<tr><td>measure</td><td>year</td></tr>
						<tr><td>musical note</td><td>an opera performance</td></tr>
						<tr><td>note length</td><td>librettist of performance</td></tr>
						<tr><td>pitch/flag</td><td>country of performance</td></tr>
					</table>
				</div>
				<div id="legend-staves"></div>
				<div id="legend-librettist">
					<!-- <table id="table-librettist">
						<tr><th>Note length</th><th>Librettist</th></tr>
						<tr><td>Pot</td><td>Pot</td></tr>
					</table> -->
				</div>
				<div id="legend-flags">
					<div id="flags"></div>
					<p>more shows first</p>
				</div>
				<div id="legend-map"></div>
				<div class="timeline"></div>
				<div class="title">Jakob Meyer</div>
				<div class="timeline"></div>
			</div>
		</div>
		<script type="module" src="functions.js"></script>
		<script type="module" src="draw.js"></script>
		<script type="module" src="main.js"></script>
	</body>
</html>
