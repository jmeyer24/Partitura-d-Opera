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
			<div id="partiture"></div>
			<div id="legend">
				<div class="timeline"></div>
				<div class="title">partitura d'opera</div>
				<div class="timeline"></div>
				<div id="legend-text">
					<h2 id="noteforcond">Note for the conductor</h2>
					<p>
						This partiture depicts <span>10 composers</span> and their opera shows <span>between 1775 and 1833</span><br>
						Each note represents one show of an opera of the respective composer in the respective year
					</p>
					<p>
						The representations are as follow:					
						<table>
							<tr><td>grand staff</td><td></td><td>composer</td></tr>
							<tr><td>measure</td><td></td><td>year</td></tr>
							<tr><td>musical note</td><td></td><td>an opera performance</td></tr>
							<tr><td></td><td>note height</td><td>country of performance</td></tr>
							<tr><td></td><td>note length</td><td>librettist of performance</td></tr>
						</table>
					</p>
					<p>
						<span>Note height</span> indicates the country the show took place in<br>
						Flags show correspondence between note height and country:<br>
						sorted vertically by means of country latitude<br>
						sorted horizontally by number of overall shows in this country<br>
						representing countries with more shows are arranged towards the left
					</p>
					<p>
						<span>Note length</span> indicates the librettist of the opera<br>
						This is only in respect to the composer<br>
						One librettist can therefore have varying note lengths for different composers<br>
						The table below shows the assignment between note length and librettist<br>
						Overall, more frequent librettist do have shorter note lengths
					</p>
				</div>
				<div id="legend-staves">
				</div>
				<div id="legend-flags">
					<div id="flags"></div>
				</div>
				<div id="legend-map"></div>
				<div class="timeline"></div>
				<div class="title">partitura d'opera</div>
				<div class="timeline"></div>
			</div>
		</div>
		<script type="module" src="functions.js"></script>
		<script type="module" src="draw.js"></script>
		<script type="module" src="main.js"></script>
	</body>
</html>
