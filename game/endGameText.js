const villagersMessage = document.getElementsByClassName("villagers-win")[0];
const resetButton = document.getElementById("resetButton");
socket.on("winMessage", () => {
  requestAnimationFrame(() => {
    setTimeout(() => {
      villagersMessage.classList.remove("hidden");
      resetButton.classList.remove("hidden");
      toggleBlur();
    }, 1000);
  });
});

const wolfMessage = document.getElementsByClassName("werewolves-win")[0];
socket.on("evilMessage", () => {
  requestAnimationFrame(() => {
    setTimeout(() => {
      wolfMessage.classList.remove("hidden");
      resetButton.classList.remove("hidden");
      toggleBlur();
    }, 1000);
  });
});

const jesterMessage = document.getElementsByClassName("jester-win")[0];
socket.on("jesterWins", () => {
  requestAnimationFrame(() => {
    setTimeout(() => {
      jesterMessage.classList.remove("hidden");
      resetButton.classList.remove("hidden");
      toggleBlur();
    }, 1000);
  });
});
let blurToggled = false;
// Method 1: Toggle class on the body
function toggleBlur() {
  if (!blurToggled) {
    blurToggled = true;
    document.body.classList.toggle("blur-everything");
    console.log("Blur toggled");
  }
}
function removeBlur() {
  if (document.body.classList.contains('blur-everything')) {
    document.body.classList.remove('blur-everything');
    console.log("Blur removed");
  }
}

socket.on("removeEndGameMessage", () => {
  removeBlur();
  villagersMessage.classList.add("hidden");
  wolfMessage.classList.add("hidden");
  jesterMessage.classList.add("hidden");
  resetButton.classList.add("hidden");
})

const style = document.createElement("style");
style.textContent = `
.blur-everything > *:not(.no-blur) {
   animation: blurAnimation 1.5s ease-in-out 1 forwards;
 }
@keyframes blurAnimation {
0% {
filter: blur(1px);
}
40% {
filter: blur(3px);
}
90% {
filter: blur(5px);
}
100% {
filter: blur(10px);
}
}
 `;
document.head.appendChild(style);
