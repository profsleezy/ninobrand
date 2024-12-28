document.addEventListener('DOMContentLoaded', async () => {
    const catalogDiv = document.querySelector('.catalog');

    try {
        const response = await fetch('https://ninobrand.vercel.app/api/items'); // Fetch data from backend
        const items = await response.json();

        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item');
            itemDiv.dataset.index = index;

            const img = document.createElement('img');
            img.src = item.images[0]; // Ensure the backend sends an image URL
            img.alt = item.name;
            img.classList.add('item-image');

            const name = document.createElement('h3');
            name.textContent = item.name;

            const price = document.createElement('p');
            price.textContent = `$${parseFloat(item.price).toFixed(2)}`; // Defensive formatting

            itemDiv.appendChild(img);
            itemDiv.appendChild(name);
            itemDiv.appendChild(price);
            catalogDiv.appendChild(itemDiv);

            itemDiv.addEventListener('click', () => showItemModal(item));
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        catalogDiv.textContent = 'Failed to load catalog.';
    }
});

function showItemModal(item) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('item-modal');

    document.getElementById('modal-item-name').textContent = item.name;
    document.getElementById('modal-item-price').textContent = `$${parseFloat(item.price).toFixed(2)}`;
    document.getElementById('modal-item-image').src = item.images[0];

    const sizes = Array.isArray(item.sizes) ? item.sizes : item.sizes.split(',').map(size => size.trim());
    document.getElementById('modal-item-sizes').innerHTML = sizes.map(size => `<option value="${size}">${size}</option>`).join('');

    modalOverlay.style.display = 'block';
    modal.style.display = 'block';
}

function closeItemModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('item-modal').style.display = 'none';
}

// Cart logic with localStorage persistence
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const sideCart = document.querySelector('.side-cart');

// Function to update localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Function to add an item to the cart
function addToCart() {
    const itemName = document.getElementById('modal-item-name').innerText;
    const itemPrice = parseFloat(document.getElementById('modal-item-price').innerText.replace('$', ''));
    const itemSize = document.getElementById('modal-item-sizes').value;
    const itemQuantity = parseInt(document.getElementById('modal-item-quantity').value, 10);

    const existingItem = cart.find(item => item.name === itemName && item.size === itemSize);

    if (existingItem) {
        existingItem.quantity += itemQuantity;
    } else {
        cart.push({ name: itemName, price: itemPrice, size: itemSize, quantity: itemQuantity });
    }

    saveCart();
    updateSideCart();
    showSideCart();
    closeItemModal();
}

// Function to show the side cart
function showSideCart() {
    sideCart.style.transform = 'translateX(0)';
}

// Function to close the side cart
function closeSideCart() {
    sideCart.style.transform = 'translateX(100%)';
}

// Function to calculate the total price
function calculateTotal() {
    return cart.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0).toFixed(2);
}

// ...existing code...

function updateSideCart() {
    const cartItems = sideCart.querySelector('#cart-items');
    const cartTotal = sideCart.querySelector('#cart-total');
    const checkoutButton = document.getElementById('checkout-button');

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
        cartTotal.textContent = '$0.00';
        checkoutButton.textContent = 'Continue Shopping';
        checkoutButton.href = 'main.html';
        return;
    }

    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <span>${item.name} (${item.size})</span>
            <span>${item.quantity} x $${parseFloat(item.price).toFixed(2)}</span>
            <button class="remove-item" onclick="removeFromCart(${index})">
                <img src="icons/bin.svg" alt="Cart Icon">
            </button>
        </div>
    `).join('');
    cartTotal.textContent = `$${calculateTotal()}`;
    checkoutButton.textContent = 'Checkout';
    checkoutButton.href = 'checkout.html';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateSideCart();
}

// Attach event listener to cart button
document.querySelector('.button-cart').addEventListener('click', showSideCart);

// Add cart functionality to the DOM
document.body.addEventListener('DOMContentLoaded', updateSideCart);

