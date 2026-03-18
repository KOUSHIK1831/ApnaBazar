export type Language = 'en' | 'te' | 'hi';

export const languageLabels: Record<Language, string> = {
  en: 'English',
  te: 'తెలుగు',
  hi: 'हिन्दी',
};

const translations = {
  // ── Common ──
  'common.appName': { en: 'ApnaBazar', te: 'ApnaBazar', hi: 'ApnaBazar' },
  'common.signOut': { en: 'Sign out', te: 'సైన్ అవుట్', hi: 'साइन आउट' },
  'common.save': { en: 'Save Settings', te: 'సేవ్ చేయి', hi: 'सेटिंग्स सेव करें' },
  'common.saving': { en: 'Saving...', te: 'సేవ్ అవుతోంది...', hi: 'सेव हो रहा है...' },
  'common.error': { en: 'Error', te: 'లోపం', hi: 'त्रुटि' },
  'common.saved': { en: 'Saved', te: 'సేవ్ అయింది', hi: 'सेव हो गया' },
  'common.loading': { en: 'Loading...', te: 'లోడ్ అవుతోంది...', hi: 'लोड हो रहा है...' },

  // ── Landing Page ──
  'landing.hero.title': { en: 'Your Local Store,', te: 'మీ స్థానిక దుకాణం,', hi: 'आपकी लोकल दुकान,' },
  'landing.hero.titleHighlight': { en: 'Now Digital', te: 'ఇప్పుడు డిజిటల్', hi: 'अब डिजिटल' },
  'landing.hero.subtitle': {
    en: 'Transform your clothing business with AI-powered digitization. Upload product images, and let our intelligent agent create your stunning online catalog in seconds.',
    te: 'AI తో మీ దుస్తుల వ్యాపారాన్ని డిజిటల్ చేయండి. ప్రోడక్ట్ ఫోటోలు అప్‌లోడ్ చేయండి, మా AI ఏజెంట్ మీ ఆన్‌లైన్ కేటలాగ్‌ను సెకన్లలో తయారు చేస్తుంది.',
    hi: 'AI से अपने कपड़ों के व्यापार को डिजिटल बनाएं। प्रोडक्ट फोटो अपलोड करें, और हमारा AI एजेंट सेकंडों में आपका ऑनलाइन कैटलॉग तैयार कर देगा।',
  },
  'landing.hero.cta': { en: 'Start Selling Online', te: 'ఆన్‌లైన్‌లో అమ్మకం ప్రారంభించండి', hi: 'ऑनलाइन बिक्री शुरू करें' },
  'landing.hero.secondaryCta': { en: 'Already have an account?', te: 'ఇప్పటికే ఖాతా ఉందా?', hi: 'पहले से अकाउंट है?' },
  'landing.features.title': { en: 'Everything You Need to Go Digital', te: 'డిజిటల్ అవ్వడానికి మీకు కావలసినవన్నీ', hi: 'डिजिटल होने के लिए सब कुछ' },
  'landing.features.upload.title': { en: 'Smart Upload', te: 'స్మార్ట్ అప్‌లోడ్', hi: 'स्मार्ट अपलोड' },
  'landing.features.upload.desc': {
    en: 'Simply photograph your products or upload price lists. Our system handles the rest.',
    te: 'మీ ప్రొడక్ట్‌ల ఫోటోలు తీసి అప్‌లోడ్ చేయండి. మిగిలిన పనులు మా సిస్టమ్ చేస్తుంది.',
    hi: 'बस अपने प्रोडक्ट्स की फोटो खींचें या प्राइस लिस्ट अपलोड करें। बाकी काम हमारा सिस्टम करेगा।',
  },
  'landing.features.ai.title': { en: 'AI Digitization', te: 'AI డిజిటైజేషన్', hi: 'AI डिजिटाइज़ेशन' },
  'landing.features.ai.desc': {
    en: 'Our AI agent extracts product details, categorizes items, and sets competitive prices automatically.',
    te: 'మా AI ఏజెంట్ ప్రొడక్ట్ వివరాలను సేకరించి, వస్తువులను వర్గీకరించి, ధరలను ఆటోమేటిగ్గా నిర్ణయిస్తుంది.',
    hi: 'हमारा AI एजेंट प्रोडक्ट डिटेल्स निकालता है, आइटम्स को कैटेगरी में बांटता है, और दाम अपने आप सेट करता है।',
  },
  'landing.features.store.title': { en: 'Instant Store', te: 'ఇన్‌స్టంట్ స్టోర్', hi: 'इंस्टेंट स्टोर' },
  'landing.features.store.desc': {
    en: 'Get a beautiful, shareable online storefront where customers can browse and order.',
    te: 'అందమైన, షేర్ చేయగల ఆన్‌లైన్ స్టోర్ పొందండి, కస్టమర్లు బ్రౌజ్ చేసి ఆర్డర్ చేయవచ్చు.',
    hi: 'एक खूबसूरत, शेयर करने योग्य ऑनलाइन स्टोर पाएं जहां ग्राहक ब्राउज़ और ऑर्डर कर सकते हैं।',
  },
  'landing.footer': { en: 'Empowering local sellers to go digital', te: 'స్థానిక విక్రేతలను డిజిటల్ చేయడం', hi: 'लोकल विक्रेताओं को डिजिटल बनाना' },

  // ── Auth ──
  'auth.signIn': { en: 'Sign In', te: 'సైన్ ఇన్', hi: 'साइन इन' },
  'auth.signUp': { en: 'Create Account', te: 'ఖాతా సృష్టించు', hi: 'अकाउंट बनाएं' },
  'auth.email': { en: 'Email', te: 'ఇమెయిల్', hi: 'ईमेल' },
  'auth.password': { en: 'Password', te: 'పాస్‌వర్డ్', hi: 'पासवर्ड' },
  'auth.noAccount': { en: "Don't have an account?", te: 'ఖాతా లేదా?', hi: 'अकाउंट नहीं है?' },
  'auth.hasAccount': { en: 'Already have an account?', te: 'ఇప్పటికే ఖాతా ఉందా?', hi: 'पहले से अकाउंट है?' },
  'auth.welcomeBack': { en: 'Welcome back to ApnaBazar', te: 'ApnaBazar కి తిరిగి స్వాగతం', hi: 'ApnaBazar में वापस स्वागत है' },
  'auth.joinUs': { en: 'Start your digital store journey', te: 'మీ డిజిటల్ స్టోర్ ప్రారంభించండి', hi: 'अपना डिजिटल स्टोर शुरू करें' },

  // ── Dashboard ──
  'dashboard.totalProducts': { en: 'Total Products', te: 'మొత్తం ఉత్పత్తులు', hi: 'कुल उत्पाद' },
  'dashboard.aiAgent': { en: 'AI Agent', te: 'AI ఏజెంట్', hi: 'AI एजेंट' },
  'dashboard.ready': { en: 'Ready', te: 'సిద్ధం', hi: 'तैयार' },
  'dashboard.active': { en: 'Active', te: 'యాక్టివ్', hi: 'सक्रिय' },
  'dashboard.storeUrl': { en: 'Your Store URL', te: 'మీ స్టోర్ URL', hi: 'आपका स्टोर URL' },
  'dashboard.tabs.products': { en: 'Products', te: 'ఉత్పత్తులు', hi: 'उत्पाद' },
  'dashboard.tabs.upload': { en: 'Upload', te: 'అప్‌లోడ్', hi: 'अपलोड' },
  'dashboard.tabs.settings': { en: 'Store Settings', te: 'స్టోర్ సెట్టింగ్స్', hi: 'स्टोर सेटिंग्स' },
  'dashboard.catalog': { en: 'Your Catalog', te: 'మీ కేటలాగ్', hi: 'आपका कैटलॉग' },
  'dashboard.addProducts': { en: 'Add Products', te: 'ఉత్పత్తులు జోడించు', hi: 'उत्पाद जोड़ें' },
  'dashboard.noProducts': { en: 'No products yet', te: 'ఇంకా ఉత్పత్తులు లేవు', hi: 'अभी कोई उत्पाद नहीं' },
  'dashboard.noProductsDesc': { en: 'Upload product images to get started with AI digitization', te: 'AI డిజిటైజేషన్ ప్రారంభించడానికి ప్రొడక్ట్ ఫోటోలు అప్‌లోడ్ చేయండి', hi: 'AI डिजिटाइज़ेशन शुरू करने के लिए प्रोडक्ट फोटो अपलोड करें' },
  'dashboard.uploadProducts': { en: 'Upload Products', te: 'ఉత్పత్తులు అప్‌లోడ్ చేయండి', hi: 'उत्पाद अपलोड करें' },
  'dashboard.uploadDigitize': { en: 'Upload & Digitize', te: 'అప్‌లోడ్ & డిజిటైజ్', hi: 'अपलोड और डिजिटाइज़' },
  'dashboard.copyLink': { en: 'Copy Store Link', te: 'స్టోర్ లింక్ కాపీ', hi: 'स्टोर लिंक कॉपी' },
  'dashboard.copied': { en: 'Copied!', te: 'కాపీ అయింది!', hi: 'कॉपी हो गया!' },
  'dashboard.viewStore': { en: 'View Store', te: 'స్టోర్ చూడు', hi: 'स्टोर देखें' },

  // ── Store Setup ──
  'setup.title': { en: 'Set Up Your Store', te: 'మీ స్టోర్ సెటప్ చేయండి', hi: 'अपना स्टोर सेट करें' },
  'setup.subtitle': { en: 'Tell us about your business to create your digital storefront', te: 'మీ డిజిటల్ స్టోర్ సృష్టించడానికి మీ వ్యాపారం గురించి చెప్పండి', hi: 'अपना डिजिटल स्टोर बनाने के लिए अपने व्यापार के बारे में बताएं' },
  'setup.yourName': { en: 'Your Name', te: 'మీ పేరు', hi: 'आपका नाम' },
  'setup.contactNumber': { en: 'Contact Number', te: 'సంప్రదింపు నంబర్', hi: 'संपर्क नंबर' },
  'setup.storeName': { en: 'Store Name', te: 'స్టోర్ పేరు', hi: 'स्टोर का नाम' },
  'setup.storeDescription': { en: 'Store Description', te: 'స్టోర్ వివరణ', hi: 'स्टोर विवरण' },
  'setup.storeDescPlaceholder': { en: 'What do you sell? Tell your customers what makes your store special...', te: 'మీరు ఏమి అమ్ముతారు? మీ స్టోర్ ప్రత్యేకత ఏమిటో కస్టమర్లకు చెప్పండి...', hi: 'आप क्या बेचते हैं? ग्राहकों को बताएं आपकी दुकान में क्या खास है...' },
  'setup.location': { en: 'Location', te: 'ప్రదేశం', hi: 'स्थान' },
  'setup.shopNumber': { en: 'Shop / Store Number', te: 'షాప్ / స్టోర్ నంబర్', hi: 'दुकान / स्टोर नंबर' },
  'setup.createStore': { en: 'Create Store', te: 'స్టోర్ సృష్టించు', hi: 'स्टोर बनाएं' },
  'setup.storeUrl': { en: 'Your store URL:', te: 'మీ స్టోర్ URL:', hi: 'आपका स्टोर URL:' },

  // ── Store Settings ──
  'settings.storeInfo': { en: 'Store Information', te: 'స్టోర్ సమాచారం', hi: 'स्टोर जानकारी' },
  'settings.storeInfoDesc': { en: 'Your store name, description, and branding', te: 'మీ స్టోర్ పేరు, వివరణ, మరియు బ్రాండింగ్', hi: 'आपके स्टोर का नाम, विवरण, और ब्रांडिंग' },
  'settings.storeName': { en: 'Store Name', te: 'స్టోర్ పేరు', hi: 'स्टोर का नाम' },
  'settings.storeDescription': { en: 'Store Description', te: 'స్టోర్ వివరణ', hi: 'स्टोर विवरण' },
  'settings.storeDescPlaceholder': { en: 'Tell customers about your store, your specialties, and what makes you unique...', te: 'మీ స్టోర్ గురించి, మీ ప్రత్యేకతల గురించి కస్టమర్లకు చెప్పండి...', hi: 'ग्राहकों को अपनी दुकान, विशेषताओं और खासियत के बारे में बताएं...' },
  'settings.storeUrlLabel': { en: 'Store URL', te: 'స్టోర్ URL', hi: 'स्टोर URL' },
  'settings.shareLink': { en: 'Share this link with your customers', te: 'ఈ లింక్ మీ కస్టమర్లతో షేర్ చేయండి', hi: 'यह लिंक अपने ग्राहकों को शेयर करें' },
  'settings.locationMaps': { en: 'Location & Maps', te: 'ప్రదేశం & మ్యాప్', hi: 'स्थान और मैप' },
  'settings.locationMapsDesc': { en: 'Help customers find your physical store', te: 'కస్టమర్లకు మీ దుకాణం కనుగొనడంలో సహాయం', hi: 'ग्राहकों को आपकी दुकान खोजने में मदद करें' },
  'settings.storeAddress': { en: 'Store Address', te: 'స్టోర్ చిరునామా', hi: 'स्टोर पता' },
  'settings.mapsUrl': { en: 'Google Maps Embed URL', te: 'Google Maps Embed URL', hi: 'Google Maps Embed URL' },
  'settings.mapsHelp': { en: 'Go to Google Maps → Share → Embed a map → Copy HTML. You can paste the entire iframe code here.', te: 'Google Maps → Share → Embed a map → Copy HTML. మొత్తం iframe కోడ్ ఇక్కడ పేస్ట్ చేయవచ్చు.', hi: 'Google Maps → Share → Embed a map → Copy HTML. पूरा iframe कोड यहां पेस्ट करें।' },
  'settings.mapsWarning': { en: "⚠️ This doesn't look like a valid embed link. Make sure to use the \"Embed a map\" option, not a standard share link.", te: '⚠️ ఇది చెల్లుబాటు అయ్యే embed లింక్ కాదు. "Embed a map" ఆప్షన్ వాడండి.', hi: '⚠️ यह एक वैध embed लिंक नहीं लग रहा। "Embed a map" विकल्प का उपयोग करें।' },
  'settings.contactDetails': { en: 'Contact Details', te: 'సంప్రదింపు వివరాలు', hi: 'संपर्क विवरण' },
  'settings.contactDetailsDesc': { en: 'How customers can reach you', te: 'కస్టమర్లు మిమ్మల్ని ఎలా సంప్రదించగలరు', hi: 'ग्राहक आपसे कैसे संपर्क कर सकते हैं' },
  'settings.contactNumber': { en: 'Contact Number', te: 'సంప్రదింపు నంబర్', hi: 'संपर्क नंबर' },
  'settings.shopNumber': { en: 'Store / Shop Number', te: 'స్టోర్ / షాప్ నంబర్', hi: 'स्टोर / दुकान नंबर' },
  'settings.saveSuccess': { en: 'Store settings updated successfully.', te: 'స్టోర్ సెట్టింగ్స్ విజయవంతంగా అప్‌డేట్ అయ్యాయి.', hi: 'स्टोर सेटिंग्स सफलतापूर्वक अपडेट हो गईं।' },
  'settings.saveError': { en: 'Failed to update store settings.', te: 'స్టోర్ సెట్టింగ్స్ అప్‌డేట్ చేయడంలో విఫలమైంది.', hi: 'स्टोर सेटिंग्स अपडेट करने में विफल।' },

  // ── Storefront (Buyer-facing) ──
  'storefront.orderNow': { en: 'Order Now', te: 'ఇప్పుడే ఆర్డర్ చేయండి', hi: 'अभी ऑर्डर करें' },
  'storefront.noProducts': { en: 'No products listed yet.', te: 'ఇంకా ఉత్పత్తులు జాబితా చేయబడలేదు.', hi: 'अभी कोई उत्पाद सूचीबद्ध नहीं है।' },
  'storefront.storeNotFound': { en: 'Store not found', te: 'స్టోర్ కనుగొనబడలేదు', hi: 'स्टोर नहीं मिला' },
  'storefront.storeNotFoundDesc': { en: "This store doesn't exist yet.", te: 'ఈ స్టోర్ ఇంకా ఉనికిలో లేదు.', hi: 'यह स्टोर अभी मौजूद नहीं है।' },
  'storefront.poweredBy': { en: 'Powered by ApnaBazar', te: 'ApnaBazar ద్వారా', hi: 'ApnaBazar द्वारा संचालित' },
  'storefront.empowering': { en: 'Empowering local sellers to go digital', te: 'స్థానిక విక్రేతలను డిజిటల్ చేయడం', hi: 'लोकल विक्रेताओं को डिजिटल बनाना' },
  'storefront.orderPlaced': { en: 'Order placed!', te: 'ఆర్డర్ చేయబడింది!', hi: 'ऑर्डर हो गया!' },
  'storefront.orderSent': { en: 'Your order has been sent to the seller.', te: 'మీ ఆర్డర్ విక్రేతకు పంపబడింది.', hi: 'आपका ऑर्डर विक्रेता को भेज दिया गया है।' },
  'storefront.orderFailed': { en: 'Order failed', te: 'ఆర్డర్ విఫలమైంది', hi: 'ऑर्डर विफल' },
  'storefront.orderFailedDesc': { en: 'Could not place order. Please try again.', te: 'ఆర్డర్ చేయడం సాధ్యపడలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.', hi: 'ऑर्डर नहीं हो सका। कृपया फिर से प्रयास करें।' },
  'storefront.contactUnavailable': { en: 'Contact unavailable', te: 'సంప్రదింపు అందుబాటులో లేదు', hi: 'संपर्क उपलब्ध नहीं' },
  'storefront.contactUnavailableDesc': { en: 'The seller has not shared their contact details yet.', te: 'విక్రేత ఇంకా వారి సంప్రదింపు వివరాలు షేర్ చేయలేదు.', hi: 'विक्रेता ने अभी तक अपने संपर्क विवरण साझा नहीं किए हैं।' },
  'storefront.all': { en: 'All', te: 'అన్నీ', hi: 'सभी' },

  // ── Upload ──
  'upload.dragDrop': { en: 'Drag & drop product images here', te: 'ప్రొడక్ట్ ఫోటోలను ఇక్కడ డ్రాగ్ & డ్రాప్ చేయండి', hi: 'प्रोडक्ट फोटो यहां ड्रैग & ड्रॉप करें' },
  'upload.orClick': { en: 'or click to browse files', te: 'లేదా ఫైల్స్ బ్రౌజ్ చేయడానికి క్లిక్ చేయండి', hi: 'या फाइल ब्राउज़ करने के लिए क्लिक करें' },
  'upload.supported': { en: 'Supports JPG, PNG, WebP • Max 10MB per file', te: 'JPG, PNG, WebP • ఫైల్‌కి గరిష్టంగా 10MB', hi: 'JPG, PNG, WebP • प्रति फ़ाइल अधिकतम 10MB' },
  'upload.processing': { en: 'Processing...', te: 'ప్రాసెసింగ్...', hi: 'प्रोसेसिंग...' },
  'upload.price': { en: 'Price (₹)', te: 'ధర (₹)', hi: 'कीमत (₹)' },
  'upload.digitize': { en: 'Digitize Products', te: 'ఉత్పత్తులను డిజిటైజ్ చేయి', hi: 'उत्पाद डिजिटाइज़ करें' },

  // ── Product Card ──
  'product.edit': { en: 'Edit', te: 'సవరించు', hi: 'संपादित करें' },
  'product.delete': { en: 'Delete', te: 'తొలగించు', hi: 'हटाएं' },
  'product.price': { en: 'Price', te: 'ధర', hi: 'कीमत' },
  'product.category': { en: 'Category', te: 'వర్గం', hi: 'श्रेणी' },
  'product.editProduct': { en: 'Edit Product', te: 'ఉత్పత్తిని సవరించు', hi: 'उत्पाद संपादित करें' },
  'product.deleteConfirm': { en: 'Delete this product?', te: 'ఈ ఉత్పత్తిని తొలగించాలా?', hi: 'इस उत्पाद को हटाएं?' },
  'product.noCategory': { en: 'Uncategorized', te: 'వర్గీకరించబడలేదు', hi: 'अवर्गीकृत' },

  // ── Buyer Auth Modal ──
  'buyerAuth.title': { en: 'Sign in to order', te: 'ఆర్డర్ చేయడానికి సైన్ ఇన్ చేయండి', hi: 'ऑर्डर करने के लिए साइन इन करें' },
  'buyerAuth.desc': { en: 'Create an account or sign in to place your order', te: 'మీ ఆర్డర్ చేయడానికి ఖాతా సృష్టించండి లేదా సైన్ ఇన్ చేయండి', hi: 'ऑर्डर देने के लिए अकाउंट बनाएं या साइन इन करें' },

  // ── Order Confirmation ──
  'order.title': { en: 'Order Confirmed!', te: 'ఆర్డర్ నిర్ధారించబడింది!', hi: 'ऑर्डर कन्फ़र्म!' },
  'order.message': { en: 'Your order has been placed successfully.', te: 'మీ ఆర్డర్ విజయవంతంగా చేయబడింది.', hi: 'आपका ऑर्डर सफलतापूर्वक दे दिया गया है।' },
  'order.contactSeller': { en: 'Contact Seller', te: 'విక్రేతను సంప్రదించండి', hi: 'विक्रेता से संपर्क करें' },
  'order.close': { en: 'Close', te: 'మూసివేయి', hi: 'बंद करें' },

  // ── Orders (Seller Dashboard) ──
  'dashboard.tabs.orders': { en: 'Orders', te: 'ఆర్డర్లు', hi: 'ऑर्डर' },
  'orders.title': { en: 'Manage Orders', te: 'ఆర్డర్ల నిర్వహణ', hi: 'ऑर्डर प्रबंधन' },
  'orders.noOrders': { en: 'No orders yet.', te: 'ఇంకా ఆర్డర్లు లేవు.', hi: 'अभी कोई ऑर्डर नहीं है' },
  'orders.customer': { en: 'Customer', te: 'కస్టమర్', hi: 'ग्राहक' },
  'orders.product': { en: 'Product', te: 'ఉత్పత్తి', hi: 'उत्पाद' },
  'orders.status': { en: 'Status', te: 'స్థితి', hi: 'स्थिति' },
  'orders.date': { en: 'Date', te: 'తేదీ', hi: 'दिनांक' },
  'orders.contact': { en: 'Contact', te: 'సంప్రదించండి', hi: 'संपर्क करें' },
  'orders.whatsapp': { en: 'Chat on WhatsApp', te: 'WhatsApp లో చాట్ చేయండి', hi: 'WhatsApp पर चैट करें' },
  'orders.status.pending': { en: 'Pending', te: 'పెండింగ్', hi: 'लंबित' },
  'orders.status.confirmed': { en: 'Confirmed', te: 'నిర్ధారించబడింది', hi: 'कन्फ़र्म' },
  'orders.status.completed': { en: 'Completed', te: 'పూర్తయింది', hi: 'पूरा' },
  'orders.status.cancelled': { en: 'Cancelled', te: 'రద్దు చేయబడింది', hi: 'रद्द' },
} as const;

export type TranslationKey = keyof typeof translations;

export function getTranslation(key: TranslationKey, lang: Language): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}

export default translations;
