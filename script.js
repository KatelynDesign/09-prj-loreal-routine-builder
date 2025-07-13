/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

// Get reference to the "Generate Routine" button and selected products list
const generateRoutineBtn = document.getElementById("generateRoutine");
const selectedProductsList = document.getElementById("selectedProductsList");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards, with a toggle for description */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product, idx) => `
    <div class="product-card" data-index="${idx}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="toggle-desc-btn" aria-expanded="false" aria-controls="desc-${idx}" tabindex="0">
          Show Details
        </button>
        <div class="product-desc" id="desc-${idx}" hidden>
          ${
            product.description
              ? product.description
              : "No description available."
          }
        </div>
      </div>
    </div>
  `
    )
    .join("");

  // Add event listeners to all "Show Details" buttons
  const toggleBtns = productsContainer.querySelectorAll(".toggle-desc-btn");
  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Find the associated description div
      const card = btn.closest(".product-card");
      const desc = card.querySelector(".product-desc");
      const expanded = btn.getAttribute("aria-expanded") === "true";
      // Toggle visibility and aria attributes
      desc.hidden = expanded;
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.textContent = expanded ? "Show Details" : "Hide Details";
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

// --- Product search field logic ---
const productSearch = document.getElementById("productSearch");

// Store all products for filtering
let allProducts = [];

// Load all products on page load for searching/filtering
async function initProducts() {
  allProducts = await loadProducts();
}

// Filter products by category and search term
function filterAndDisplayProducts() {
  const selectedCategory = categoryFilter.value;
  const searchTerm = productSearch.value.trim().toLowerCase();

  let filtered = allProducts;

  // Filter by category if selected
  if (selectedCategory) {
    filtered = filtered.filter(
      (product) => product.category === selectedCategory
    );
  }

  // Filter by search term if entered
  if (searchTerm) {
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        (product.description &&
          product.description.toLowerCase().includes(searchTerm))
    );
  }

  displayProducts(filtered);
}

// Listen for changes on category filter and search input
categoryFilter.addEventListener("change", filterAndDisplayProducts);
productSearch.addEventListener("input", filterAndDisplayProducts);

// Initialize products on page load
initProducts();

// Array to store selected products
let selectedProducts = [];

// Load selected products from localStorage if available
function loadSelectedProductsFromStorage() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    try {
      selectedProducts = JSON.parse(saved);
    } catch {
      selectedProducts = [];
    }
  }
}

// Save selected products to localStorage
function saveSelectedProductsToStorage() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

// Add click event to product cards to select/deselect products, update visual state, and update selected list
productsContainer.addEventListener("click", (e) => {
  // Find the closest product card element
  const card = e.target.closest(".product-card");
  if (!card) return;

  // Get product name and brand from the card
  const name = card.querySelector("h3").textContent;
  const brand = card.querySelector("p").textContent;

  // Check if this product is already selected
  const index = selectedProducts.findIndex(
    (p) => p.name === name && p.brand === brand
  );

  if (index === -1) {
    // Not selected: add to selectedProducts and highlight card
    selectedProducts.push({ name, brand });
  } else {
    // Already selected: remove from selectedProducts
    selectedProducts.splice(index, 1);
  }
  saveSelectedProductsToStorage();
  renderSelectedProducts();
  updateProductCardHighlights();
});

// Helper function to update product card highlights based on selection
function updateProductCardHighlights() {
  // Get all product cards
  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    const name = card.querySelector("h3").textContent;
    const brand = card.querySelector("p").textContent;
    const isSelected = selectedProducts.some(
      (p) => p.name === name && p.brand === brand
    );
    if (isSelected) {
      card.style.border = "2px solid #000";
      card.style.background = "#f0f8ff";
    } else {
      card.style.border = "1px solid #ccc";
      card.style.background = "#fff";
    }
  });
}

// Show selected products in the UI and allow removal from the list
function renderSelectedProducts() {
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (p, idx) =>
        `<div class="selected-product" data-index="${idx}">
          ${p.name} <span style="font-size:12px;color:#888;">(${p.brand})</span>
          <button class="remove-selected" title="Remove" style="margin-left:8px;cursor:pointer;background:none;border:none;color:#c00;font-size:16px;">&times;</button>
        </div>`
    )
    .join("");

  // Add "Clear All" button if there are any selected products
  if (selectedProducts.length > 0) {
    selectedProductsList.innerHTML += `
      <button id="clearAllSelected" style="margin-top:10px;padding:6px 14px;background:#c00;color:#fff;border:none;border-radius:4px;cursor:pointer;">
        Clear All
      </button>
    `;
  }

  // Add event listeners to remove buttons
  const removeBtns = selectedProductsList.querySelectorAll(".remove-selected");
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const parent = btn.closest(".selected-product");
      const idx = parseInt(parent.getAttribute("data-index"));
      selectedProducts.splice(idx, 1);
      saveSelectedProductsToStorage();
      renderSelectedProducts();
      updateProductCardHighlights();
    });
  });

  // Add event listener to "Clear All" button
  const clearAllBtn = document.getElementById("clearAllSelected");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      selectedProducts = [];
      saveSelectedProductsToStorage();
      renderSelectedProducts();
      updateProductCardHighlights();
    });
  }
}

// On page load, restore selected products and update UI
loadSelectedProductsFromStorage();
renderSelectedProducts();
updateProductCardHighlights();

// Use this system message for the chat AI
const systemMessage = `
You are Elise, a beauty advisor. When you mention products or resources, always include clickable URLs. Format links as HTML anchor tags, like: <a href="URL" target="_blank" rel="noopener noreferrer">link text</a>.
Provide helpful, direct links so users can easily access more information or buy products.

Your tone is warm and professional, and you sign off with "— Elise 💄".
`;

// --- Conversation history for chat (so the AI remembers the conversation) ---
let conversationHistory = [
  {
    role: "system",
    content: systemMessage,
  },
];

// Example function to call OpenAI via the proxy
async function getOpenAIResponse(messages) {
  // Use the proxy URL defined in index.html
  const url =
    typeof OPENAI_PROXY_URL !== "undefined" ? OPENAI_PROXY_URL : workerUrl;

  // Prepare the request body for OpenAI's chat API
  const body = {
    model: "gpt-4o", // Use gpt-4o as per instructions
    messages: messages,
    temperature: 0.7,
  };

  // Make the API request using fetch and async/await
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Do NOT include your OpenAI API key here; the proxy handles it
    },
    body: JSON.stringify(body),
  });

  // Parse the JSON response
  const data = await response.json();

  // Return the assistant's reply
  return data.choices && data.choices[0]
    ? data.choices[0].message.content
    : "Sorry, I couldn't get a response.";
}

// Escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Converts product names in a text to clickable links based on the loaded product list.
 * Ensures each product name is only linked once per call to avoid repeats.
 *
 * @param {string} text - The AI response text to linkify.
 * @param {Array} products - Array of product objects with at least 'name' and 'url'.
 * @returns {string} - The text with product names replaced by clickable links.
 */
function linkifyProductsInText(text, products) {
  if (!products || products.length === 0) return text;

  const linkedProducts = new Set();

  products.forEach((product) => {
    if (!product.name) return;
    const url = product.url || "https://www.lorealparisusa.com/";
    // Only link the first occurrence of each product name
    if (!linkedProducts.has(product.name.toLowerCase())) {
      const regex = new RegExp(`\\b${escapeRegExp(product.name)}\\b`, "i");
      let replaced = false;
      text = text.replace(regex, (match) => {
        if (replaced) return match;
        replaced = true;
        linkedProducts.add(product.name.toLowerCase());
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
      });
    }
  });

  return text;
}

// Handle "Generate Routine" button click
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<div class="chat-bubble elise" style="margin-bottom: 16px;"><em>Please select at least one product to generate a routine.</em></div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return;
  }

  let productListText = selectedProducts
    .map((p, i) => `${i + 1}. ${p.name} (${p.brand})`)
    .join("\n");

  // Add the user's message to the conversation history
  const userMsg = `Here are the products I selected:\n${productListText}\nPlease create a personalized routine using only these products.`;
  conversationHistory.push({
    role: "user",
    content: userMsg,
  });

  chatWindow.innerHTML += `
    <div class="chat-bubble user"><strong>You:</strong><br>${userMsg.replace(
      /\n/g,
      "<br>"
    )}</div>
    <div class="chat-bubble typing elise-typing"><em>Elise is typing...</em></div>
  `;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    let reply = await getOpenAIResponse(conversationHistory);
    // Linkify product names in reply
    reply = linkifyProductsInText(reply, allProducts);
    conversationHistory.push({
      role: "assistant",
      content: reply,
    });
    const typingDiv = chatWindow.querySelector(".elise-typing");
    if (typingDiv) typingDiv.remove();
    chatWindow.innerHTML += `<div class="chat-bubble elise" style="margin-bottom: 24px;"><strong>Elise:</strong><br>${reply.replace(
      /\n/g,
      "<br>"
    )}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    const typingDiv = chatWindow.querySelector(".elise-typing");
    if (typingDiv) typingDiv.remove();
    chatWindow.innerHTML += `<div class="chat-bubble elise" style="margin-bottom: 16px;"><em>Sorry, something went wrong.</em></div>`;
  }
});

// Chat form submission handler using the proxy
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput").value;

  conversationHistory.push({
    role: "user",
    content: userInput,
  });

  chatWindow.innerHTML += `
    <div class="chat-bubble user"><strong>You:</strong><br>${userInput}</div>
    <div class="chat-bubble typing elise-typing"><em>Elise is typing...</em></div>
  `;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    let reply = await getOpenAIResponse(conversationHistory);
    // Linkify product names in reply
    reply = linkifyProductsInText(reply, allProducts);
    conversationHistory.push({
      role: "assistant",
      content: reply,
    });
    const typingDiv = chatWindow.querySelector(".elise-typing");
    if (typingDiv) typingDiv.remove();
    chatWindow.innerHTML += `<div class="chat-bubble elise" style="margin-bottom: 24px;"><strong>Elise:</strong><br>${reply.replace(
      /\n/g,
      "<br>"
    )}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    const typingDiv = chatWindow.querySelector(".elise-typing");
    if (typingDiv) typingDiv.remove();
    chatWindow.innerHTML += `<div class="chat-bubble elise" style="margin-bottom: 16px;"><em>Sorry, something went wrong.</em></div>`;
  }

  document.getElementById("userInput").value = "";
});

// New function to add chat bubbles
function addChatBubble(role, text, isTyping = false) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  if (isTyping) {
    bubble.classList.add("typing");
    bubble.textContent = text;
  } else {
    if (role === "elise") {
      // Render links & formatting as HTML for Elise, preserve line breaks
      bubble.innerHTML = text.replace(/\n/g, "<br>");
    } else {
      // For user, escape HTML to prevent injection
      bubble.textContent = text;
    }
  }
  chatWindow.appendChild(bubble);
  scrollChatToBottom();
}

// Helper function to scroll chat window to the bottom
function scrollChatToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// This code runs after the page loads
window.addEventListener('DOMContentLoaded', () => {
  // Select the image element by its id
  const serumImg = document.getElementById('revitalift-serum-img');
  // If the element exists, set its src to the correct image file
  if (serumImg) {
    serumImg.src = 'img/Revitalift 1.5% Hyaluronic Acid Serum.png';
  }
});
