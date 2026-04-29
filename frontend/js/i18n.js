const TRANSLATIONS = {
  en: {
    'nav.home': 'Home', 'nav.products': 'Products', 'nav.cart': 'Cart', 'nav.login': 'Login', 'nav.profile': 'Profile',
    'hero.badge': "Rwanda's #1 Online Supermarket", 'hero.title': 'Shop Fresh, Delivered Fast', 'hero.sub': 'Over 700 products from Simba Supermarket, delivered to your door across Rwanda.',
    'hero.shop': 'Shop Now', 'hero.learn': 'Learn More',
    'value.45min': '45-Min Delivery', 'value.delivery': 'Fast delivery across Kigali', 'value.fresh': 'Fresh Products', 'value.products': 'Quality guaranteed', 'value.momo': 'MoMo Payment', 'value.payment': 'Secure mobile payment', 'value.branches': '9 Branches', 'value.pickup': 'Pickup near you',
    'cart.title': 'Shopping Cart', 'cart.empty': 'Your cart is empty', 'cart.total': 'Total', 'cart.checkout': 'Proceed to Checkout',
    'section.featured': 'Featured Products', 'section.categories': 'Shop by Category', 'section.all': 'All Products', 'section.viewAll': 'View All',
    'product.addCart': 'Add to Cart', 'product.outOfStock': 'Out of Stock', 'product.inStock': 'In Stock',
    'product.reviews': 'Reviews', 'product.related': 'Related Products',
    'checkout.title': 'Checkout', 'checkout.delivery': 'Delivery Info', 'checkout.payment': 'Payment Method', 'checkout.summary': 'Order Summary',
    'checkout.place': 'Place Order', 'checkout.free': 'Free delivery on orders over 100,000 RWF!',
    'auth.login': 'Login', 'auth.register': 'Register', 'auth.email': 'Email Address', 'auth.password': 'Password', 'auth.name': 'Full Name', 'auth.phone': 'Phone Number',
    'profile.title': 'My Profile', 'profile.orders': 'My Orders', 'profile.edit': 'Edit Profile', 'profile.save': 'Save Changes',
    'order.tracking': 'Order Tracking', 'order.status.pending': 'Pending', 'order.status.confirmed': 'Confirmed', 'order.status.preparing': 'Preparing', 'order.status.on_the_way': 'On the Way', 'order.status.delivered': 'Delivered',
    'filter.sort': 'Sort by', 'filter.newest': 'Newest', 'filter.price_asc': 'Price: Low to High', 'filter.price_desc': 'Price: High to Low', 'filter.rating': 'Best Rated',
    'search.placeholder': 'Ask Simba AI what you need...', 'search.noResults': 'No products found',
    'toast.addedCart': 'Added to cart!', 'toast.removedCart': 'Removed from cart', 'toast.orderSuccess': 'Order placed successfully!', 'toast.loginRequired': 'Please login to continue',
    'payment.momo': 'MTN Mobile Money', 'payment.airtel': 'Airtel Money', 'payment.cod': 'Pay on Delivery',
    'delivery.free': 'FREE Delivery', 'delivery.calc': 'Calculate delivery cost', 'delivery.est': 'Estimated delivery'
  },
  fr: {
    'nav.home': 'Accueil', 'nav.products': 'Produits', 'nav.cart': 'Panier', 'nav.login': 'Connexion', 'nav.profile': 'Profil',
    'hero.badge': "N°1 de la vente en ligne au Rwanda", 'hero.title': 'Frais et livré rapidement', 'hero.sub': "Plus de 700 produits Simba Supermarket livrés à domicile partout au Rwanda.",
    'hero.shop': 'Acheter', 'hero.learn': 'En savoir plus',
    'value.45min': 'Livraison 45 min', 'value.delivery': 'Livraison rapide à Kigali', 'value.fresh': 'Produits frais', 'value.products': 'Qualité garantie', 'value.momo': 'Paiement MoMo', 'value.payment': 'Paiement mobile sécurisé', 'value.branches': '9 Succursales', 'value.pickup': 'Retrait près de chez vous',
    'cart.title': 'Panier', 'cart.empty': 'Votre panier est vide', 'cart.total': 'Total', 'cart.checkout': 'Passer la commande',
    'section.featured': 'Produits en vedette', 'section.categories': 'Catégories', 'section.all': 'Tous les produits', 'section.viewAll': 'Voir tout',
    'product.addCart': 'Ajouter au panier', 'product.outOfStock': 'Rupture de stock', 'product.inStock': 'En stock',
    'product.reviews': 'Avis', 'product.related': 'Produits similaires',
    'checkout.title': 'Commande', 'checkout.delivery': 'Livraison', 'checkout.payment': 'Paiement', 'checkout.summary': 'Récapitulatif',
    'checkout.place': 'Confirmer', 'checkout.free': 'Livraison gratuite à partir de 100 000 RWF!',
    'auth.login': 'Connexion', 'auth.register': "S'inscrire", 'auth.email': 'Adresse e-mail', 'auth.password': 'Mot de passe', 'auth.name': 'Nom complet', 'auth.phone': 'Téléphone',
    'profile.title': 'Mon Profil', 'profile.orders': 'Mes Commandes', 'profile.edit': 'Modifier', 'profile.save': 'Enregistrer',
    'order.tracking': 'Suivi de commande', 'order.status.pending': 'En attente', 'order.status.confirmed': 'Confirmé', 'order.status.preparing': 'En préparation', 'order.status.on_the_way': 'En route', 'order.status.delivered': 'Livré',
    'filter.sort': 'Trier par', 'filter.newest': 'Plus récent', 'filter.price_asc': 'Prix croissant', 'filter.price_desc': 'Prix décroissant', 'filter.rating': 'Mieux notés',
    'search.placeholder': 'Demandez à Simba AI ce qu’il vous faut...', 'search.noResults': 'Aucun résultat',
    'toast.addedCart': 'Ajouté au panier!', 'toast.removedCart': 'Retiré du panier', 'toast.orderSuccess': 'Commande passée!', 'toast.loginRequired': 'Veuillez vous connecter',
    'payment.momo': 'MTN Mobile Money', 'payment.airtel': 'Airtel Money', 'payment.cod': 'Payer à la livraison',
    'delivery.free': 'Livraison GRATUITE', 'delivery.calc': 'Calculer la livraison', 'delivery.est': 'Livraison estimée'
  },
  rw: {
    'nav.home': 'Ahabanza', 'nav.products': 'Ibicuruzwa', 'nav.cart': 'Igikebo', 'nav.login': 'Injira', 'nav.profile': 'Umwirondoro',
    'hero.badge': "Isoko #1 kuri interineti mu Rwanda", 'hero.title': 'Gura Bikurikiranye', 'hero.sub': "Ibicuruzwa birenze 700 biva kuri Simba Supermarket, bitumizirwa iwanyu hirya no hino mu Rwanda.",
    'hero.shop': 'Gura Ubu', 'hero.learn': 'Menya Byinshi',
    'value.45min': 'Umunota 45', 'value.delivery': 'Gutumiza vuba i Kigali', 'value.fresh': 'Ibicuruzwa Bishya', 'value.products': 'Igikoni kirihame', 'value.momo': 'Kwishyura MoMo', 'value.payment': 'Kwishyura na telefoni', 'value.branches': 'Imidugudu 9', 'value.pickup': 'Fata hafi yawe',
    'cart.title': 'Igikebo', 'cart.empty': 'Igikebo cyawe kirimo ubusa', 'cart.total': 'Igiteranyo', 'cart.checkout': 'Komeza Kwishyura',
    'section.featured': 'Ibicuruzwa Bidasanzwe', 'section.categories': 'Andika mu byiciro', 'section.all': 'Ibicuruzwa Byose', 'section.viewAll': 'Reba Byose',
    'product.addCart': 'Shyira mu Gikebo', 'product.outOfStock': 'Nta Byuze', 'product.inStock': 'Bihari',
    'product.reviews': 'Ibitekerezo', 'product.related': 'Ibicuruzwa Bisa',
    'checkout.title': 'Ishyurwa', 'checkout.delivery': "Amakuru y'Itumanaho", 'checkout.payment': "Uburyo bw'Ubwishyu", 'checkout.summary': 'Incamake',
    'checkout.place': 'Saba Ibirindiro', 'checkout.free': "Gutumiza ubuntu ku mafaranga arenga 100,000 RWF!",
    'auth.login': 'Injira', 'auth.register': 'Iyandikishe', 'auth.email': 'Imeyili', 'auth.password': 'Ijambo ry\'Ibanga', 'auth.name': 'Amazina Yose', 'auth.phone': 'Telefone',
    'profile.title': 'Umwirondoro Wanjye', 'profile.orders': 'Ibirindiro Byanjye', 'profile.edit': 'Hindura', 'profile.save': 'Bika',
    'order.tracking': 'Gukurikirana Ibirindiro', 'order.status.pending': 'Bitegereje', 'order.status.confirmed': 'Byemejwe', 'order.status.preparing': 'Bitegurwa', 'order.status.on_the_way': 'Biri mu Nzira', 'order.status.delivered': 'Byatumijwe',
    'filter.sort': 'Tondeka', 'filter.newest': 'Bishya', 'filter.price_asc': 'Igiciro Gito→Kinini', 'filter.price_desc': 'Igiciro Kinini→Gito', 'filter.rating': 'Byagiriye neza',
    'search.placeholder': 'Baza Simba AI icyo ushaka...', 'search.noResults': 'Nta bicuruzwa bibonetse',
    'toast.addedCart': 'Byashyiriwe mu gikebo!', 'toast.removedCart': 'Byakuwe mu gikebo', 'toast.orderSuccess': "Ibirindiro byatanzwe neza!", 'toast.loginRequired': 'Injira ukomeze',
    'payment.momo': 'MTN Mobile Money', 'payment.airtel': 'Airtel Money', 'payment.cod': 'Wishyure iyo bitumirijwe',
    'delivery.free': 'Gutumiza ubuntu', 'delivery.calc': "Bara agaciro k'itumanaho", 'delivery.est': "Igihe cy'itumanaho"
  }
};

const I18n = {
  lang: localStorage.getItem('simba_lang') || 'en',

  t(key) {
    return TRANSLATIONS[this.lang]?.[key] || TRANSLATIONS.en[key] || key;
  },

  setLang(lang) {
    if (!TRANSLATIONS[lang]) return;
    this.lang = lang;
    localStorage.setItem('simba_lang', lang);
    this.applyAll();
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  },

  applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = this.t(key);
    });
    const searchInputs = document.querySelectorAll('#globalSearch, #mobileSearch');
    searchInputs.forEach(input => { input.placeholder = this.t('search.placeholder'); });
  }
};
