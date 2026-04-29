const I18n = {
  lang: localStorage.getItem('simba_lang') || 'en',
  fallback: 'en',

  strings: {
    en: {
      home: 'Home', products: 'Products', cart: 'Cart', login: 'Login',
      profile: 'Profile', orders: 'Orders', logout: 'Logout',
      staticMode: 'Static Mode — Backend offline. Features like login/cart are simulated.',
      reload: 'Reload',
      'hero.badge': 'Free Delivery on Orders > 100k',
      'hero.title': 'Fresh Groceries, Delivered Fast',
      'hero.sub': 'Order online from Simba Supermarket Kigali. Fresh products, fast pickup across Rwanda.',
      'hero.shop': 'Shop Now', 'hero.learn': 'Learn More',
      'value.45min': '45 Min', 'value.delivery': 'Delivery',
      'value.fresh': 'Always Fresh', 'value.products': 'Quality Products',
      'value.momo': 'MoMo Pay', 'value.payment': 'Easy Payment',
      'value.branches': '9 Branches', 'value.pickup': 'Free Pickup',
      'trust.branches': '9 Branches in Kigali', 'trust.products': '1000+ Products',
      'promo.offer': 'Limited Offer', 'promo.freeDelivery': 'Free Delivery',
      'promo.freeDeliverySub': 'On orders above 100,000 RWF',
      'promo.new': 'New Arrival', 'promo.alcoholic': 'Alcoholic Drinks',
      'promo.selection': 'Premium Selection',
      'promo.fresh': 'Fresh Produce', 'promo.food': 'Food Products',
      'promo.delivered': 'Delivered to your door',
      'section.categories': 'Shop by Category', 'section.featured': 'Featured Products',
      'section.all': 'All Products', 'section.viewAll': 'View All',
      'common.items': 'items', 'common.products': 'products', 'common.per': 'per',
      'filter.sort': 'Sort by', 'filter.newest': 'Newest',
      'filter.price_asc': 'Price: Low to High', 'filter.price_desc': 'Price: High to Low',
      'filter.rating': 'Top Rated', 'filter.allStock': 'All Stock',
      'filter.inStockOnly': 'In Stock Only', 'filter.clear': 'Clear Filters',
      'search.matches': 'matches found', 'search.noResults': 'No products found',
      'search.tryDifferent': 'Try a different search or browse categories',
      'product.outOfStock': 'Out of Stock', 'product.addCart': 'Add to Cart',
      'product.inStock': 'In Stock', 'product.reviews': 'Reviews',
      'product.related': 'Related Products',
      'cart.title': 'Shopping Cart', 'cart.empty': 'Your cart is empty',
      'cart.total': 'Total', 'cart.checkout': 'Proceed to Checkout',
      'toast.loggedOut': 'Logged out successfully',
      'toast.loginRequired': 'Please log in to continue',
      'toast.addedCart': 'Added to cart',
      'toast.removedCart': 'Removed from cart',
      'auth.login': 'Login', 'auth.register': 'Register',
      'auth.email': 'Email', 'auth.password': 'Password',
      'auth.name': 'Name', 'auth.phone': 'Phone',
      'auth.confirmPassword': 'Confirm Password',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.resetPassword': 'Reset Password',
      'auth.sendResetLink': 'Send Reset Link',
      'auth.newPassword': 'New Password'
    },
    fr: {
      home: 'Accueil', products: 'Produits', cart: 'Panier', login: 'Connexion',
      profile: 'Profil', orders: 'Commandes', logout: 'Déconnexion',
      staticMode: 'Mode Statique — Serveur backend hors ligne. Les fonctionnalités comme connexion/panier sont simulées.',
      reload: 'Recharger',
      'hero.badge': 'Livraison Gratuite > 100k',
      'hero.title': 'Courses Fraîches, Livrées Rapidement',
      'hero.sub': 'Commandez en ligne chez Simba Supermarché Kigali. Produits frais, retrait rapide partout au Rwanda.',
      'hero.shop': 'Acheter', 'hero.learn': 'En Savoir Plus',
      'value.45min': '45 Min', 'value.delivery': 'Livraison',
      'value.fresh': 'Toujours Frais', 'value.products': 'Produits de Qualité',
      'value.momo': 'MoMo Pay', 'value.payment': 'Paiement Facile',
      'value.branches': '9 Succursales', 'value.pickup': 'Retrait Gratuit',
      'trust.branches': '9 Succursales à Kigali', 'trust.products': '1000+ Produits',
      'promo.offer': 'Offre Limitée', 'promo.freeDelivery': 'Livraison Gratuite',
      'promo.freeDeliverySub': 'Pour les commandes > 100 000 RWF',
      'promo.new': 'Nouveautés', 'promo.alcoholic': 'Boissons Alcoolisées',
      'promo.selection': 'Sélection Premium',
      'promo.fresh': 'Produits Frais', 'promo.food': 'Produits Alimentaires',
      'promo.delivered': 'Livré à votre porte',
      'section.categories': 'Acheter par Catégorie', 'section.featured': 'Produits en Vedette',
      'section.all': 'Tous les Produits', 'section.viewAll': 'Voir Tout',
      'common.items': 'articles', 'common.products': 'produits', 'common.per': 'par',
      'filter.sort': 'Trier par', 'filter.newest': 'Plus Récent',
      'filter.price_asc': 'Prix: Croissant', 'filter.price_desc': 'Prix: Décroissant',
      'filter.rating': 'Mieux Notés', 'filter.allStock': 'Tout le Stock',
      'filter.inStockOnly': 'En Stock Uniquement', 'filter.clear': 'Effacer les Filtres',
      'search.matches': 'correspondances trouvées', 'search.noResults': 'Aucun produit trouvé',
      'search.tryDifferent': 'Essayez une autre recherche ou parcourez les catégories',
      'product.outOfStock': 'Rupture de Stock', 'product.addCart': 'Ajouter au Panier',
      'product.inStock': 'En Stock', 'product.reviews': 'Avis',
      'product.related': 'Produits Similaires',
      'cart.title': 'Panier d\'Achat', 'cart.empty': 'Votre panier est vide',
      'cart.total': 'Total', 'cart.checkout': 'Passer la Commande',
      'toast.loggedOut': 'Déconnecté avec succès',
      'toast.loginRequired': 'Veuillez vous connecter pour continuer',
      'toast.addedCart': 'Ajouté au panier',
      'toast.removedCart': 'Retiré du panier',
      'auth.login': 'Connexion', 'auth.register': 'Inscription',
      'auth.email': 'E-mail', 'auth.password': 'Mot de Passe',
      'auth.name': 'Nom', 'auth.phone': 'Téléphone',
      'auth.confirmPassword': 'Confirmer le Mot de Passe',
      'auth.forgotPassword': 'Mot de passe oublié ?',
      'auth.resetPassword': 'Réinitialiser le Mot de Passe',
      'auth.sendResetLink': 'Envoyer le Lien',
      'auth.newPassword': 'Nouveau Mot de Passe'
    },
    rw: {
      home: 'Ahabanza', products: 'Ibicuruzwa', cart: 'Agatoro', login: 'Injira',
      profile: 'Irangamimerere', orders: 'Amabwiriza', logout: 'Sohoka',
      staticMode: 'Uburyo Bw\'Igiciro — Serive y\'inyuma ntiyakora. Ibikorwa nk\'injira/agatoro birakorwa nk\'igerageza.',
      reload: 'Kongera Ushye',
      'hero.badge': 'Gutwara Ubuntu ku Bicuruzwa > 100k',
      'hero.title': 'Ibicuruzwa Bishya, Biguwe Vuba',
      'hero.sub': 'Tumire muri Simba Supermarché Kigali. Ibicuruzwa bishya, gukura vuba mu Rwanda hose.',
      'hero.shop': 'Gura', 'hero.learn': 'Menya Byinshi',
      'value.45min': 'Min 45', 'value.delivery': 'Gutwara',
      'value.fresh': 'Bishya Burityo', 'value.products': 'Ibicuruzwa Byiza',
      'value.momo': 'MoMo Pay', 'value.payment': 'Kwishyura Byoroshye',
      'value.branches': 'Amashami 9', 'value.pickup': 'Gukura Ubuntu',
      'trust.branches': 'Amashami 9 ya Kigali', 'trust.products': 'Ibicuruzwa 1000+',
      'promo.offer': 'Igihembo Gihari', 'promo.freeDelivery': 'Gutwara Ubuntu',
      'promo.freeDeliverySub': 'Ku bicuruzwa birenze 100 000 RWF',
      'promo.new': 'Ibicuruzwa Bishya', 'promo.alcoholic': 'Inyuranyagi',
      'promo.selection': 'Ishema Ryiheza', 'promo.fresh': 'Ibicuruzwa Bishya',
      'promo.food': 'Ibicuruzwa by\'Amata', 'promo.delivered': 'Biguwe kuri nzu yawe',
      'section.categories': 'Gura ukurikije Icyiciro', 'section.featured': 'Byamamaye',
      'section.all': 'Ibicuruzwa Byose', 'section.viewAll': 'Reba Byose',
      'common.items': 'ibicuruzwa', 'common.products': 'ibicuruzwa', 'common.per': 'kuri',
      'filter.sort': 'Gushungura ukurikije', 'filter.newest': 'Gishya',
      'filter.price_asc': 'Igiciro: Gito ku Gikomeye', 'filter.price_desc': 'Igiciro: Gikomeye ku Gito',
      'filter.rating': 'Byagenzwe neza', 'filter.allStock': 'Ubufasha Bwose',
      'filter.inStockOnly': 'Biri mu Bubiko Gusa', 'filter.clear': 'Hagarika Amafuni',
      'search.matches': 'bikwuye byabonetse', 'search.noResults': 'Nta bicuruzwa byabonetse',
      'search.tryDifferent': 'Gerageza gushakisha uko bishakiye cyangwa raba uduce',
      'product.outOfStock': 'Ntibiri mu Bubiko', 'product.addCart': 'Ongeramo mu Gatoro',
      'product.inStock': 'Biri mu Bubiko', 'product.reviews': 'Ibitekerezo',
      'product.related': 'Ibicuruzwa Bisa',
      'cart.title': 'Agatoro', 'cart.empty': 'Agatoro rawe rariremwo',
      'cart.total': 'Igiteranyo', 'cart.checkout': 'Tanga Icyifuzo',
      'toast.loggedOut': 'Washotse neza',
      'toast.loginRequired': 'Injira mbere yo kukomeza',
      'toast.addedCart': 'Yongewemo mu gatoro',
      'toast.removedCart': 'Yakuwe mu gatoro',
      'auth.login': 'Injira', 'auth.register': 'Iyandikishe',
      'auth.email': 'Imeli', 'auth.password': 'Ijambo ry\'Ibanga',
      'auth.name': 'Izina', 'auth.phone': 'Telefone',
      'auth.confirmPassword': 'Emeza Ijambo ry\'Ibanga',
      'auth.forgotPassword': 'Wibagiwe Ijambo ry\'Ibanga?',
      'auth.resetPassword': 'Subiza Ijambo ry\'Ibanga',
      'auth.sendResetLink': 'Ohereza Ihuza',
      'auth.newPassword': 'Ijambo ry\'Ibanga Rishya'
    }
  },

  setLang(lang) {
    if (!this.strings[lang]) lang = this.fallback;
    this.lang = lang;
    localStorage.setItem('simba_lang', lang);
    this.applyAll();
    // Reload data that depends on language
    if (App && typeof App.loadCategories === 'function') {
      App.loadCategories();
    }
  },

  t(key, ...args) {
    const str = (this.strings[this.lang] && this.strings[this.lang][key]) ||
      (this.strings[this.fallback] && this.strings[this.fallback][key]) || key;
    return typeof str === 'function' ? str(...args) : str;
  },

  applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const text = this.t(key);
      if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    });
    // Update html lang attribute
    document.documentElement.lang = this.lang === 'rw' ? 'rw' : this.lang;
  },

  tCategory(name) {
    const map = {
      en: {
        'Food Products': 'Food Products', 'Alcoholic Drinks': 'Alcoholic Drinks',
        'Kitchenware & Electronics': 'Kitchenware & Electronics', 'Cosmetics & Personal Care': 'Cosmetics & Personal Care',
        'Baby Products': 'Baby Products', 'Cleaning & Sanitary': 'Cleaning & Sanitary',
        'Sports & Wellness': 'Sports & Wellness', 'Pet Care': 'Pet Care',
        'Kitchen Storage': 'Kitchen Storage', 'General': 'General'
      },
      fr: {
        'Food Products': 'Produits Alimentaires', 'Alcoholic Drinks': 'Boissons Alcoolisées',
        'Kitchenware & Electronics': 'Cuisine & Électronique', 'Cosmetics & Personal Care': 'Cosmétiques & Soins',
        'Baby Products': 'Produits Bébé', 'Cleaning & Sanitary': 'Nettoyage & Hygiène',
        'Sports & Wellness': 'Sport & Bien-être', 'Pet Care': 'Soins aux Animaux',
        'Kitchen Storage': 'Rangement Cuisine', 'General': 'Général'
      },
      rw: {
        'Food Products': 'Ibicuruzwa by\'Amata', 'Alcoholic Drinks': 'Inyuranyagi',
        'Kitchenware & Electronics': 'Ibikoresho by\'Icumba n\'Amashanyarazi', 'Cosmetics & Personal Care': 'Ibikoresho by\'Ishusho',
        'Baby Products': 'Ibicuruzwa by\'Abana', 'Cleaning & Sanitary': 'Gusukura & Umutunganyirizwa',
        'Sports & Wellness': 'Siporo & Igitangaza', 'Pet Care': 'Kuragira Inyamaswa',
        'Kitchen Storage': 'Ububiko bwa Kiciro', 'General': 'Ibisanzwe'
      }
    };
    return (map[this.lang] && map[this.lang][name]) || (map[this.fallback] && map[this.fallback][name]) || name;
  }
};

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => I18n.setLang(btn.dataset.lang));
});

// Global fallback so old code calling tCategory() still works
window.tCategory = (name) => I18n.tCategory(name);
