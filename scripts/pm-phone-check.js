export function phoneCheck() {
  return new Promise((resolve) => {
    document.querySelector("#phone-modal").showModal();
    document.querySelector("#browser-confirm").addEventListener("click", () => {
      resolve(false);
    });
    document.querySelector("#phone-confirm").addEventListener("click", () => {
      resolve(true);
    });
  });
}
