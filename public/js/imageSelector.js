class ImageSelector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.pageNumber = 1;
    this.totalPages = 0;
    this.selectedImages = [];
    this.selectEvent = new CustomEvent('imgSelect', {
      bubbles: true,
      cancelable: false
    });
    this.shadowRoot.innerHTML = `
      <style>
        #imageSelector {
          position: relative;
          width: 100%;
          height: 22rem;
          margin: 1rem 0;
          border: 1px solid black;
          box-sizing: border-box;
        }
        #imagesContainer {
          width: 100%;
          height: 100%;
          display: flex;
          flex-flow: row wrap;
          padding-bottom: 2rem;
          box-sizing: border-box;
          overflow-y: scroll;
        }
        #pageController {
          position: absolute;
          margin: 0 0.25rem;
          padding: 0.25rem;
          bottom: 0;
          right: 1rem;
          background-color: white;
        }
        #pageNumDisplay {
          width: 2rem;
        }
        .image-container__main {
          padding: 0.25rem;
          margin: 0.25rem;
          border: 1px solid black;
          box-sizing: border-box;
          cursor: pointer;
        }
        .image-selector__img {
          height: 10rem;
        }
        .image-selector__img-id {
          font-size: 0.75rem;
          text-align: center;
        }
        .img-selected {
          background-color: lightgrey;
        }
        .img-selected > img {
          opacity: 0.5;
        }
      </style>
      <div id="imageSelector">
      <div id="imagesContainer"></div>
      <div id="pageController">
        <button id="pageFirst"><<</button>
        <button id="pageBack"><</button>
        <span id="pageNumDisplay"></span>
        <button id="pageNext">></button>
        <button id="pageLast">>></button>
      </div>
      </div>
    `;
    var pageFirst = this.shadowRoot.getElementById('pageFirst');
    var pageBack = this.shadowRoot.getElementById('pageBack');
    var pageNext = this.shadowRoot.getElementById('pageNext');
    var pageLast = this.shadowRoot.getElementById('pageLast');
    pageFirst.addEventListener(
      'click',
      this._updatePageNumber.bind(this, 'first')
    );
    pageBack.addEventListener(
      'click',
      this._updatePageNumber.bind(this, 'back')
    );
    pageNext.addEventListener(
      'click',
      this._updatePageNumber.bind(this, 'next')
    );
    pageLast.addEventListener(
      'click',
      this._updatePageNumber.bind(this, 'last')
    );
    if (this.hasAttribute('start-ids') && this.getAttribute('start-ids').length) {
      var startIds = this.getAttribute('start-ids').split(',');
      for (var id of startIds) {
        this.selectedImages.push(id);
      }
      this.dispatchEvent(this.selectEvent);
    }
  }

  attributeChangedCallback() {
    if (this.hasAttribute('image-type')) {
      this._updateDisplay();
    }
  }

  static get observedAttributes() {
    return ['image-type'];
  }

  get selectedImagesArr() {
    return this.selectedImages;
  }

  manageIds(id, container) {
    var idIndex = this.selectedImages.findIndex(function (selectedId) {
      return selectedId === id;
    });
    container.classList.toggle('img-selected');
    if (idIndex === -1) {
      this.selectedImages.push(id);
    } else {
      this.selectedImages.splice(idIndex, 1);
    }
    this.dispatchEvent(this.selectEvent);
  }

  _updatePageNumber(pageDirection) {
    switch (pageDirection) {
      case 'first':
        if (this.pageNumber !== 1) {
          this.pageNumber = 1;
        }
        break;
      case 'back':
        if (this.pageNumber > 1) {
          this.pageNumber--;
        }
        break;
      case 'next':
        if (this.pageNumber < this.totalPages) {
          this.pageNumber++;
        }
        break;
      case 'last':
        if (this.pageNumber !== this.totalPages) {
          this.pageNumber = this.totalPages;
        }
        break;
      default:
        break;
    }
    this._updateDisplay();
  }

  _updateDisplay() {
    var imagesContainer = this.shadowRoot.getElementById('imagesContainer');
    var pageNumDisplay = this.shadowRoot.getElementById('pageNumDisplay');
    this._getImageIds(this.getAttribute('image-type'), this.pageNumber)
      .then(result => {
        this.totalPages = result.totalCount;
        if (pageNumDisplay.hasChildNodes()) {
          pageNumDisplay.removeChild(pageNumDisplay.childNodes[0]);
        }
        pageNumDisplay.appendChild(
          document.createTextNode(`${this.pageNumber} / ${this.totalPages}`)
        );
        if (imagesContainer.hasChildNodes()) {
          while (imagesContainer.hasChildNodes()) {
            imagesContainer.removeChild(imagesContainer.firstChild);
          }
        }
        for (var id of result.images) {
          var imageContainer = document.createElement('div');
          imageContainer.setAttribute('class', 'image-container__main');
          imageContainer.addEventListener(
            'click',
            this.manageIds.bind(this, id._id, imageContainer)
          );
          if (this.selectedImages.includes(id._id)) {
            imageContainer.classList.add('img-selected');
          }
          var img = document.createElement('img');
          var paragraph = document.createElement('p');
          paragraph.setAttribute('class', 'image-selector__img-id');
          paragraph.appendChild(document.createTextNode(id._id));
          img.setAttribute('class', 'image-selector__img');
          img.setAttribute('src', `/images/_/${id._id}`);
          img.setAttribute('alt', id._id);
          imageContainer.appendChild(img);
          imageContainer.appendChild(paragraph);
          imagesContainer.appendChild(imageContainer);
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  async _getImageIds(imagetype, pageNumber) {
    var response = await fetch(`/imageLookup/${imagetype}/${pageNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
}

window.customElements.define('image-selector', ImageSelector);
