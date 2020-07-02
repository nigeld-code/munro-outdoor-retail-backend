var breadcrumbSelector = document.getElementById('breadcrumbSelector');
var addToBreadcrumbsButton = document.getElementById('addToBreadcrumbs');
var breadcrumbsInput = document.getElementById('breadcrumbs');
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
    if (newOptions.options) {
      var newSelect = createNewSelect(event.target.value);
      breadcrumbSelector.appendChild(newSelect);
      newOptions.options.forEach(function (option) {
        var optionEl = document.createElement('option');
        optionEl.setAttribute('value', option._id);
        optionEl.appendChild(document.createTextNode(option.title));
        newSelect.appendChild(optionEl);
      });
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
  newOptions.options &&
    newOptions.options.forEach(function (option) {
      var optionEl = document.createElement('option');
      optionEl.setAttribute('value', option._id);
      optionEl.appendChild(document.createTextNode(option.title));
      firstSelect.appendChild(optionEl);
    });
  getbreadcrumbsString();
  addToBreadcrumbsButton.addEventListener('click', function () {
    breadcrumbSelector.lastChild.dispatchEvent(createNewSelectEvent);
  });
});
