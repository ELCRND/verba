import "./scss/main.scss";

import { Header } from "./js/Header";

new Header();

const swiper = new Swiper(".reviews__slider", {
  slidesPerView: 1,
  spaceBetween: 0,
  loop: true,

  navigation: {
    nextEl: ".reviews__slider-next",
    prevEl: ".reviews__slider-prev",
  },

  breakpoints: {
    // when window width is >= 720px
    720: {
      slidesPerView: 2,
      spaceBetween: 20,
    },

    1200: {
      slidesPerView: 3,
      spaceBetween: 40,
    },
  },
});
