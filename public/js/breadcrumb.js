var parentSelector = document.getElementById('parentSelector');

function createNewSelect(parentId = null) {
  var newSelect = document.createElement('select');
  newSelect.setAttribute('name', 'finalParent');
  var defaultOption = document.createElement('option');
  defaultOption.setAttribute('value', parentId || '_');
  defaultOption.appendChild(document.createTextNode('Place Breadcrumb Here'));
  newSelect.appendChild(defaultOption);
  newSelect.addEventListener('change', async function (event) {
    while (event.target.nextSibling) {
      event.target.nextSibling.remove();
    }
    if (
      event.target.selectedIndex !== 0
    ) {
      event.target.removeAttribute('name');
      var newSelect = createNewSelect(event.target.value);
      parentSelector.appendChild(newSelect);
      var newOptions = [];
      var thisId = event.target.value || '_';
      newOptions = await getBreadcrumbOptions(thisId);
      newOptions.options &&
        newOptions.options.forEach(function (option) {
          var optionEl = document.createElement('option');
          optionEl.setAttribute('value', option._id);
          optionEl.appendChild(document.createTextNode(option.title));
          newSelect.appendChild(optionEl);
        });
    } else {
      event.target.setAttribute('name', 'finalParent');
    }
  });
  return newSelect;
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
  parentSelector.appendChild(firstSelect);
  var newOptions = [];
  newOptions = await getBreadcrumbOptions();
  newOptions.options &&
    newOptions.options.forEach(function (option) {
      var optionEl = document.createElement('option');
      optionEl.setAttribute('value', option._id);
      optionEl.appendChild(document.createTextNode(option.title));
      firstSelect.appendChild(optionEl);
    });
});
