const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion")


let userMessage = null;
let isResponsegenerating = false;


// API Configuration
const API_KEY = "AIzaSyCWDEiLYeQBV_NU8waE8bRrgwRZKP4xSwo";

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

const loadLocalstorageData = () => {
   const savedChats = localStorage.getItem("savedChats");
   const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

   //apply the stored theme
   document.body.classList.toggle("light_mode", isLightMode);
   toggleThemeButton.innertext = isLightMode ? "dark_mode" : "light_mode";

   // restore saved chats
   chatList.innerHTML = savedChats || "";
   document.body.classList.toggle("hide-header", savedChats);
   chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom 
}


//create a new message element and return it
const createMessageElement = (content, ...classes) => {
   const div = document.createElement("div");
   div.classList.add("message", ...classes);
   div.innerHTML = content;
   return div;
}
//show typing exxect by displaying words one by pne 
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
   const words = text.split(' ');
   let currentWordIndex = 0;

   const typingInterval = setInterval(() => {
      // Append each word to the text element with a space
      textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
      incomingMessageDiv.querySelector(".icon").classList.add("hide");

      // If all words are displayed
      if (currentWordIndex === words.length) {
         clearInterval(typingInterval);
         isResponsegenerating = false;
         incomingMessageDiv.querySelector(".icon").classList.remove("hide");

         // Save chats to local storage
         localStorage.setItem("savedChats", chatList.innerHTML);
         chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
      }
   }, 75);
};


// fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
   try {
      const response = await fetch(API_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            contents: [{
               role: "user",
               parts: [{ text: userMessage }]
            }]
         })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message);

      // Locate the text element inside the incoming message div
      const textElement = incomingMessageDiv.querySelector(".text");

      // Get the API response text and sanitize it
      const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');

      // Pass the correct textElement to showTypingEffect
      showTypingEffect(apiResponse, textElement, incomingMessageDiv);
   } catch (error) {
      isResponsegenerating = false;

      // Handle the error
      const textElement = incomingMessageDiv.querySelector(".text");
      textElement.innerText = error.message;
      textElement.classList.add("error");
   } finally {
      incomingMessageDiv.classList.remove("loading");
   }
};



//show loading animation while waiting for the API response
const showLoadingAnimation = () => {
   const html = `<div class="message-content">
            <img src="images/gemini.svg" alt="Gemini Image" class="avatar">
            <p class="text"></p>
            <div class="loading-indicator">
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
            </div>
        </div>
        <span  onclick="copyMessage(this)" class=" icon material-symbols-outlined">content_copy</span>`;

   const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
   chatList.appendChild(incomingMessageDiv);
   chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom 
   generateAPIResponse(incomingMessageDiv); // Pass the div here
}

// copy message to the clipboard
const copyMessage = (copyIcon) => {
   const messageText = copyIcon.parentElement.querySelector(".text").innerText;

   // Use clipboard API to copy text
   navigator.clipboard.writeText(messageText);
   copyIcon.innerText = "done"; // Show tick icon
   setTimeout(() => copyIcon.innerText = "content_copy", 1000); // Revert icon after 1 second
};


//handle sending outgoing chat messages
const handleOutgoingChat = () => {
   userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
   if (!userMessage || isResponsegenerating) return; //exit if there is no message

   isResponsegenerating = true;

   const html = `<div class="message-content">
            <img src="images/user.jpg" alt="User Image" class="avatar">
            <p class="text"></p>
        </div>`;

   const outgoingMessageDiv = createMessageElement(html, "outgoing");
   outgoingMessageDiv.querySelector(".text").innerHTML = userMessage;
   chatList.appendChild(outgoingMessageDiv);


   typingForm.reset();//clear input field
   chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom 
   document.body.classList.add("hide-header"); // hide the header once chat start
   setTimeout(showLoadingAnimation, 500);//show loading animation after a delay
}

// set usermessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
   suggestion.addEventListener("click", () => {
      userMessage = suggestion.querySelector(".text").innerText;
      handleOutgoingChat();
   });
});



// toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
   const isLightMode = document.body.classList.toggle("light_mode");
   localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
   toggleThemeButton.innertext = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click", () => {
   if (confirm("Are you sure you want to delete all messages?")) {
      localStorage.removeItem("savedChats");
      loadLocalstorageData();
   }

});


//prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
   e.preventDefault();
   handleOutgoingChat();
});