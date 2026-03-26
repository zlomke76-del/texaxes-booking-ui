export function injectStyles() {
  if (document.getElementById("tx-styles")) return;

  const style = document.createElement("style");
  style.id = "tx-styles";

  style.textContent = `
    .tx-card-choice {
      transition: all 0.2s ease;
    }

    .tx-card-choice:hover {
      transform: translateY(-2px) scale(1.01);
    }

    .tx-card-choice.is-selected {
      background: linear-gradient(
        135deg,
        rgba(255,122,89,0.18),
        rgba(255,122,89,0.08)
      );
      transform: scale(1.02);
      border-color: rgba(255,122,89,0.5);
    }

    .tx-card-sell {
      margin-top: 8px;
      font-size: 0.85rem;
      color: rgba(255,255,255,0.9);
    }
  `;

  document.head.appendChild(style);
}
