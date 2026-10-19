import { Reveal } from "skele";

const container = document.getElementById("skele-card")!;
container.style.display = "flex";
container.style.flexDirection = "column";
container.style.justifyContent = "center";
container.style.alignItems = "center";
container.style.gap = "24px";
container.style.height = "100vh";
container.style.fontFamily = "system-ui";

const stage = document.createElement("div");
const button = document.createElement("button");
button.textContent = "Reload";
container.append(stage, button);

const reveal = new Reveal(stage, { id: "profile" });

function card(name = "", role = "") {
  const element = document.createElement("div");
  element.style.cssText =
    "display: flex; gap: 12px; align-items: center; padding: 16px; border-radius: 12px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.2)";
  const avatar = document.createElement("div");
  avatar.style.cssText =
    "width: 40px; height: 40px; border-radius: 50%; background: #ddd";
  const text = document.createElement("div");
  text.innerHTML = `<div style="font-weight: 600">${name}</div><div style="color: #666">${role}</div>`;
  element.append(avatar, text);
  return element;
}

function reload() {
  // Drawn from sample content the first time, from the last card shown after that
  reveal.load(card("Xxxxxx Xxxx", "Xxxxxx xxxxxxxx"));

  setTimeout(() => reveal.show(card("Lochie Axon", "Design engineer")), 1500);
}

button.addEventListener("click", reload);
reload();
