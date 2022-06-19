// ========================================================================
// setup
// ========================================================================
const {
  Renderer,
  Stave,
  StaveNote,
  GhostNote,
  Voice,
  Beam,
  Formatter,
  TextNote,
  StaveConnector,
  Modifier,
  Factory,
  Tuplet,
  Fraction,
  Annotation,
  Font,
} = Vex.Flow;

// ========================================================================
// meta-variables
// ========================================================================
const x = 130;
const y = 0; // 20
const staveDistance = 90; // 70
const staveWidth = window.innerWidth - 1.25 * x;
const textPosition = 3;
const max_operas = 18;

// ========================================================================
// save input file data in these variables
// ========================================================================
let dataset = [];
let data = [];

// ========================================================================
// Create an SVG renderer and attach it to the DIV element named "output".
// ========================================================================
const div = document.getElementById("output");
let datjson = 0;
const renderer = new Renderer(div, Renderer.Backends.SVG);
renderer.resize(window.innerWidth, window.innerHeight);

// ========================================================================
// Configure the rendering context.
// ========================================================================
const context = renderer.getContext();

// ========================================================================
// Get DOM elements
// ========================================================================
const drawbutton = document.getElementById("drawbutton");
const loadbutton = document.getElementById("loadbutton");
const inputcsv = document.getElementById("inputcsv");
let loaded = false;

// ========================================================================
// add event listeners for the upload and draw buttons
// ========================================================================
drawbutton.addEventListener("click", main);
loadbutton.addEventListener("click", loadData);
document.onkeydown = function (e) {
  switch (e.keyCode) {
    case 68:
      drawbutton.click();
      break;
    case 76:
      loadbutton.click();
      break;
    case 85:
      inputcsv.click();
      break;
    default:
      break;
  }
};

// ========================================================================
// read the uploaded data file and save its content in the variable dataset
// ========================================================================
function loadData() {
  if (typeof inputcsv.files[0] == "undefined") {
    alert("No file uploaded yet!");
  } else {
    Papa.parse(inputcsv.files[0], {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        dataset = [];
        for (i = 0; i < results.data.length; i++) {
          dataset.push(results.data[i]);
        }
      },
    });
    loaded = true;
    loadbutton.innerHTML = "File loaded";
  }
}

// ========================================================================
// grab the necessary information from the variable dataset
// ========================================================================
function prepareData() {
  // get all entries by the same key in an array (collect all composers etc)
  let sets = {};
  for (const [key, value] of Object.entries(dataset[0])) {
    sets[key] = [value];
  }
  for (let i = 1; i < dataset.length; i++) {
    for (const [key, value] of Object.entries(dataset[i])) {
      sets[key].push(value);
    }
  }
  // make em sets of unique instances
  Object.keys(sets).forEach(function (key) {
    sets[key] = new Set(sets[key]);
  });

  // from that, grab necessary information
  let dat = {
    numComposers: sets["composer"].size,
    numLibrettists: sets["librettist"].size,
    numPlaces: sets["placename"].size,
    numYears:
      Math.max(...sets["performance_year"]) -
      Math.min(...sets["performance_year"]),
  };
  return dat;
}

// ========================================================================
// Helper function to sort arrays by indices
// ========================================================================
function getSortIndices(input) {
  toSort = [...input];
  for (var i = 0; i < toSort.length; i++) {
    toSort[i] = [toSort[i], i];
  }
  toSort.sort(function (left, right) {
    return left[0] < right[0] ? -1 : 1;
  });
  let sortIndices = [];
  for (var j = 0; j < toSort.length; j++) {
    sortIndices.push(toSort[j][1]);
    toSort[j] = toSort[j][0];
  }
  return sortIndices;
}

// ========================================================================
// Helper function to compare two arrays
// ========================================================================
// Warn if overriding existing method
if (Array.prototype.equals)
  console.warn(
    "Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code."
  );
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array) return false;

  // compare lengths - can save a lot of time
  if (this.length != array.length) return false;

  for (var i = 0, l = this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i])) return false;
    } else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", { enumerable: false });

// ========================================================================
// draw the partiture by some data
// ========================================================================
function drawPartiture(dat) {
  let librettistNoteMap = [
    "f/4",
    "g/4",
    "a/4",
    "b/4",
    "c/5",
    "d/5",
    "e/5",
    "f/5",
  ];
  // let librettistColorMap = d3
  //   .scaleSequential()
  //   .domain([0, 7])
  //   .interpolator(d3.interpolateViridis);
  // let librettistColorMap = d3
  //   .scaleOrdinal()
  //   .domain(librettistNoteMap)
  //   .range([
  //     "brown",
  //     "blue",
  //     "green",
  //     "purple",
  //     "slateblue",
  //     "darkgreen",
  //     "red",
  //     "orange",
  //   ]);
  let librettistColorMap = d3
    .scaleLinear()
    .domain([0, 7])
    .range(["red", "blue"]);

  context.clear();

  // TODO barwise
  // let w = staveWidth / (dat["numComposers"] + 1);
  let w = staveWidth;

  // for (let p = 0; p < dat["numPlaces"]; p++) {
  // TODO
  // for (let p = 0; p < dat["numLibrettists"]; p++) {
  for (let p = 0; p < 1; p++) {
    // ==============================================================
    // create a line for each place
    // ==============================================================

    // create the first stave
    let stave = new Stave(x, y + p * staveDistance, w);
    let old_s = stave;

    // ==============================================================
    // create a bar for each composer
    // ==============================================================
    for (let i = 0; i < dat["numComposers"]; i++) {
      // get all shows of a composer
      // get all librettist a composer worked with
      // get all operas of a single composer
      let shows = [];
      let librettists = [];
      let operas = [];
      dataset.forEach(function (show) {
        if (show["composerMap"] == i + 1) {
          shows.push(show);
          librettists.push(show["librettistMap"]);
          operas.push(show["operaMap"]);
        }
      });

      // get unique librettist opera pairs
      librettist_opera_pairs = [];
      histogram = [];
      librettists.forEach(function (lib, idx) {
        // new pair
        pair = [lib, operas[idx]];
        // if none of the current pairs matches the new pair
        if (!librettist_opera_pairs.some((p) => p.equals(pair))) {
          // add new pair
          librettist_opera_pairs.push(pair);
          histogram.push(1);
        } else {
          histogram[histogram.length - 1]++;
        }
      });
      let descendingOrderPermutation = getSortIndices(histogram).reverse();
      librettist_opera_pairs = descendingOrderPermutation.map(
        (i) => librettist_opera_pairs[i]
      );
      histogram = descendingOrderPermutation.map((i) => histogram[i]);

      // get unique librettists and operas in sorted fashion
      librettists = [...new Set(librettists)].sort();
      operas = [...new Set(operas)].sort();

      // get composer last name
      let lastName = shows[0]["composer"];
      lastName = lastName.slice(
        0,
        lastName.indexOf(",") < lastName.indexOf(" ")
          ? lastName.indexOf(",")
          : lastName.indexOf(" ")
      );

      // get numOperasOfComposer
      let time = operas.length;

      // TODO make time a list of int for each composer?
      // TODO barwise instead of linewise for the composers?

      // draw staves
      stave = new Stave(old_s.x, y + 2 * i * staveDistance, w);
      let stave2 = new Stave(old_s.x, y + (2 * i + 1) * staveDistance, w);
      stave
        .addTimeSignature(`${time}/4`)
        .addClef("treble")
        .setContext(context)
        .draw();
      stave2
        .addTimeSignature(`${time}/4`)
        .addClef("bass")
        .setContext(context)
        .draw();
      old_s = stave;

      // draw connectors and names
      const conn_double = new StaveConnector(stave, stave2);
      const conn_single_left = new StaveConnector(stave, stave2);
      const conn_single_right = new StaveConnector(stave, stave2);
      conn_single_left
        .setType(StaveConnector.type.SINGLE_LEFT)
        .setContext(context)
        .draw();
      conn_single_right
        .setType(StaveConnector.type.SINGLE_RIGHT)
        .setContext(context)
        .draw();
      conn_double
        .setType(StaveConnector.type.DOUBLE)
        .setText(lastName, Modifier.Position.LEFT)
        .setContext(context)
        .draw();

      // ==============================================================
      // Helper function to draw annotations below note heads
      // ==============================================================
      const annotation = (text, hJustification, vJustification) =>
        new Annotation(text)
          .setFont(Font.SANS_SERIF, 10)
          .setJustification(hJustification)
          .setVerticalJustification(vJustification);

      // ==============================================================
      // draw information as notes for each composer
      // ==============================================================
      // only notes for the respective librettist-opera-pair
      // const keys = librettists.map((i) => librettistNoteMap[i - 1]);

      // represent each librettist-opera-pair as a colored quarter note
      const keys = librettist_opera_pairs.map(
        (p) => librettistNoteMap[p[0] - 1]
      );

      const durations = 8;
      const fillStyles = librettist_opera_pairs.map((p) =>
        librettistColorMap(p[0] - 1)
      );
      const strokeStyles = "#000000";

      // get all the notes
      // number of notes per composer is all their operas
      notes = [];
      for (let i = 0; i < time; i++) {
        notes.push(
          new StaveNote({
            keys: [keys[i]],
            duration: durations,
          })
            .setStyle({
              fillStyle: fillStyles[i],
              strokeStyle: fillStyles[i],
            })
            .addModifier(annotation(histogram[i], i + 1, textPosition), 0)
        );
      }
      for (let i = time; i < max_operas; i++) {
        notes.push(
          // or: new GhostNote({ duration: durations })
          new StaveNote({
            keys: ["b/4"],
            duration: durations + "r",
          }).setStyle({
            fillStyle: "lightgrey",
            strokeStyle: "lightgrey",
          })
        );
      }

      // TODO sort and connect the librettists with beams
      var beams = Beam.generateBeams(notes, { stem_direction: 1 });
      // var beams = Beam.generateBeams(notes, {
      //   groups: [new Fraction(time, 4)],
      // });
      Formatter.FormatAndDraw(context, stave, notes, false);
      beams.forEach(function (beam) {
        beam.setStyle({ fillStyle: fillStyles[0] }).setContext(context).draw();
      });
    }
  }
}

function beamed() {
  const stave = new Stave(10, 50, 350) //{ x: 10, y: 10, width: 350 })
    .addTimeSignature("3/8")
    .setContext(context)
    .draw();

  const notes = [
    { keys: ["b/4"], duration: "16" },
    { keys: ["a/4"], duration: "16" },
    // { keys: ["g/4"], duration: "16" },
    { keys: ["a/4"], duration: "8" },
    { keys: ["f/4"], duration: "8" },
    { keys: ["a/4"], duration: "8" },
    { keys: ["f/4"], duration: "8" },
    { keys: ["a/4"], duration: "8" },
    { keys: ["f/4"], duration: "8" },
    { keys: ["g/4"], duration: "8" },
  ];

  var stave_notes = notes.map(function (note) {
    return new StaveNote(note);
  });
  var beams = Beam.generateBeams(stave_notes, {
    groups: [new Fraction(3, 8)],
  });
  tuplet1 = new Tuplet(stave_notes.slice(0, 4));
  tuplet2 = new Tuplet(stave_notes.slice(4, 8));

  group = stave_notes.slice(0, 3);
  let beam1 = new Beam(group);
  let beam2 = new Beam(stave_notes.slice(3, 10));

  // 3/8 time
  // const voice = new Voice({ time: { num_beats: 3, beat_value: 8 } })
  //   .setStrict(true)
  //   .addTickables(stave_notes);

  // new Formatter().joinVoices([voice]).formatToStave([voice], stave);

  Formatter.FormatAndDraw(context, stave, stave_notes);
  // beam1.setContext(context).draw();
  // beam2.setContext(context).draw();
  tuplet1.setContext(context).draw();
  tuplet2.setContext(context).draw();
  // voice.draw(context, stave);
  beams.forEach(function (beam) {
    beam.setContext(context).draw();
  });
}

function drawExample() {
  let stave = new Stave(10, 50, 350)
    .addTimeSignature("3/8")
    .setContext(context)
    .draw();
  var notes = [
    // Beam
    { keys: ["b/4"], duration: "8", stem_direction: -1 },
    { keys: ["b/4"], duration: "8", stem_direction: -1 },
    { keys: ["b/4"], duration: "8", stem_direction: 1 },
    { keys: ["b/4"], duration: "8", stem_direction: 1 },
    { keys: ["d/6"], duration: "8", stem_direction: -1 },
    { keys: ["c/6", "d/6"], duration: "8", stem_direction: -1 },
    { keys: ["d/6", "e/6"], duration: "8", stem_direction: -1 },
  ];

  var stave_notes = notes.map(function (note) {
    return new StaveNote(note);
  });
  stave_notes[0].setStemStyle({ strokeStyle: "green" });
  stave_notes[1].setStemStyle({ strokeStyle: "orange" });
  stave_notes[1].setKeyStyle(0, { fillStyle: "chartreuse" });
  stave_notes[2].setStyle({ fillStyle: "tomato", strokeStyle: "tomato" });

  stave_notes[0].setKeyStyle(0, { fillStyle: "purple" });
  stave_notes[4].setLedgerLineStyle({ fillStyle: "red", strokeStyle: "red" });
  stave_notes[6].setFlagStyle({ fillStyle: "orange", strokeStyle: "orante" });

  //   var beam1 = new Beam([stave_notes[0], stave_notes[1]]);
  //   var beam2 = new Beam([stave_notes[2], stave_notes[3]]);
  //   var beam3 = new Beam(stave_notes.slice(4, 6));

  //   beam1.setStyle({
  //     fillStyle: "blue",
  //     strokeStyle: "blue",
  //   });

  //   beam2.setStyle({
  //     shadowBlur: 20,
  //     shadowColor: "blue",
  //   });

  var beams = Beam.generateBeams(stave_notes, {
    groups: [new Fraction(2, 4), new Fraction(1, 4)],
  });

  Formatter.FormatAndDraw(context, stave, stave_notes, false);
  // beam1.setContext(context).draw();
  // beam2.setContext(context).draw();
  // beam3.setContext(context).draw();

  beams.forEach(function (b) {
    b.setContext(context).draw();
  });
}

function drawCombined() {
  const stave1 = new Stave(150, 10, 300);
  const stave2 = new Stave(150, 100, 300);
  const stave3 = new Stave(150, 190, 300);
  const stave4 = new Stave(150, 280, 300);
  const stave5 = new Stave(150, 370, 300);
  const stave6 = new Stave(150, 460, 300);
  const stave7 = new Stave(150, 560, 300);
  stave1.setText("Violin", Modifier.Position.LEFT);
  stave1.setContext(context);
  stave2.setContext(context);
  stave3.setContext(context);
  stave4.setContext(context);
  stave5.setContext(context);
  stave6.setContext(context);
  stave7.setContext(context);
  const conn_single = new StaveConnector(stave1, stave7);
  const conn_double = new StaveConnector(stave2, stave3);
  const conn_bracket = new StaveConnector(stave4, stave7);
  const conn_none = new StaveConnector(stave4, stave5);
  const conn_brace = new StaveConnector(stave6, stave7);
  conn_single.setType(StaveConnector.type.SINGLE);
  conn_double.setType(StaveConnector.type.DOUBLE);
  conn_bracket.setType(StaveConnector.type.BRACKET);
  conn_brace.setType(StaveConnector.type.BRACE);
  conn_brace.setXShift(-5);
  conn_double.setText("Piano");
  conn_none.setText("Multiple", { shift_y: -15 });
  conn_none.setText("Line Text", { shift_y: 15 });
  conn_brace.setText("Harpsichord");
  conn_single.setContext(context);
  conn_double.setContext(context);
  conn_bracket.setContext(context);
  conn_none.setContext(context);
  conn_brace.setContext(context);
  stave1.draw();
  stave2.draw();
  stave3.draw();
  stave4.draw();
  stave5.draw();
  stave6.draw();
  stave7.draw();
  conn_single.draw();
  conn_double.draw();
  conn_bracket.draw();
  conn_none.draw();
  conn_brace.draw();
}

function main() {
  if (typeof inputcsv.files[0] == "undefined") {
    alert("No file uploaded yet!");
    return;
  }
  if (!loaded) {
    alert("File not loaded yet!");
    return;
  }

  // hide buttons
  inputcsv.style.display = "none";
  loadbutton.style.display = "none";
  drawbutton.style.display = "none";

  if (typeof dataset != "undefined" && dataset.length != 0) {
    data = prepareData(dataset);
    drawPartiture(data);
  }
  // drawPartiture(prepareData(loadData()));
}
beamed();
// drawCombined();
// drawExample();
