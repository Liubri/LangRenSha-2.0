let voterMap = new Map();
let groupedVotesMap = new Map();
// groupedVotesMap.set(1, {
//   target: { name: "Player A" },
//   voters: ["Voter 1", "Voter 2"],
// });
// groupedVotesMap.set(2, {
//   target: { name: "Player B" },
//   voters: ["Voter 3", "Voter 4", "Voter 5"],
// });
// groupedVotesMap.set(0, {
//   target: { name: "Skipped" },
//   voters: ["Voter 6"],
// });
// groupedVotesMap.set(3, {
//   target: { name: "Player C" },
//   voters: ["Voter 7", "Voter 8"],
// });
// renderGroupedVotes(groupedVotesMap);
socket.on("sendVoteMap", (voteMap) => {
  // Populate voterMap with the received data
  groupedVotesMap = new Map(Object.entries(voteMap));
  console.log("Received voterMap:", groupedVotesMap);
  console.log("VoteMap Size: ", groupedVotesMap.size);
  console.log("Grouped Votes Map:", groupedVotesMap);
});

socket.on("renderVoteResults", () => {
  const votingResultsModal = document.getElementById("voting-results");
  votingResultsModal.classList.remove("hide");
  votingResultsModal.classList.add("fade-in");
  renderGroupedVotes(groupedVotesMap);
  setTimeout(closeVotingResultsModal, 5000);
});

function closeVotingResultsModal() {
  const votingResultsModal = document.getElementById("voting-results");
  votingResultsModal.classList.add("fade-out"); // Add fade-out class

  // Wait for the animation to finish before hiding the modal
  votingResultsModal.addEventListener(
    "animationend",
    () => {
      votingResultsModal.classList.remove("fade-out"); // Remove fade-out class
      votingResultsModal.classList.add("hide"); // Add hide class to hide the modal
    },
    { once: true }
  ); // Use { once: true } to ensure the event listener is removed after it runs
}

// Function to render grouped votes (optional)
function renderGroupedVotes(groupedVotesMap) {
  const skippedVotes = [];
  const votingResults = [];
  const groupedVotesContainer = document.getElementById("grouped-votes");
  const skippedVotesContainer = document.getElementById("skipped-votes");

  // Clear previous content
  groupedVotesContainer.innerHTML = "";
  skippedVotesContainer.innerHTML = ""; // Clear skipped votes content

  // Group votes and separate skipped votes
  for (const [targetId, { target, voters }] of groupedVotesMap) {
    console.log("TargetId: ", targetId);
    if (targetId == 0) {
      // If the targetId is 0, treat it as a skipped vote
      skippedVotes.push(...voters);
      console.log("SkippedVotes: ", skippedVotes);
    } else {
      // Otherwise, create a div for grouped votes
      votingResults.push(...voters);
      const groupDiv = document.createElement("div");
      groupDiv.className = "vote-group";

      const title = document.createElement("h3");
      title.textContent = `Votes for ${target.name} (${voters.length})`;
      groupDiv.appendChild(title);

      voters.forEach((voter) => {
        const voterDiv = document.createElement("div");
        voterDiv.className = "vote-item";
        voterDiv.textContent = voter;
        groupDiv.appendChild(voterDiv);
      });

      groupedVotesContainer.appendChild(groupDiv);
    }
  }

  // Render skipped votes
  if (skippedVotes.length > 0) {
    skippedVotesContainer.classList.remove("hidden"); // Make sure skipped votes section is visible
    const title = document.createElement("h3");
    title.textContent = `Skipped Votes (${skippedVotes.length})`;
    skippedVotesContainer.appendChild(title);

    skippedVotes.forEach((voter) => {
      const skipItem = document.createElement("div");
      skipItem.className = "skipped-item";
      skipItem.textContent = voter;
      skippedVotesContainer.appendChild(skipItem);
    });
  }

  // Update the summary
  const summary = document.querySelector(".summary");
  summary.textContent = `Total Votes: ${votingResults.length} • Skipped: ${skippedVotes.length}`;
}