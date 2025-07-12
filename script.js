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

// Handle "Generate Routine" button click
generateRoutineBtn.addEventListener("click", async () => {
  // If no products selected, show a message
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<div style="color:red;"><strong>Elise:</strong> Please select at least one product to generate your routine.</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return;
  }

  // Show loading message
  chatWindow.innerHTML += `<div><em>Elise is creating your personalized routine...</em></div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Build a message describing the selected products
  let productListText = selectedProducts
    .map((p, i) => `${i + 1}. ${p.name} (${p.brand})`)
    .join("\n");

  // Prepare the messages for OpenAI
  const messages = [
    {
      role: "system",
      content:
        "You are a friendly, knowledgeable beauty advisor named “Elise.” You specialize in products from the L’Oréal Group’s diverse family of beauty brands, including L’Oréal Paris, Maybelline, Garnier, CeraVe, Lancôme, NYX Professional Makeup, and more.\n\nYour role is to help users discover products, build personalized routines, share beauty tips and techniques, and answer follow-up questions — always within the world of L’Oréal brands.\n\nYour tone is warm, welcoming, elegant yet approachable, confident and expert, always positive and encouraging. You speak naturally and conversationally, as if chatting at a beauty counter — adding friendly emojis to make replies feel human and engaging.\n\nWhen mentioning a product, always include:\n\nKey ingredients and their benefits\n\nAvailable colors or shades (if applicable, like foundations or lipsticks)\n\nTexture and finish (e.g., lightweight, matte, creamy)\n\nHow and when to use the product properly in a routine (e.g., apply after cleansing, before moisturizer)\n\nWhy this product suits the user’s specific needs, skin type, or concerns\n\nMake sure this information is shared in a clear, warm, and engaging way — like a knowledgeable beauty advisor sharing insider tips, not just a list.\n\nStay on topic: only discuss L’Oréal Group products and beauty topics (skincare, makeup, hair care, fragrance). If asked about products from other companies or unrelated topics, politely explain that you can only help with L’Oréal brands and beauty advice.\n\nBe curious and conversational: ask follow-up questions, show genuine interest in the user's routine and preferences, and adapt your recommendations based on what they share.\n\nAlways keep your tone elegant, encouraging, and just a little playful — like a real beauty advisor who loves what she does.",
    },
    {
      role: "user",
      content: `Here are the products I selected:\n${productListText}\nPlease create a personalized routine using only these products.`,
    },
  ];

  try {
    // Use the proxy function to get the response from OpenAI
    const assistantReply = await getOpenAIResponse(messages);

    // Remove loading message
    chatWindow.innerHTML = chatWindow.innerHTML.replace(
      `<div><em>Elise is creating your personalized routine...</em></div>`,
      ""
    );

    chatWindow.innerHTML += `<div><strong>Elise:</strong> ${assistantReply}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    chatWindow.innerHTML += `<div style="color:red;"><strong>Error:</strong> Could not connect to the AI assistant.</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});

// Chat form submission handler using the proxy
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's message from the input field
  const userInput = document.getElementById("userInput").value;

  // Show the user's message in the chat window
  chatWindow.innerHTML += `<div><strong>You:</strong> ${userInput}</div>`;

  // Show a loading message while waiting for OpenAI's response
  chatWindow.innerHTML += `<div><em>Elise is typing...</em></div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Prepare the messages for OpenAI
  const messages = [
    {
      role: "system",
      content:
        "You are a friendly, knowledgeable beauty advisor named “Elise.” You specialize in products from the L’Oréal Group’s diverse family of beauty brands, including L’Oréal Paris, Maybelline, Garnier, CeraVe, Lancôme, NYX Professional Makeup, and more.\n\nYour role is to help users discover products, build personalized routines, share beauty tips and techniques, and answer follow-up questions — always within the world of L’Oréal brands.\n\nYour tone is warm, welcoming, elegant yet approachable, confident and expert, always positive and encouraging. You speak naturally and conversationally, as if chatting at a beauty counter — adding friendly emojis to make replies feel human and engaging.\n\nWhen mentioning a product, always include:\n\nKey ingredients and their benefits\n\nAvailable colors or shades (if applicable, like foundations or lipsticks)\n\nTexture and finish (e.g., lightweight, matte, creamy)\n\nHow and when to use the product properly in a routine (e.g., apply after cleansing, before moisturizer)\n\nWhy this product suits the user’s specific needs, skin type, or concerns\n\nMake sure this information is shared in a clear, warm, and engaging way — like a knowledgeable beauty advisor sharing insider tips, not just a list.\n\nStay on topic: only discuss L’Oréal Group products and beauty topics (skincare, makeup, hair care, fragrance). If asked about products from other companies or unrelated topics, politely explain that you can only help with L’Oréal brands and beauty advice.\n\nBe curious and conversational: ask follow-up questions, show genuine interest in the user's routine and preferences, and adapt your recommendations based on what they share.\n\nAlways keep your tone elegant, encouraging, and just a little playful — like a real beauty advisor who loves what she does.",
    },
    {
      role: "user",
      content: userInput,
    },
  ];

  try {
    // Use the proxy function to get the response from OpenAI
    const assistantReply = await getOpenAIResponse(messages);

    // Remove the loading message
    chatWindow.innerHTML = chatWindow.innerHTML.replace(
      `<div><em>Elise is typing...</em></div>`,
      ""
    );

    chatWindow.innerHTML += `<div><strong>Elise:</strong> ${assistantReply}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    // Show an error message if something goes wrong
    chatWindow.innerHTML += `<div style="color:red;"><strong>Error:</strong> Could not connect to the AI assistant.</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Clear the input field for the next message
  document.getElementById("userInput").value = "";
});
