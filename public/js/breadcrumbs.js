class Breadcrumbs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    var breadcrumbSelector = document.createElement('div');
    breadcrumbSelector.setAttribute('style', 'display: inline;');
    breadcrumbSelector.appendChild(this.createNewSelect('_'));
    this.shadowRoot.appendChild(breadcrumbSelector);
    this.initBreadcrumbsArr = [];
    if (this.hasAttribute('initial-breadcrumbs')) {
      this.initBreadcrumbsArr = this.getAttribute('initial-breadcrumbs').split(
        ','
      );
    }
    this.breadcrumbsString = '';
    this.updateEvent = new CustomEvent('updateInput', {
      bubbles: true,
      cancelable: false
    });
    if (!this.hasAttribute('withDefault')) {
      var addToBreadcrumbsBtn = document.createElement('button');
      addToBreadcrumbsBtn.appendChild(document.createTextNode('>'));
      addToBreadcrumbsBtn.setAttribute(
        'style',
        'display: inline; margin-left: 0.25rem;'
      );
      addToBreadcrumbsBtn.addEventListener(
        'click',
        this.addToBreadcrumbs.bind(this)
      );
      this.shadowRoot.appendChild(addToBreadcrumbsBtn);
    }
  }

  addToBreadcrumbs() {
    var id = this.shadowRoot.firstChild.lastChild.value;
    this.shadowRoot.firstChild.appendChild(this.createNewSelect(id));
  }

  createNewSelect(parentId) {
    var newSelect = document.createElement('select');
    if (this.hasAttribute('withDefault')) {
      var defaultOption = document.createElement('option');
      defaultOption.setAttribute('value', parentId || '_');
      defaultOption.appendChild(
        document.createTextNode('Place Breadcrumb Here')
      );
      newSelect.appendChild(defaultOption);
    }

    newSelect.addEventListener('change', async function (event) {
      while (this.nextSibling) {
        this.nextSibling.remove();
      }
      if (this.getRootNode().host.hasAttribute('withDefault')) {
        if (event.target.selectedIndex !== 0) {
          this.getRootNode().childNodes[0].appendChild(
            this.getRootNode().host.createNewSelect(newSelect.value)
          );
        }
      }
      this.getRootNode().host._setBreadcrumbArr();
    });
    newSelect.setAttribute('style', 'display: none;');
    this._createNewOptions(newSelect, parentId);
    return newSelect;
  }

  async _createNewOptions(thisSelect, lastSelectValue) {
    var newOptions = await this._getBreadcrumbOptions(
      thisSelect.value || lastSelectValue || '_'
    );
    if (newOptions.options) {
      var that = this;
      var autoInputIndex = null;
      newOptions.options.forEach(function (option, index) {
        var optionEl = document.createElement('option');
        optionEl.setAttribute('value', option._id);
        optionEl.appendChild(document.createTextNode(option.title));
        thisSelect.appendChild(optionEl);
        thisSelect.removeAttribute('style');
        if (
          that.initBreadcrumbsArr.length &&
          that.initBreadcrumbsArr[0] === option._id
        ) {
          autoInputIndex = index;
          that.initBreadcrumbsArr.shift();
        }
      });
      thisSelect.selectedIndex = autoInputIndex;
    } else {
      if (!this.hasAttribute('withDefault')) {
        thisSelect.remove();
      } else {
        thisSelect.removeAttribute('style');
      }
    }
    this._setBreadcrumbArr();
    if (autoInputIndex !== null && this.initBreadcrumbsArr.length) {
      this.addToBreadcrumbs();
    }
  }

  async _getBreadcrumbOptions(parent = '_') {
    var response = await fetch(`/breadcrumbOptions/${parent}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  _setBreadcrumbArr() {
    this.breadcrumbsString = '';
    var breadcrumbsArr = [];
    this.shadowRoot.firstChild.childNodes.forEach(function (selectEl) {
      breadcrumbsArr.push(selectEl.value);
    });
    this.breadcrumbsString = breadcrumbsArr.join(',');
    this.dispatchEvent(this.updateEvent);
  }

  get breadcrumbsValue() {
    if (this.hasAttribute('withDefault')) {
      var finalbreadcrumb = this.breadcrumbsString.split(',');
      finalbreadcrumb = finalbreadcrumb[finalbreadcrumb.length - 1];
      return finalbreadcrumb;
    } else {
      return this.breadcrumbsString;
    }
  }
}

window.customElements.define('breadcrumbs-selector', Breadcrumbs);
