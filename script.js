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

// State
let products = [];
let editingProductId = null;

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

    productGrid.innerHTML = filteredProducts.map(product => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden transform transition-all hover:scale-105">
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
        </div>
    `).join('');

    // Toggle no products message
    if (filteredProducts.length === 0) {
        noProductsMessage.classList.remove('hidden');
        productGrid.innerHTML = '';
    } else {
        noProductsMessage.classList.add('hidden');
    }
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
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
        try {
            await fetch(`${BACKEND_URL}/products/${id}`, { method: 'DELETE' });
            await fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    }
};

// Submit Product
submitProduct.addEventListener('click', async () => {
    const formData = new FormData();

    // Only append image if a new file is selected
    if (imageUpload.files.length > 0) {
        formData.append('image', imageUpload.files[0]);
    }

    formData.append('nom', productName.value);
    formData.append('description', productDescription.value);
    formData.append('prix', productPrice.value);
    formData.append('categorie', productCategory.value);

    console.log('Product after initialisation:', Object.fromEntries(formData));
    

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

        console.log('Product submitted:', Object.fromEntries(formData));

        await fetchProducts();

        productModal.classList.remove('flex');
        productModal.classList.add('hidden');
    } catch (error) {
        console.error('Error submitting product:', error);
    }
});

// Filter Event Listeners
searchInput.addEventListener('input', renderProducts);
categoryFilter.addEventListener('change', renderProducts);

// Initial Load
fetchProducts();
