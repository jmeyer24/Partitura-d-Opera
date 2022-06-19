// ========================================================================
// setup
// ========================================================================
const {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Beam,
  Formatter,
  TextNote,
  StaveConnector,
  Modifier,
} = Vex.Flow;

// ========================================================================
// meta-variables
// ========================================================================
const x = 130;
const y = 0; // 20
const staveDistance = 90; // 70
const staveWidth = window.innerWidth - 1.25 * x;

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
    numOperasOfComposer: 3, // TODO
  };
  return dat;
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

      // get librettist opera pairs
      librettist_opera_pairs = [];
      librettists.forEach(function (lib, idx) {
        librettist_opera_pairs.push((lib, operas[idx]));
      });
      // console.log(new Set(librettist_opera_pairs));
      librettist_opera_pairs = [...new Set(librettist_opera_pairs)].sort();
      // console.log(librettist_opera_pairs);

      // get unique and sort
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
      // draw information as notes for each composer
      // ==============================================================
      // Create the notes
      const voicelines = 1;
      const notes = [[]];
      // represent each librettist as a note
      // all notes as a chord
      const keys = [librettists.map((i) => librettistNoteMap[i - 1]), ["c/4"]];
      // only notes for the respective librettist-opera-pair
      // librettist_opera_pairs.forEach(function (lop) {
      //   if (lop[0] == i + 1) {
      //     librettists.push(show["librettistMap"]);
      //     operas.push(show["operaMap"]);
      //   }
      // });
      // const keys = [
      //   librettist_opera_pairs.map((i) => librettistNoteMap[i - 1]),
      //   ["c/4"],
      // ];
      const durations = [4, "qr"];
      const fillStyles = ["black", "red"];
      const strokeStyles = Array(2).fill("#000000");

      // fill the notes
      // j voicelines, with the specifics e.g. keys[j]
      for (let j = 0; j < voicelines; j++) {
        notes[j] = [];
        // i notes per voiceline per bar
        for (let i = 0; i < time; i++) {
          notes[j].push(
            new StaveNote({
              keys: keys[j], // keys[j][i]
              duration: durations[j],
            }).setStyle({
              fillStyle: fillStyles[j],
              strokeStyle: strokeStyles[j],
            })
          );
        }
      }

      // Create a voice in time/4 and add above notes
      const voices = [];
      for (let j = 0; j < voicelines; j++) {
        voices.push(
          new Voice({
            num_beats: time,
            beat_value: 4,
          }).addTickables(notes[j])
        );
      }

      // Format and justify the notes to windowsize with some padding
      new Formatter().joinVoices(voices).format(voices, w - 20);

      // Render voices.
      voices.forEach(function (v) {
        v.draw(context, old_s);
      });
    }
  }
}

function drawCombined() {
  // const context = contextBuilder(options.elementId, 550, 700);
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
    // drawCombined();
  }
  // drawPartiture(prepareData(loadData()));
}
