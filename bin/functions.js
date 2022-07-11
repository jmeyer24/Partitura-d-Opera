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

// ==============================================================
// Helper function to get the last name of the composer
// ==============================================================
function getLastName(composerName) {
  return (composerName = composerName.slice(
    0,
    composerName.indexOf(",") < composerName.indexOf(" ")
      ? composerName.indexOf(",")
      : composerName.indexOf(" ")
  ));
}

// ==============================================================
// Helper function to get pairs from lists of composer info
// ==============================================================
function createPairs(list1, list2) {
  pairs = [];
  histogram = [];
  list1.forEach(function (value, idx) {
    // new pair
    pair = [value, list2[idx]];
    // if none of the current pairs matches the new pair
    if (!pairs.some((p) => p.equals(pair))) {
      // add new pair
      pairs.push(pair);
      histogram.push(1);
    } else {
      histogram[histogram.length - 1]++;
    }
  });
  let descendingOrderPermutation = getSortIndices(histogram).reverse();
  pairs = descendingOrderPermutation.map((i) => pairs[i]);
  histogram = descendingOrderPermutation.map((i) => histogram[i]);

  // get unique lists in sorted fashion
  return [
    pairs,
    histogram,
    [...new Set(list1)].sort(),
    [...new Set(list2)].sort(),
  ];
}

// ==============================================================
// Helper function to get information list from shows
// ==============================================================
function getInformation(data, dataKey, unique = false, sortByNum = false, sortByData = data) {
  var list = [];
  if (dataKey == "") {
    return data;
  } else {
    data.forEach((singleData) => list.push(singleData[dataKey]));
  }

  if (unique) {
    if (sortByNum) {
      list = [...new Set(list)].sort((a, b) => {
        return (
          sortByData.filter((singleData) => singleData[dataKey] === b).length -
          sortByData.filter((singleData) => singleData[dataKey] === a).length
        );
      });
    } else {
      list = [...new Set(list)].sort();
    }
  }

  return list;
}

export { getSortIndices, getLastName, createPairs, getInformation };
