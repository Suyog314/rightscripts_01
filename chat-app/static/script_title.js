

const sectionNames = [
  "Enter Video Title here",
  "Enter Video Introduction here",
  "Enter Video Objectives here",
  "Enter Video Content here",
  "Enter Video Reflections here",
  "Enter Video Summary here",
  "Video Finalization here"
];

let storedData = {}; 
document.addEventListener("DOMContentLoaded", function () {
    const sidebarButtons = document.querySelectorAll(".sidebar-btn");
    const textArea = document.querySelector(".content textarea");
    const nextBtn = document.querySelector(".Next");
    const prevBtn = document.querySelector(".Previous");
    const heading = document.querySelector(".content h2");
    const countDisplay = document.getElementById("count");
    const finalizationContent = document.getElementById("finalization-content");
    const finalizationButtons = document.querySelector(".finalization-buttons");


    let currentIndex = 0; 
    let completedSections = Array(sectionNames.length).fill(false);

    function updateSection(index) {
        // Save the current section's text before switching
        storedData[sectionNames[currentIndex]] = textArea.value;

        // Load saved text
        textArea.value = storedData[sectionNames[index]] || "";

        heading.textContent = sectionNames[index];  
        countDisplay.textContent = `${index + 1}/7`;

        // Update sidebar button styles
        sidebarButtons.forEach((btn, idx) => {
            btn.style.background = idx < index ? "green" : idx === index ? "blue" : "white";
            btn.style.color = idx <= index ? "white" : "black";
        });

        // Handle Finalization section
        if (index === sectionNames.length - 1) {  
            finalizationContent.classList.add("finalization-active");
            finalizationButtons.style.display = "flex"; // Show buttons
            
            // Generate a formatted preview of all sections
            let previewText = "";
            for (let i = 0; i < sectionNames.length - 1; i++) {
                previewText += `${sectionNames[i].replace("Enter ", "").replace(" here", "")}:\n${storedData[sectionNames[i]] || "Not provided"}\n\n`;
            }
            textArea.value = previewText; 
            textArea.readOnly = false; // Allow editing

        } else {
            finalizationContent.classList.remove("finalization-active");
            finalizationButtons.style.display = "none"; // Hide buttons
            textArea.readOnly = false; // Normal editing
        }

        currentIndex = index;
    }

    nextBtn.addEventListener("click", function () {
        if (textArea.value.trim() === "") {
            alert("Please complete this section before moving forward.");
            return;
        }
        completedSections[currentIndex] = true;
        if (currentIndex < sectionNames.length - 1) {
            updateSection(currentIndex + 1);
        }
    });

    prevBtn.addEventListener("click", function () {
        if (currentIndex > 0) {
            updateSection(currentIndex - 1);
        }
    });

    sidebarButtons.forEach((btn, index) => {
        btn.addEventListener("click", function () {
            if (completedSections[index] || index === 0) {
                updateSection(index);
            } else {
                alert("You must complete the previous sections before accessing this one.");
            }
        });
    });

    updateSection(0);
});


// -------------------- Download & Preview Buttons --------------------

document.getElementById("download-btn").addEventListener("click", function () {
  const { jsPDF } = window.jspdf;
  const textArea = document.querySelector("#finalization-content textarea");

  const content = textArea.value.trim();
  if (!content) {
      alert("No content to download.");
      return;
  }

  // Extract the title from storedData (entered in first section)
  const titleKey = "Enter Video Title here";
  let fileName = storedData[titleKey] || "Final_Script";

  // Remove illegal characters from filename
  fileName = fileName.trim().replace(/[\/\\:*?"<>|]/g, "") || "Final_Script";

  const doc = new jsPDF();
  doc.setFont("helvetica", "normal");
  doc.text(content, 10, 10, { maxWidth: 180 });
  doc.save(fileName + ".pdf");
});



///---------------------------refine button----------------------------//



document.addEventListener("DOMContentLoaded", () => {
  const refineButton = document.getElementById("refine-btn");
  const textarea = document.querySelector(".content textarea");

  refineButton.addEventListener("click", async () => {
      const inputText = textarea.value.trim();
      const videoLength = document.getElementById("minuteInput").value;
      const platform = document.querySelector(".platform textarea").value.trim();

      if (!inputText) {
          alert("Please write something to refine.");
          return;
      }

      if (!platform) {
          alert("Please specify the platform.");
          return;
      }

      // Optional UX update
      refineButton.disabled = true;
      refineButton.innerText = "Refining...";
      textarea.disabled = true;

      try {
          const response = await fetch("/refine", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({ 
                  text: inputText, 
                  videoLength: videoLength,
                  platform: platform 
              })
          });

          const result = await response.json();

          if (result.refined) {
              textarea.value = result.refined;
          } else {
              textarea.value = "Refinement failed.";
              console.error(result);
          }
      } catch (err) {
          console.error("Error refining:", err);
          textarea.value = "Something went wrong.";
      } finally {
          refineButton.disabled = false;
          refineButton.innerText = "Refine";
          textarea.disabled = false;
      }
  });
});



//------------------------words count -------------------------//


document.addEventListener("DOMContentLoaded", () => {
  const refineButton = document.getElementById("refine-btn");
  const textareas = document.querySelectorAll("textarea"); // target all textareas
  const wordCountDisplay = document.getElementById("word-count");

  // Get the stored temp value from localStorage, defaulting to 0 if not set
  let temp = parseInt(localStorage.getItem("tempWordCount") || 0);

  // Function to update total word count from all textareas
  const updateWordCount = () => {
    let totalWords = temp; // Start with the persisted temp value
    textareas.forEach((textarea) => {
      const text = textarea.value.trim();
      if (text !== "") {
        totalWords += text.split(/\s+/).length; // Count words in current section
      }
    });
    wordCountDisplay.textContent = `Total word count: ${totalWords}`;
  };

  // Function to store the current section's word count in `temp`
  const updateTemp = () => {
    let sectionWords = 0;
    textareas.forEach((textarea) => {
      const text = textarea.value.trim();
      if (text !== "") {
        sectionWords += text.split(/\s+/).length;  // Count words for current section
      }
    });
    temp += sectionWords;  // Add this count to the `temp` total
    localStorage.setItem("tempWordCount", temp); // Save to localStorage
  };

  // Attach live update to each textarea
  textareas.forEach((textarea) => {
    textarea.addEventListener("input", updateWordCount);
  });

  // Attach refine button logic
  refineButton.addEventListener("click", async () => {
    const textarea = document.querySelector(".content textarea");
    const inputText = textarea.value.trim();
    if (!inputText) {
      alert("Please write something to refine.");
      return;
    }

    refineButton.disabled = true;
    refineButton.innerText = "Refining...";
    textarea.disabled = true;

    try {
      const response = await fetch("/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: inputText })
      });

      const result = await response.json();

      if (result.refined) {
        textarea.value = result.refined;
        updateWordCount(); // Update after refine
      } else {
        textarea.value = "Refinement failed.";
        console.error(result);
      }
    } catch (err) {
      console.error("Error refining:", err);
      textarea.value = "Something went wrong.";
    } finally {
      refineButton.disabled = false;
      refineButton.innerText = "Refine";
      textarea.disabled = false;
    }
  });

  // Example of how you would call `updateTemp` when moving to the next section
  const nextButton = document.querySelector(".Next");
  if (nextButton) {
    nextButton.addEventListener("click", () => {
      updateTemp();  // Store word count of current section in `temp`
      updateWordCount();  // Update total word count with `temp`
    });
  }

  // Initialize on load
  updateWordCount();
});



/// ------------------------help and Example toggles------------------///



// Function to get the current section name
function getCurrentSectionName() {
  const activeBtn = document.querySelector('.sidebar-btn.active');
  if (activeBtn) {
    return activeBtn.innerText.trim().toLowerCase().replace(/\s+/g, '-');
  }
  return 'unknown';
}

// Function to toggle help content
function toggleHelp() {
  const sectionName = getCurrentSectionName();
  const helpBox = document.querySelector('.help-example-box');
  
  // Check if the help box is currently visible
  if (helpBox.style.display === 'block') {
    helpBox.style.display = 'none'; // Hide if it's already visible
  } else {
    helpBox.innerHTML = `<p>help-${sectionName}</p>`;
    helpBox.style.display = 'block'; // Show the help box
  }
}

// Function to toggle example content
function toggleExample() {
  const sectionName = getCurrentSectionName();
  const helpBox = document.querySelector('.help-example-box');
  
  // Check if the example box is currently visible
  if (helpBox.style.display === 'block') {
    helpBox.style.display = 'none'; // Hide if it's already visible
  } else {
    helpBox.innerHTML = `<p>example-${sectionName}</p>`;
    helpBox.style.display = 'block'; // Show the example box
  }
}

// Add event listeners to sidebar buttons for navigation
document.querySelectorAll('.sidebar-btn').forEach(button => {
  button.addEventListener('click', function () {
    // Remove active class from all buttons
    document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
    // Add active class to clicked button
    button.classList.add('active');
    // Hide the help/example box when changing section
    document.querySelector('.help-example-box').style.display = 'none';
  });
});
