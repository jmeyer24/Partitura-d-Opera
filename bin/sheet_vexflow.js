// ========================================================================
// setup
// ========================================================================
const { Renderer, Stave, StaveNote, Voice, Beam, Formatter, TextNote } =
  Vex.Flow;

// ========================================================================
// meta-variables
// ========================================================================
const x = 10;
const y = 30; // 20
const staveDistance = 90; // 70
const staveWidth = window.innerWidth - 2 * x;

// ========================================================================
// save input file data in this variable
// ========================================================================
let dataset = [];
let data = [];

// ========================================================================
// Create an SVG renderer and attach it to the DIV element named "output".
// ========================================================================
const div = document.getElementById("output");
// div.width = window.innerWidth;
// div.height = window.innerHeight;
const input = document.getElementById("inputcsv");
let datjson = 0;
const renderer = new Renderer(div, Renderer.Backends.SVG);
renderer.resize(window.innerWidth, window.innerHeight);

// ========================================================================
// Configure the rendering context.
// ========================================================================
const context = renderer.getContext();

// ========================================================================
// add event listeners for the upload and draw buttons
// ========================================================================
document.getElementById("drawbutton").addEventListener("click", main);
document.onkeydown = function (e) {
  switch (e.keyCode) {
    case 68:
      main();
      break;
    case 85:
      document.getElementById("loadbutton").click();
      break;
    default:
      break;
  }
};

// ========================================================================
// read the uploaded data file and save its content in the variable dataset
// ========================================================================
function loadData() {
  if (typeof input.files[0] == "undefined") {
    alert("No file uploaded yet!");
  } else {
    Papa.parse(input.files[0], {
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
    // Create a stave at position x,y with window width (with some margin) on the canvas.
    const stave = new Stave(x, y + p * staveDistance, w);
    // Add a clef and time signature, connect it to the rendering context and draw!
    stave
      // .addClef("treble")
      // .addTimeSignature(`${time}/4`)
      .setContext(context)
      .draw();
    // draw the stave for the composer
    let old_s = stave;

    // ==============================================================
    // create a bar for each composer
    // ==============================================================
    for (let i = 0; i < dat["numComposers"]; i++) {
      // get all shows of a composer
      // and get all librettist a composer worked with
      let shows = [];
      let li = [];
      let op = [];
      for (let s = 0; s < dataset.length; s++) {
        let show = dataset[s];
        if (show["composerMap"] == i + 1) {
          shows.push(show);
          li.push(show["librettistMap"]);
          op.push(show["operaMap"]);
        }
      }
      li = new Set(li);
      op = new Set(op);
      li = Array.from(li).sort();
      op = Array.from(op).sort();

      // get numOperasOfComposer, a list of int for each composer
      // console.log(shows);
      // console.log(op);
      let time = op.length; //dat["numOperasOfComposer"];

      // TODO barwise
      // let s = new Stave(old_s.x + old_s.width, y + p * staveDistance, w);
      let s = new Stave(old_s.x, y + i * staveDistance, w);
      // i % 2 ? s.addClef("bass") : s.addClef("treble");
      s.addTimeSignature(`${time}/4`).setContext(context).draw();
      old_s = s;
      // }
      // let s = new Stave(x, y + i * staveDistance, staveWidth / numComposers);

      // draw the name of the composer
      let emptyText = new TextNote({
        // text: shows[0]["composer"],
        text: "",
        font: {
          family: "Arial",
          size: 12,
          weight: "",
        },
        duration: "4",
      })
        .setLine(2)
        .setStave(old_s);

      let text = new TextNote({
        text: shows[0]["composer"],
        // text: i,
        font: {
          family: "Arial",
          size: 12,
          weight: "",
        },
        duration: "4",
      })
        .setLine(9)
        .setStave(old_s);
      // .setJustification(TextNote.Justification.LEFT);

      // ==============================================================
      // draw information as notes for each composer
      // ==============================================================
      // Create the notes
      const voicelines = 1;
      const notes = [[]];
      // represent each librettist as a note
      const ks = [li.map((i) => librettistNoteMap[i - 1]), ["c/4"]];
      // console.log(li);
      // console.log(ks[0]);
      const ds = [4, "qr"];
      const fs = ["black", "red"];
      const ss = Array(2).fill("#000000");

      // fill the notes
      // j voicelines
      for (let j = 0; j < voicelines; j++) {
        notes[j] = [];
        // i notes per voiceline per bar
        for (let i = 0; i < time; i++) {
          notes[j].push(
            new StaveNote({
              // j (color- or other) specifics per voiceline
              keys: ks[j],
              duration: ds[j],
            }).setStyle({ fillStyle: fs[j], strokeStyle: ss[j] })
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
      // add text
      textes = Array(time).fill(emptyText);
      textes[0] = text;
      voices.push(
        new Voice({
          num_beats: time,
          beat_value: 4,
          resolution: Vex.Flow.RESOLUTION,
        }).addTickables(textes)
      );

      // Format and justify the notes to windowsize with some padding
      new Formatter().joinVoices(voices).format(voices, w - 20);

      // Render voices.
      voices.forEach(function (v) {
        v.draw(context, old_s);
      });
      text.setContext(context).draw();
    }
  }
}

function main() {
  loadData();
  // console.log(dataset);
  if (typeof dataset != "undefined" && dataset.length != 0) {
    data = prepareData(dataset);
    drawPartiture(data);
  }
  // drawPartiture(prepareData(loadData()));
}
