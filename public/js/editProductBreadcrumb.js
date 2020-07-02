var breadcrumbSelector = document.getElementById('breadcrumbSelector');
var addToBreadcrumbsButton = document.getElementById('addToBreadcrumbs');
var breadcrumbsInput = document.getElementById('breadcrumbs');
var initialBreadCrumbs = document.getElementById('initialBreadcrumbs').value;
if (initialBreadCrumbs) initialBreadCrumbs = initialBreadCrumbs.split(',');
var createNewSelectEvent = new Event('createNewSelect');

function createNewSelect() {
  var newSelect = document.createElement('select');
  newSelect.addEventListener('change', function (event) {
    while (event.target.nextSibling) {
      event.target.nextSibling.remove();
    }
    getbreadcrumbsString();
  });
  newSelect.addEventListener('createNewSelect', async function (event) {
    var newOptions = [];
    var thisId = event.target.value || '_';
    newOptions = await getBreadcrumbOptions(thisId);
    var initialAutoInput = [null, false];
    if (newOptions.options) {
      var newSelect = createNewSelect(event.target.value);
      breadcrumbSelector.appendChild(newSelect);
      newOptions.options.forEach(function (option, index) {
        var optionEl = document.createElement('option');
        optionEl.setAttribute('value', option._id);
        optionEl.appendChild(document.createTextNode(option.title));
        newSelect.appendChild(optionEl);
        if (initialBreadCrumbs && initialBreadCrumbs[0] === option._id) {
          initialAutoInput = [index, true];
          initialBreadCrumbs.shift();
        }
      });
    }
    if (initialAutoInput[1]) {
      newSelect.selectedIndex = initialAutoInput[0];
      breadcrumbSelector.lastChild.dispatchEvent(createNewSelectEvent);
    }
    getbreadcrumbsString();
  });
  return newSelect;
}

function getbreadcrumbsString() {
  breadcrumbsInput.value = '';
  var breadcrumbsArr = [];
  breadcrumbSelector.childNodes.forEach(function (selectEl) {
    breadcrumbsArr.push(selectEl.value);
  });
  breadcrumbsInput.value = breadcrumbsArr.join(',');
}

async function getBreadcrumbOptions(parent = '_') {
  var response = await fetch(`/breadcrumbOptions/${parent}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

window.addEventListener('load', async function () {
  var firstSelect = createNewSelect();
  breadcrumbSelector.appendChild(firstSelect);
  var newOptions = [];
  newOptions = await getBreadcrumbOptions();
  var initialAutoInput = [null, false];
  newOptions.options &&
    newOptions.options.forEach(function (option, index) {
      var optionEl = document.createElement('option');
      optionEl.setAttribute('value', option._id);
      optionEl.appendChild(document.createTextNode(option.title));
      firstSelect.appendChild(optionEl);
      if (initialBreadCrumbs && initialBreadCrumbs[0] === option._id) {
        initialAutoInput = [index, true];
        initialBreadCrumbs.shift();
      }
    });
  if (initialAutoInput[1]) {
    firstSelect.selectedIndex = initialAutoInput[0];
    breadcrumbSelector.lastChild.dispatchEvent(createNewSelectEvent);
  }
  getbreadcrumbsString();
  addToBreadcrumbsButton.addEventListener('click', function () {
    breadcrumbSelector.lastChild.dispatchEvent(createNewSelectEvent);
  });
});
