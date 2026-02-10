import "./scss/prices.scss";

import { Header } from "./js/Header";

new Header();

const data = [
  {
    format: "A2, мел. 115г",
    items: [
      { quantity: 500, price40: 5000, price44: 8700 },
      { quantity: 1000, price40: 6700, price44: 10500 },
      { quantity: 3000, price40: 9000, price44: 18000 },
    ],
  },
  {
    format: "A3, мел. 115г",
    items: [
      { quantity: 500, price40: 3000, price44: 4700 },
      { quantity: 1000, price40: 3900, price44: 5700 },
      { quantity: 5000, price40: 7200, price44: 13500 },
      { quantity: 10000, price40: 18000, price44: 26000 },
    ],
  },
  {
    format: "A4, мел. 115г",
    items: [
      { quantity: 1000, price40: 3500, price44: 4000 },
      { quantity: 3000, price40: 6000, price44: 6900 },
      { quantity: 5000, price40: 9000, price44: 9500 },
      { quantity: 10000, price40: 14200, price44: 16000 },
    ],
  },
  {
    format: "A5, мел. 115г",
    items: [
      { quantity: 1000, price40: 3000, price44: 3600 },
      { quantity: 3000, price40: 4350, price44: 5100 },
      { quantity: 5000, price40: 5300, price44: 6500 },
      { quantity: 10000, price40: 8300, price44: 9500 },
    ],
  },
];

function generateTable() {
  let html = '<table class="pc-table">';
  html +=
    "<tr><th>Формат</th><th>Тираж</th><th>Стоимость 4+0</th><th>Стоимость 4+4</th></tr>";
  data.forEach((formatData, index) => {
    formatData.items.forEach((item, itemIndex) => {
      if (itemIndex === 0) {
        html += `<tr class="format-row"><td rowspan="${formatData.items.length}">${formatData.format}</td><td>${item.quantity} шт</td><td>${item.price40} рублей</td><td>${item.price44} рублей</td></tr>`;
      } else {
        html += `<tr><td>${item.quantity} шт</td><td>${item.price40} рублей</td><td>${item.price44} рублей</td></tr>`;
      }
    });
  });
  html += "</table>";
  return html;
}

function generateBlocks() {
  let html = "";
  data.forEach((formatData) => {
    html += '<div class="mobile-block">';
    html += "<h2>Формат</h2>";
    html += `<p>${formatData.format}</p>`;
    html += `<div class="${formatData.items.length > 3 ? "grid" : ""}"><h3>Стоимость 4+0</h3>`;
    formatData.items.forEach((item) => {
      html += `<p>${item.price40} рублей / ${item.quantity} штук</p>`;
    });
    html += "</div>";
    html += `<div class="${formatData.items.length > 3 ? "grid" : ""}"><h3>Стоимость 4+4</h3>`;
    formatData.items.forEach((item) => {
      html += `<p>${item.price44} рублей / ${item.quantity} штук</p>`;
    });
    html += "</div>";
    html += "</div>";
  });
  return html;
}

function renderLayout() {
  const container = document.getElementById("table-container");
  const width = window.innerWidth;
  if (width >= 1200) {
    container.innerHTML = generateTable();
  } else {
    container.innerHTML = generateBlocks();
  }
}

renderLayout();

window.addEventListener("resize", renderLayout);
