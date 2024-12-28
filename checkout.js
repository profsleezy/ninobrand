document.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsDiv = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    const shippingFee = 50;

    function calculateSubtotal() {
        return cart.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0).toFixed(2);
    }

    function updateCartDisplay() {
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
            cartSubtotal.textContent = '$0.00';
            cartTotal.textContent = '$50.00';
            return;
        }

        cartItemsDiv.innerHTML = cart.map(item => `
            <div class="cart-item">
                <span>${item.name} (${item.size})</span>
                <span>${item.quantity} x $${parseFloat(item.price).toFixed(2)}</span>
            </div>
        `).join('');
        const subtotal = calculateSubtotal();
        cartSubtotal.textContent = `$${subtotal}`;
        cartTotal.textContent = `$${(parseFloat(subtotal) + shippingFee).toFixed(2)}`;
    }

    updateCartDisplay();

    const billingAddressFields = document.getElementById('billing-address-fields');
    const billingAddressInputs = billingAddressFields.querySelectorAll('input');

    document.querySelectorAll('input[name="billing-address"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            if (event.target.value === 'different') {
                billingAddressFields.style.display = 'block';
                billingAddressInputs.forEach(input => input.setAttribute('required', 'required'));
            } else {
                billingAddressFields.style.display = 'none';
                billingAddressInputs.forEach(input => input.removeAttribute('required'));
            }
        });
    });

    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Ensure only visible fields are required
        if (document.querySelector('input[name="billing-address"]:checked').value === 'different') {
            billingAddressInputs.forEach(input => input.setAttribute('required', 'required'));
        } else {
            billingAddressInputs.forEach(input => input.removeAttribute('required'));
        }

        if (!checkoutForm.checkValidity()) {
            event.stopPropagation();
            alert('Please fill in all required fields.');
            return;
        }

        const formData = new FormData(checkoutForm);
        const orderDetails = {
            contact: formData.get('contact'),
            country: formData.get('country'),
            firstName: formData.get('first-name'),
            lastName: formData.get('last-name'),
            address: formData.get('address'),
            apartment: formData.get('apartment'),
            city: formData.get('city'),
            state: formData.get('state'),
            postalCode: formData.get('postal-code'),
            phone: formData.get('phone'),
            cart: cart,
            total: cartTotal.textContent
        };

        try {
            const response = await fetch('http://localhost:3000/submit-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderDetails)
            });

            if (response.ok) {
                alert('Order submitted successfully! Thank you for shopping with us.');
                localStorage.removeItem('cart'); // Clear the cart
                window.location.href = 'main.html'; // Redirect to main page
            } else {
                alert('Failed to submit order.');
            }
        } catch (error) {
            alert('Error submitting order: ' + error.message);
        }
    });
});