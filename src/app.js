class App {
  constructor () {
    this.state = {
    };

    document.getElementById('menu-box').style.display = 'block';

    function hideAllContainers() {
      [].forEach.call(
        document.querySelectorAll('.container'),
        el => el.style.display = 'none'
      );
    }

    [].forEach.call(
      document.querySelectorAll('.container-select'),
      el => {
        el.addEventListener('click', evt => {
          hideAllContainers();
          const boxId = evt.target.id.split('-')[1];
          const box = document.getElementById(boxId + '-box');
          box.style.display = 'block';
        });
      }
    );
    document.getElementById('menu-box').style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => new App());
