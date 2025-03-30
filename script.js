// Backend URL
const BACKEND_URL = "https://prodancakes-backend-production.up.railway.app";

// DOM Elements
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const productGrid = document.getElementById('productGrid');
const noProductsMessage = document.getElementById('noProductsMessage');
const addProductBtn = document.getElementById('addProductBtn');
const productModal = document.getElementById('productModal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imageUploadPlaceholder = document.getElementById('imageUploadPlaceholder');
const productName = document.getElementById('productName');
const productDescription = document.getElementById('productDescription');
const productPrice = document.getElementById('productPrice');
const productCategory = document.getElementById('productCategory');
const submitProduct = document.getElementById('submitProduct');
const successMessage = document.getElementById('successMessage');
const authOverlay = document.getElementById('authOverlay');
const mainContent = document.getElementById('mainContent');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const attemptMessage = document.getElementById('attemptMessage');
const remainingAttempts = document.getElementById('remainingAttempts');
const lockMessage = document.getElementById('lockMessage');
const lockTimerElement = document.getElementById('lockTimer');
const permanentLockMessage = document.getElementById('permanentLockMessage');
const authForm = document.getElementById('authForm');
const unlockBtn = document.getElementById('unlockBtn');

// State
let products = [];
let editingProductId = null;
let attemptCount = 0;
let totalAttemptCount = 0;
let isLocked = false;
let lockTimer = null;
let remainingTime = 0;
let sessionTimer = null;
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

const AUTH_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

const UNLOCK_PASSWORD = "adminUnlock123"; // Mot de passe pour débloquer l'accès

// Afficher le message de succès
function showSuccessMessage() {
    successMessage.textContent = "Requête réussie";
    successMessage.classList.remove('hidden');

    setTimeout(() => {
        successMessage.classList.add('fade-out');
        setTimeout(() => {
            successMessage.classList.add('hidden');
            successMessage.classList.remove('fade-out');
        }, 1000);
    }, 2000);
}

// Image Preview
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.src = event.target.result;
            imagePreviewContainer.classList.remove('hidden');
            imageUploadPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// Open Modal
addProductBtn.addEventListener('click', () => {
    resetModal();
    modalTitle.textContent = 'Ajouter Produit';
    submitProduct.textContent = 'Ajouter';
    productModal.classList.remove('hidden');
    productModal.classList.add('flex');
});

// Close Modal
closeModal.addEventListener('click', () => {
    productModal.classList.remove('flex');
    productModal.classList.add('hidden');
});

// Reset Modal
function resetModal() {
    productName.value = '';
    productDescription.value = '';
    productPrice.value = '';
    productCategory.value = '';
    imageUpload.value = '';
    imagePreviewContainer.classList.add('hidden');
    imageUploadPlaceholder.classList.remove('hidden');
    editingProductId = null;
    clearErrorBorders();
}

// Clear Error Borders
function clearErrorBorders() {
    productName.classList.remove('error-border');
    productDescription.classList.remove('error-border');
    productPrice.classList.remove('error-border');
    productCategory.classList.remove('error-border');
}

// Create Skeleton Loaders
function createSkeletonLoaders() {
    const loadingGrid = document.createElement('div');
    loadingGrid.id = 'loadingGrid';
    loadingGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader bg-white rounded-lg shadow-md overflow-hidden transform transition-all';
        skeleton.innerHTML = `
            <div class="w-full h-48 skeleton-loader"></div>
            <div class="p-4">
                <div class="h-6 skeleton-loader mb-2 w-3/4"></div>
                <div class="h-4 skeleton-loader mb-2 w-1/2"></div>
                <div class="h-4 skeleton-loader mb-4 w-full"></div>
                <div class="flex justify-between items-center">
                    <div class="h-5 skeleton-loader w-16"></div>
                    <div class="h-6 skeleton-loader w-20 rounded-full"></div>
                </div>
                <div class="flex mt-4 space-x-2">
                    <div class="h-10 skeleton-loader flex-1"></div>
                    <div class="h-10 skeleton-loader flex-1"></div>
                </div>
            </div>
        `;
        loadingGrid.appendChild(skeleton);
    }

    return loadingGrid;
}

// Create Empty State
function createEmptyState(message = 'Aucun produit trouvé') {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state col-span-1 md:col-span-2 lg:col-span-3';
    emptyState.innerHTML = `
        <div class="empty-state-icon">📦</div>
        <h3 class="text-xl font-semibold mb-2">${message}</h3>
        <p class="text-gray-500">Essayez de modifier vos filtres ou d'ajouter de nouveaux produits.</p>
    `;
    return emptyState;
}

// Fetch Products
async function fetchProducts() {
    try {
        const response = await fetch(`${BACKEND_URL}/products`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        products = await response.json();
        console.log('Fetched products:', products);
        renderProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Render Products
function renderProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilterValue = categoryFilter.value.toLowerCase();

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.nom.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm);

        const matchesCategory =
            categoryFilterValue === '' ||
            product.categorie.toLowerCase() === categoryFilterValue;

        return matchesSearch && matchesCategory;
    });

    productGrid.innerHTML = '';
    const loadingGrid = createSkeletonLoaders();
    productGrid.appendChild(loadingGrid);

    setTimeout(() => {
        productGrid.innerHTML = '';

        if (filteredProducts.length === 0) {
            const emptyState = createEmptyState();
            productGrid.appendChild(emptyState);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

        filteredProducts.forEach((product, index) => {
            const productElement = document.createElement('div');
            productElement.className = 'product-appear bg-white rounded-lg shadow-md overflow-hidden transform transition-all hover:scale-105';
            productElement.style.animationDelay = `${index * 0.1}s`;

            productElement.innerHTML = `
                <img
                    src="${product.image}"
                    alt="${product.nom}"
                    class="w-full h-48 object-cover"
                />
                <div class="p-4">
                    <h3 class="font-bold text-lg mb-2">${product.nom}</h3>
                    <p class="text-gray-600 text-sm mb-2">${product.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-green-600 font-semibold">
                            ${product.prix} €
                        </span>
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            ${product.categorie}
                        </span>
                    </div>
                    <div class="flex mt-4 space-x-2">
                        <button
                            onclick="editProduct(${product.id})"
                            class="flex-1 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 flex items-center justify-center"
                        >
                            Modifier
                        </button>
                        <button
                            onclick="deleteProduct(${product.id})"
                            class="flex-1 bg-red-500 text-white p-2 rounded hover:bg-red-600 flex items-center justify-center"
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            `;

            grid.appendChild(productElement);
        });

        productGrid.appendChild(grid);
    }, 1500); // Délai de 1.5 secondes pour simuler le chargement
}

// Edit Product
window.editProduct = (id) => {
    const product = products.find(p => p.id === id);
    if (product) {
        editingProductId = id;
        productName.value = product.nom;
        productDescription.value = product.description;
        productPrice.value = product.prix;
        productCategory.value = product.categorie;

        imagePreview.src = product.image;
        imagePreviewContainer.classList.remove('hidden');
        imageUploadPlaceholder.classList.add('hidden');

        modalTitle.textContent = 'Modifier Produit';
        submitProduct.textContent = 'Mettre à jour';
        productModal.classList.remove('hidden');
        productModal.classList.add('flex');
    }
};

// Delete Product
window.deleteProduct = async (id) => {
    const productToDelete = products.find(p => p.id === id);
    if (productToDelete) {
        const confirmText = `Voulez-vous vraiment supprimer le produit "${productToDelete.nom}" ?`;
        if (confirm(confirmText)) {
            try {
                await fetch(`${BACKEND_URL}/products/${id}`, { method: 'DELETE' });
                showSuccessMessage();
                await fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    }
};

// Submit Product
submitProduct.addEventListener('click', async () => {
    clearErrorBorders();
    let hasError = false;

    if (productName.value.trim() === '') {
        productName.classList.add('error-border');
        hasError = true;
    }

    if (productDescription.value.trim() === '') {
        productDescription.classList.add('error-border');
        hasError = true;
    }

    if (productPrice.value.trim() === '') {
        productPrice.classList.add('error-border');
        hasError = true;
    }

    if (productCategory.value.trim() === '') {
        productCategory.classList.add('error-border');
        hasError = true;
    }

    if (hasError) {
        return;
    }

    const formData = new FormData();

    if (imageUpload.files.length > 0) {
        formData.append('image', imageUpload.files[0]);
    }

    formData.append('nom', productName.value);
    formData.append('description', productDescription.value);
    formData.append('prix', productPrice.value);
    formData.append('categorie', productCategory.value);

    const originalText = submitProduct.textContent;
    submitProduct.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        ${editingProductId ? 'Mise à jour...' : 'Ajout...'}
    `;
    submitProduct.disabled = true;

    try {
        const url = editingProductId
            ? `${BACKEND_URL}/products/${editingProductId}`
            : `${BACKEND_URL}/products`;

        const method = editingProductId ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            body: formData
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        // Afficher le message de succès
        showSuccessMessage();

        await fetchProducts();

        productModal.classList.remove('flex');
        productModal.classList.add('hidden');
    } catch (error) {
        console.error('Error submitting product:', error);
        alert('Erreur lors de l\'enregistrement du produit');
    } finally {
        submitProduct.innerHTML = originalText;
        submitProduct.disabled = false;
    }
});

// Filter Event Listeners
searchInput.addEventListener('input', renderProducts);
categoryFilter.addEventListener('change', renderProducts);

// Initial Load
fetchProducts();

// Authentication Functions
function checkAuthStatus() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const isPermanentlyLocked = localStorage.getItem('permanentlyLocked') === 'true';

    if (isPermanentlyLocked) {
        showPermanentLock();
        unlockBtn.classList.remove('hidden');
        return;
    }

    if (isAuthenticated) {
        showMainContent();
        startSessionTimer();
    }

    const lockExpiryTime = localStorage.getItem('lockExpiryTime');
    if (lockExpiryTime && parseInt(lockExpiryTime) > Date.now()) {
        startLockTimer(Math.ceil((parseInt(lockExpiryTime) - Date.now()) / 1000));
    }

    if (localStorage.getItem('totalAttemptCount')) {
        totalAttemptCount = parseInt(localStorage.getItem('totalAttemptCount'));
    }
}

loginBtn.addEventListener('click', attemptLogin);

passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        attemptLogin();
    }
});

function attemptLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (isLocked) return;

    if (username === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
        localStorage.setItem('isAuthenticated', 'true');
        showMainContent();
        resetAttempts();
        startSessionTimer();
    } else {
        attemptCount++;
        totalAttemptCount++;
        localStorage.setItem('totalAttemptCount', totalAttemptCount.toString());

        authForm.classList.add('shake');
        setTimeout(() => authForm.classList.remove('shake'), 500);

        errorMessage.classList.remove('hidden');

        if (attemptCount >= 3) {
            lockTemporarily();
        } else if (totalAttemptCount >= 5) {
            lockPermanently();
        } else {
            remainingAttempts.textContent = 3 - attemptCount;
            attemptMessage.classList.remove('hidden');
        }

        passwordInput.value = '';
    }
}

function lockTemporarily() {
    isLocked = true;
    attemptMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    lockMessage.classList.remove('hidden');

    usernameInput.disabled = true;
    passwordInput.disabled = true;
    loginBtn.disabled = true;

    const lockDuration = 60;
    remainingTime = lockDuration;

    const lockExpiryTime = Date.now() + (lockDuration * 1000);
    localStorage.setItem('lockExpiryTime', lockExpiryTime.toString());

    startLockTimer(lockDuration);
}

function startLockTimer(duration) {
    isLocked = true;
    remainingTime = duration;

    lockMessage.classList.remove('hidden');
    usernameInput.disabled = true;
    passwordInput.disabled = true;
    loginBtn.disabled = true;

    lockTimer = setInterval(() => {
        remainingTime--;
        lockTimerElement.textContent = remainingTime;

        if (remainingTime <= 0) {
            clearInterval(lockTimer);
            unlockForm();
        }
    }, 1000);

    lockTimerElement.textContent = remainingTime;
}

function unlockForm() {
    isLocked = false;

    usernameInput.disabled = false;
    passwordInput.disabled = false;
    loginBtn.disabled = false;

    lockMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    attemptMessage.classList.add('hidden');

    attemptCount = 0;

    localStorage.removeItem('lockExpiryTime');
}

function lockPermanently() {
    isLocked = true;

    usernameInput.disabled = true;
    passwordInput.disabled = true;
    loginBtn.disabled = true;

    errorMessage.classList.add('hidden');
    attemptMessage.classList.add('hidden');
    lockMessage.classList.add('hidden');
    permanentLockMessage.classList.remove('hidden');

    localStorage.setItem('permanentlyLocked', 'true');
}

function showPermanentLock() {
    usernameInput.disabled = true;
    passwordInput.disabled = true;
    loginBtn.disabled = true;

    errorMessage.classList.add('hidden');
    attemptMessage.classList.add('hidden');
    lockMessage.classList.add('hidden');
    permanentLockMessage.classList.remove('hidden');
}

function resetAttempts() {
    attemptCount = 0;
    totalAttemptCount = 0;
    localStorage.removeItem('totalAttemptCount');
    localStorage.removeItem('permanentlyLocked');
    localStorage.removeItem('lockExpiryTime');
}

function showMainContent() {
    console.log("Authentification réussie, affichage du contenu principal.");
    authOverlay.style.display = "none"; // Cache le modal
    mainContent.style.display = "block"; // Affiche le contenu principal
}


unlockBtn.addEventListener('click', function() {
    const unlockPassword = prompt("Entrez le mot de passe de déblocage :");
    if (unlockPassword === UNLOCK_PASSWORD) {
        unlockAccess();
    } else {
        alert("Mot de passe incorrect. L'accès reste bloqué.");
    }
});

function unlockAccess() {
    localStorage.removeItem('permanentlyLocked');
    localStorage.removeItem('lockExpiryTime');
    localStorage.removeItem('totalAttemptCount');
    isLocked = false;
    unlockBtn.classList.add('hidden');
    permanentLockMessage.classList.add('hidden');
    usernameInput.disabled = false;
    passwordInput.disabled = false;
    loginBtn.disabled = false;
    attemptCount = 0;
    totalAttemptCount = 0;
}

function startSessionTimer() {
    sessionTimer = setTimeout(() => {
        localStorage.removeItem('isAuthenticated');
        showAuthOverlay();
    }, SESSION_DURATION);

    document.addEventListener('click', resetSessionTimer);
    document.addEventListener('keypress', resetSessionTimer);
}

function resetSessionTimer() {
    clearTimeout(sessionTimer);
    startSessionTimer();
}

function showAuthOverlay() {
    authOverlay.classList.remove('hidden');
    mainContent.classList.add('hidden');
    clearTimeout(sessionTimer);
    document.removeEventListener('click', resetSessionTimer);
    document.removeEventListener('keypress', resetSessionTimer);
}

window.addEventListener('beforeunload', () => {
    localStorage.removeItem('isAuthenticated');
});

document.addEventListener('DOMContentLoaded', checkAuthStatus);
