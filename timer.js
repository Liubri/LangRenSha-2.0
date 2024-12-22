let timerElement = document.querySelector(".timer");
const timerContainer = document.getElementById("time-container");
// if (!timerContainer) {
//     console.error("Timer container not found in the DOM.");
// }
let timerLength = 15;
let timerDelay = 1000; // 1 second
// function startTimer() {
//     let timeLeft = timerLength;
//     timerElement.textContent = timeLeft;
//     const countdown = setInterval(() => {
//         timeLeft--;
//         timerElement.textContent = timeLeft;

//         if (timeLeft <= 0) {
//             clearInterval(countdown);
//             timerElement.classList.add("hidden");
//         }
//     }, 1000);

//     // Add beat animation
//     const beatAnimation = `timerBeat 1s ${timerDelay - 125}ms ${timerLength} forwards`;
//     timerElement.style.animation = beatAnimation;
// }

// Start the timer after a 1-second delay

// socket.on("startTime", ()=> {
//     clearInterval(countdown);
//     setTimeout(startTimer, timerDelay);
//     timerElement.classList.remove("hidden");
// });
//
socket.on("startTime", (timeLeft) => {
  console.log(`Timer started with ${timeLeft} seconds`);
  timerElement.classList.remove("hidden");
  timerElement.classList.add("starting");
  timerElement.textContent = timeLeft;
  const beatAnimation = `timerBeat 1s ${
    timerDelay - 125
  }ms ${timerLength} forwards`;
  timerElement.style.animation = beatAnimation;
});

socket.on("updateTimer", (timeLeft) => {
  if (timeLeft >= 0) {
    timerElement.textContent = timeLeft;
  }
});
function resetTimerUI() {
  console.log("ClearTimeUI called");
  timerElement.textContent = ""; // Clear the timer text
  //timerElement.classList.add("hidden"); // Ensure the timer is visible
  timerElement.classList.remove("starting");
  timerElement.style.animation = "none"; // Reset any previous animations
  void timerElement.offsetWidth;
}

socket.on("resetTimerUI", () => {
  resetTimerUI();
});

function hideTimer() {
  timerElement.classList.add("hidden"); // Hide the timer using the 'hidden' class
  timerElement.classList.remove("starting")
  timerElement.textContent = ""; // Reset the content
  timerElement.style.animation = "none"; // Reset any previous animations
}

function showTimer() {
  // Reset the timer content before showing
  timerElement.classList.remove("hidden");
  timerElement.classList.add("starting");
}


function callClearAllIntervals() {
   console.log("ResetTimerCalled");
  socket.emit("clearrAllTime");
}