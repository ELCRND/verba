export class Header {
  constructor() {
    this.MENU = document.querySelector(".header__menu");
    this.OPEN_BTN = document.querySelector(".header__open");

    this.init();
  }

  init() {
    this.on();
  }

  on() {
    this.OPEN_BTN.addEventListener("click", () => {
      this.MENU.classList.toggle("header__menu--active");
      this.OPEN_BTN.classList.toggle("header__open--active");
    });
  }
}
