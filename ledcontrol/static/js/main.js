// led-control WS2812B LED Controller Server
// Copyright 2019 jackw01. Released under the MIT License (see LICENSE for details).

function handleInputChange(elem) {
  var key = elem.data('id');
  var val = parseFloat(elem.val(), 10);
  if (!elem.is('select')) { // Sliders or numbers
    var min = parseFloat(elem.attr('min'), 10);
    var max = parseFloat(elem.attr('max'), 10);
    if (val < min) val = min;
    if (val > max) val = max;
    if (elem.attr('type') == 'range') $('input[type=number][data-id=' + key + ']').val(val);
    else $('input[type=range][data-id=' + key + ']').val(val);
    return { key: key, value: val };
  }
  if (key === 'primary_pattern') { // On pattern change
    codeMirror.setValue(sources[getCurrentPatternKey()].trim());
    return { key: key, value: Object.keys(sources)[val] };
  }
}

function handleParamAdjust() {
  handleInputChange($(this));
}

function handleParamUpdate() {
  var newVal = handleInputChange($(this));
  $.getJSON('/setparam', newVal, function() {});
}

function handleColorUpdate() {
  var elem = $(this);
  var idx = elem.data('idx');
  var cmp = elem.data('cmp');
  var val = parseFloat(elem.val(), 10);
  var min = parseFloat(elem.attr('min'), 10);
  var max = parseFloat(elem.attr('max'), 10);
  if (val < min || val > max) return;
  $.getJSON('/setcolor', { index: idx, component: cmp, value: val, }, function() {});
}

function updateSourceStatus() {
  $('#source-status').text(status);
  statusClasses.forEach(function (c) {
    if (statusClass === c) $('#source-status').addClass('status-' + c);
    else $('#source-status').removeClass('status-' + c);
  });
}

function handleNewPattern() {

}

function handleCompile() {
  $.getJSON('/compilepattern', {
    key: getCurrentPatternKey(),
    source: codeMirror.getValue(),
  }, function(result) {
      console.log('Compile errors/warnings:', result.errors, result.warnings);
      if (result.errors.length === 0 && result.warnings.length === 0) {
        statusClass = 'success';
        status = 'Pattern compiled successfully';
      } else if (result.errors.length === 0 && result.warnings.length > 0) {
        statusClass = 'warning';
        status = 'Pattern generated warnings: ' + result.warnings.join(', ');
      } else if (result.errors.length > 0) {
        statusClass = 'error';
        status = result.errors.join(', ');
      }
      updateSourceStatus();
  });
}

function getCurrentPatternKey() {
  var currentIndex = parseInt($('select[data-id="primary_pattern"]').val(), 10);
  return Object.keys(sources)[currentIndex];
}

var codeMirror, sources;
var statusClasses = ['none', 'success', 'warning', 'error'];
var statusClass = 'none';
var status = 'Pattern not compiled yet';

window.onload = function() {
  $('input[type=range].update-on-change').on('mousemove touchmove', handleParamAdjust);
  $('.update-on-change').on('change', handleParamUpdate);
  $('.update-color-on-change').on('change mousemove touchmove', handleColorUpdate);
  $('#new-pattern').on('click', handleNewPattern);
  $('#compile').on('click', handleCompile);

  $.getJSON('/getpatternsources', {}, function (result) {
    console.log('Sources:', result.sources);
    // Set selected pattern to correct value
    sources = result.sources;
    $('select[data-id="primary_pattern"]').val(Object.keys(sources).indexOf(result.current));

    // Update compile status display
    updateSourceStatus();

    // Display code for starting pattern
    codeMirror = CodeMirror(document.getElementById('code'), {
      value: sources[result.current].trim(),
      mode: 'python',
      indentUnit: 4,
      lineNumbers: true,
      theme: 'summer-night',
    });
  });
};
