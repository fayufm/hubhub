// 语言翻译文件
const translations = {
    // 简体中文
    zh_CN: {
        // 导航和页面标题
        search: "搜索项目",
        random: "精彩项目",
        trending: "热门项目",
        random_description: "每次都会为您精选30个GitHub上的优质项目，探索更多可能性",
        trending_description: "发现不同时间段内最受欢迎的项目",
        
        // 搜索相关
        search_placeholder: "搜索项目或输入GitHub仓库URL...",
        search_tip: "可直接搜索关键词或输入完整URL (例如: https://github.com/username/repo)",
        no_results: "未找到项目",
        no_results_desc: "没有匹配的项目或发生了错误",
        
        // 时间筛选
        time_3d: "3天",
        time_7d: "7天",
        time_30d: "30天",
        time_90d: "90天",
        time_1y: "1年",
        time_all: "历来",
        
        // 语言筛选
        language_filter: "编程语言:",
        lang_all: "全部",
        lang_javascript: "JavaScript",
        lang_python: "Python",
        lang_java: "Java",
        lang_go: "Go",
        lang_typescript: "TypeScript",
        lang_cpp: "C++",
        lang_rust: "Rust",
        lang_php: "PHP",
        lang_csharp: "C#",
        lang_swift: "Swift",
        
        // 项目相关
        no_description: "无描述",
        load_more: "加载更多",
        loading_random: "正在寻找精彩项目...",
        loading_trending: "正在获取热门项目...",
        retry: "重试",
        
        // 仓库详情
        readme: "README",
        releases: "发布版本",
        code: "代码",
        no_releases: "暂无发布版本",
        no_assets: "此版本没有可下载的资源",
        download: "下载",
        
        // 错误信息
        fetch_failed: "获取项目失败",
        network_disconnected: "网络已断开",
        api_limit: "API访问受限，请稍后再试或检查Token是否有效",
        not_found: "未找到请求的资源",
        timeout: "请求超时，请稍后再试",
        unknown_error: "未知错误",
        
        // 设置面板
        settings: "设置",
        language_settings: "语言设置",
        theme_settings: "主题设置",
        light_theme: "浅色主题",
        dark_theme: "深色主题",
        card_display: "卡片显示方式",
        grid_view: "网格视图",
        list_view: "列表视图",
        hide_badges: "隐藏不可用徽章",
        github_token: "GitHub Token",
        token_placeholder: "输入您的GitHub Token",
        save: "保存",
        token_tip: "添加个人Token可以提高API访问限制，获取更多数据",
        access_limit: "访问限制说明：",
        access_limit_desc: "使用默认配置每天最多访问300个项目\n设置您自己的GitHub Token可提高访问限制",
        how_to_token: "如何获取个人Token? →",
        
        // 下载相关
        download_settings: "下载设置",
        download_path: "下载路径",
        select_path: "选择路径",
        download_path_tip: "设置默认下载路径，文件将保存到此目录",
        download_manager: "下载管理器",
        no_downloads: "暂无下载任务",
        batch_download: "批量下载",
        batch_download_all: "批量下载所有文件",
        batch_download_version: "批量下载此版本",
        select_all: "全选",
        please_select_files: "请先选择要下载的文件",
        download_files: "下载文件",
        open: "打开",
        open_folder: "打开目录",
        cancel: "取消",
        
        // 背景设置
        custom_background: "自定义背景",
        no_background: "无背景",
        color_background: "纯色背景",
        local_image: "本地图片",
        url_image: "网络图片",
        select_local_image: "选择本地图片",
        enter_image_url: "输入图片URL",
        apply: "应用",
        background_settings: "背景设置",
        opacity: "透明度：",
        blur: "模糊度："
    },
    
    // 美式英语
    en_US: {
        // Navigation and page titles
        search: "Search Projects",
        random: "Awesome Projects",
        trending: "Trending Projects",
        random_description: "Discover 30 high-quality GitHub projects every time you visit",
        trending_description: "Find the most popular projects in different time periods",
        
        // Search related
        search_placeholder: "Search projects or enter GitHub repo URL...",
        search_tip: "Search keywords or enter full URL (e.g.: https://github.com/username/repo)",
        no_results: "No projects found",
        no_results_desc: "No matching projects or an error occurred",
        
        // Time filters
        time_3d: "3 days",
        time_7d: "7 days",
        time_30d: "30 days",
        time_90d: "90 days",
        time_1y: "1 year",
        time_all: "All time",
        
        // Language filters
        language_filter: "Programming Language:",
        lang_all: "All",
        lang_javascript: "JavaScript",
        lang_python: "Python",
        lang_java: "Java",
        lang_go: "Go",
        lang_typescript: "TypeScript",
        lang_cpp: "C++",
        lang_rust: "Rust",
        lang_php: "PHP",
        lang_csharp: "C#",
        lang_swift: "Swift",
        
        // Project related
        no_description: "No description",
        load_more: "Load more",
        loading_random: "Finding awesome projects...",
        loading_trending: "Getting trending projects...",
        retry: "Retry",
        
        // Repository details
        readme: "README",
        releases: "Releases",
        code: "Code",
        no_releases: "No releases available",
        no_assets: "This release has no downloadable assets",
        download: "Download",
        
        // Error messages
        fetch_failed: "Failed to fetch projects",
        network_disconnected: "Network disconnected",
        api_limit: "API rate limit exceeded, please try again later or check your token",
        not_found: "Resource not found",
        timeout: "Request timed out, please try again later",
        unknown_error: "Unknown error",
        
        // Settings panel
        settings: "Settings",
        language_settings: "Language Settings",
        theme_settings: "Theme Settings",
        light_theme: "Light Theme",
        dark_theme: "Dark Theme",
        card_display: "Card Display",
        grid_view: "Grid View",
        list_view: "List View",
        hide_badges: "Hide unavailable badges",
        github_token: "GitHub Token",
        token_placeholder: "Enter your GitHub Token",
        save: "Save",
        token_tip: "Adding a personal token can increase API access limits",
        access_limit: "Access limit information:",
        access_limit_desc: "Default configuration allows maximum 300 projects per day\nSet your own GitHub Token to increase access limits",
        how_to_token: "How to get a personal token? →",
        
        // Download related
        download_settings: "Download Settings",
        download_path: "Download Path",
        select_path: "Select Path",
        download_path_tip: "Set default download path, files will be saved to this directory",
        download_manager: "Download Manager",
        no_downloads: "No download tasks",
        batch_download: "Batch Download",
        batch_download_all: "Batch Download All Files",
        batch_download_version: "Batch Download This Version",
        select_all: "Select All",
        please_select_files: "Please select files to download",
        download_files: "Download Files",
        open: "Open",
        open_folder: "Open Folder",
        cancel: "Cancel",
        
        // Background settings
        custom_background: "Custom Background",
        no_background: "No Background",
        color_background: "Solid Color",
        local_image: "Local Image",
        url_image: "URL Image",
        select_local_image: "Select Local Image",
        enter_image_url: "Enter image URL",
        apply: "Apply",
        background_settings: "Background Settings",
        opacity: "Opacity:",
        blur: "Blur:"
    },
    
    // 英式英语
    en_GB: {
        // Navigation and page titles
        search: "Search",
        random: "Discover Projects",
        trending: "GitHub Trending",
        random_description: "Discover 30 high-quality GitHub projects every time you visit",
        trending_description: "Find the most popular projects in different time periods",
        
        // Search related
        search_placeholder: "Search projects or enter GitHub repo URL...",
        search_tip: "Search keywords or enter full URL (e.g.: https://github.com/username/repo)",
        no_results: "No projects found",
        no_results_desc: "No matching projects or an error occurred",
        
        // Time filters
        time_3d: "3 days",
        time_7d: "7 days",
        time_30d: "30 days",
        time_90d: "90 days",
        time_1y: "1 year",
        time_all: "All time",
        
        // Language filters
        language_filter: "Programming Language:",
        lang_all: "All",
        lang_javascript: "JavaScript",
        lang_python: "Python",
        lang_java: "Java",
        lang_go: "Go",
        lang_typescript: "TypeScript",
        lang_cpp: "C++",
        lang_rust: "Rust",
        lang_php: "PHP",
        lang_csharp: "C#",
        lang_swift: "Swift",
        
        // Project related
        no_description: "No description",
        load_more: "Load more",
        loading_random: "Finding brilliant projects...",
        loading_trending: "Getting trending projects...",
        retry: "Retry",
        
        // Repository details
        readme: "README",
        releases: "Releases",
        code: "Code",
        no_releases: "No releases available",
        no_assets: "This release has no downloadable assets",
        download: "Download",
        
        // Error messages
        fetch_failed: "Failed to fetch projects",
        network_disconnected: "Network disconnected",
        api_limit: "API rate limit exceeded, please try again later or check your token",
        not_found: "Resource not found",
        timeout: "Request timed out, please try again later",
        unknown_error: "Unknown error",
        
        // Settings panel
        settings: "Settings",
        language_settings: "Language Settings",
        theme_settings: "Theme Settings",
        light_theme: "Light Theme",
        dark_theme: "Dark Theme",
        card_display: "Card Display",
        grid_view: "Grid View",
        list_view: "List View",
        hide_badges: "Hide unavailable badges",
        github_token: "GitHub Token",
        token_placeholder: "Enter your GitHub Token",
        save: "Save",
        token_tip: "Adding a personal token can increase API access limits",
        access_limit: "Access limit information:",
        access_limit_desc: "Default configuration allows maximum 300 projects per day\nSet your own GitHub Token to increase access limits",
        how_to_token: "How to get a personal token? →",
        
        // Download related
        download_settings: "Download Settings",
        download_path: "Download Path",
        select_path: "Select Path",
        download_path_tip: "Set default download path, files will be saved to this directory",
        download_manager: "Download Manager",
        no_downloads: "No download tasks",
        batch_download: "Batch Download",
        batch_download_all: "Batch Download All Files",
        batch_download_version: "Batch Download This Version",
        select_all: "Select All",
        please_select_files: "Please select files to download",
        download_files: "Download Files",
        open: "Open",
        open_folder: "Open Folder",
        cancel: "Cancel",
        
        // Background settings
        custom_background: "Custom Background",
        no_background: "No Background",
        color_background: "Solid Colour",
        local_image: "Local Image",
        url_image: "URL Image",
        select_local_image: "Select Local Image",
        enter_image_url: "Enter image URL",
        apply: "Apply",
        background_settings: "Background Settings",
        opacity: "Opacity:",
        blur: "Blur:"
    },
    
    // 阿拉伯语
    ar_SA: {
        // التنقل وعناوين الصفحة
        search: "بحث",
        random: "اكتشاف المشاريع",
        trending: "الشائع في GitHub",
        random_description: "اكتشف 30 مشروعًا عالي الجودة في GitHub في كل زيارة",
        trending_description: "اكتشف المشاريع الأكثر شعبية في فترات زمنية مختلفة",
        
        // البحث
        search_placeholder: "ابحث عن مشاريع أو أدخل عنوان URL لمستودع GitHub...",
        search_tip: "ابحث عن الكلمات الرئيسية أو أدخل عنوان URL كاملاً (مثال: https://github.com/username/repo)",
        no_results: "لم يتم العثور على مشاريع",
        no_results_desc: "لا توجد مشاريع مطابقة أو حدث خطأ",
        
        // تصفية الوقت
        time_3d: "3 أيام",
        time_7d: "7 أيام",
        time_30d: "30 يوم",
        time_90d: "90 يوم",
        time_1y: "سنة",
        time_all: "كل الأوقات",
        
        // تصفية اللغات
        language_filter: "لغة البرمجة:",
        lang_all: "الكل",
        lang_javascript: "JavaScript",
        lang_python: "Python",
        lang_java: "Java",
        lang_go: "Go",
        lang_typescript: "TypeScript",
        lang_cpp: "C++",
        lang_rust: "Rust",
        lang_php: "PHP",
        lang_csharp: "C#",
        lang_swift: "Swift",
        
        // معلومات المشروع
        no_description: "لا يوجد وصف",
        load_more: "تحميل المزيد",
        loading_random: "جاري البحث عن مشاريع رائعة...",
        loading_trending: "جاري تحميل المشاريع الشائعة...",
        retry: "إعادة المحاولة",
        
        // تفاصيل المستودع
        readme: "الملف التعريفي",
        releases: "الإصدارات",
        code: "الكود",
        no_releases: "لا توجد إصدارات متاحة",
        no_assets: "هذا الإصدار لا يحتوي على ملفات قابلة للتنزيل",
        download: "تنزيل",
        
        // رسائل الخطأ
        fetch_failed: "فشل في جلب المشاريع",
        network_disconnected: "انقطع الاتصال بالشبكة",
        api_limit: "تم تجاوز حد API، يرجى المحاولة لاحقًا أو التحقق من رمز الوصول",
        not_found: "المصدر غير موجود",
        timeout: "انتهت مهلة الطلب، يرجى المحاولة لاحقًا",
        unknown_error: "خطأ غير معروف",
        
        // لوحة الإعدادات
        settings: "الإعدادات",
        language_settings: "إعدادات اللغة",
        theme_settings: "إعدادات المظهر",
        light_theme: "المظهر الفاتح",
        dark_theme: "المظهر الداكن",
        card_display: "عرض البطاقات",
        grid_view: "عرض الشبكة",
        list_view: "عرض القائمة",
        hide_badges: "إخفاء الشارات غير المتوفرة",
        github_token: "رمز GitHub",
        token_placeholder: "أدخل رمز GitHub الخاص بك",
        save: "حفظ",
        token_tip: "إضافة رمز شخصي يمكن أن تزيد من حدود الوصول إلى API",
        access_limit: "معلومات حد الوصول:",
        access_limit_desc: "التكوين الافتراضي يسمح بحد أقصى 300 مشروع يوميًا\nقم بإعداد رمز GitHub الخاص بك لزيادة حدود الوصول",
        how_to_token: "كيفية الحصول على رمز شخصي؟ ←",
        
        // التنزيلات
        download_settings: "إعدادات التنزيل",
        download_path: "مسار التنزيل",
        select_path: "اختر المسار",
        download_path_tip: "قم بتعيين مسار التنزيل الافتراضي، سيتم حفظ الملفات في هذا المجلد",
        download_manager: "مدير التنزيلات",
        no_downloads: "لا توجد مهام تنزيل",
        batch_download: "تنزيل مجموعة",
        batch_download_all: "تنزيل جميع الملفات",
        batch_download_version: "تنزيل هذه الإصدار",
        select_all: "اختر الكل",
        please_select_files: "من فضلك حدد الملفات التي تريد تنزيلها",
        download_files: "تنزيل الملفات",
        open: "فتح",
        open_folder: "فتح المجلد",
        cancel: "إلغاء",
        
        // إعدادات الخلفية
        custom_background: "خلفية مخصصة",
        no_background: "بدون خلفية",
        color_background: "لون صلب",
        local_image: "صورة محلية",
        url_image: "صورة من URL",
        select_local_image: "اختر صورة محلية",
        enter_image_url: "أدخل عنوان URL للصورة",
        apply: "تطبيق",
        background_settings: "إعدادات الخلفية",
        opacity: "الشفافية:",
        blur: "التمويه:"
    },
    
    // 法语
    fr_FR: {
        // Navigation et titres de pages
        search: "Rechercher",
        random: "Découvrir des projets",
        trending: "Tendances GitHub",
        random_description: "Découvrez 30 projets GitHub de haute qualité à chaque visite",
        trending_description: "Trouvez les projets les plus populaires sur différentes périodes",
        
        // Recherche
        search_placeholder: "Rechercher des projets ou entrer l'URL d'un dépôt GitHub...",
        search_tip: "Recherchez par mots-clés ou entrez une URL complète (ex: https://github.com/username/repo)",
        no_results: "Aucun projet trouvé",
        no_results_desc: "Aucun projet correspondant ou une erreur s'est produite",
        
        // Filtres temporels
        time_3d: "3 jours",
        time_7d: "7 jours",
        time_30d: "30 jours",
        time_90d: "90 jours",
        time_1y: "1 an",
        time_all: "Tout temps",
        
        // Filtres de langage
        language_filter: "Langage de programmation:",
        lang_all: "Tous",
        lang_javascript: "JavaScript",
        lang_python: "Python",
        lang_java: "Java",
        lang_go: "Go",
        lang_typescript: "TypeScript",
        lang_cpp: "C++",
        lang_rust: "Rust",
        lang_php: "PHP",
        lang_csharp: "C#",
        lang_swift: "Swift",
        
        // Informations sur les projets
        no_description: "Pas de description",
        load_more: "Charger plus",
        loading_random: "Recherche de projets intéressants...",
        loading_trending: "Chargement des projets tendance...",
        retry: "Réessayer",
        
        // Détails du dépôt
        readme: "README",
        releases: "Versions",
        code: "Code",
        no_releases: "Aucune version disponible",
        no_assets: "Cette version n'a pas de fichiers téléchargeables",
        download: "Télécharger",
        
        // Messages d'erreur
        fetch_failed: "Échec de récupération des projets",
        network_disconnected: "Réseau déconnecté",
        api_limit: "Limite d'API dépassée, veuillez réessayer plus tard ou vérifier votre token",
        not_found: "Ressource non trouvée",
        timeout: "Délai d'attente dépassé, veuillez réessayer plus tard",
        unknown_error: "Erreur inconnue",
        
        // Panneau de paramètres
        settings: "Paramètres",
        language_settings: "Paramètres de langue",
        theme_settings: "Paramètres de thème",
        light_theme: "Thème clair",
        dark_theme: "Thème sombre",
        card_display: "Affichage des cartes",
        grid_view: "Vue en grille",
        list_view: "Vue en liste",
        hide_badges: "Masquer les badges indisponibles",
        github_token: "Token GitHub",
        token_placeholder: "Entrez votre token GitHub",
        save: "Enregistrer",
        token_tip: "L'ajout d'un token personnel peut augmenter les limites d'accès à l'API",
        access_limit: "Informations sur les limites d'accès :",
        access_limit_desc: "La configuration par défaut permet au maximum 300 projets par jour\nDéfinissez votre propre token GitHub pour augmenter les limites d'accès",
        how_to_token: "Comment obtenir un token personnel ? →",
        
        // Téléchargements
        download_settings: "Paramètres de téléchargement",
        download_path: "Chemin de téléchargement",
        select_path: "Sélectionner le chemin",
        download_path_tip: "Définissez le chemin de téléchargement par défaut, les fichiers seront enregistrés dans ce répertoire",
        download_manager: "Gestionnaire de téléchargements",
        no_downloads: "Aucune tâche de téléchargement",
        batch_download: "Télécharger un lot",
        batch_download_all: "Télécharger tous les fichiers",
        batch_download_version: "Télécharger cette version",
        select_all: "Sélectionner tous",
        please_select_files: "Veuillez sélectionner les fichiers à télécharger",
        download_files: "Télécharger les fichiers",
        open: "Ouvrir",
        open_folder: "Ouvrir le dossier",
        cancel: "Annuler",
        
        // Paramètres d'arrière-plan
        custom_background: "Arrière-plan personnalisé",
        no_background: "Pas d'arrière-plan",
        color_background: "Couleur unie",
        local_image: "Image locale",
        url_image: "Image depuis URL",
        select_local_image: "Sélectionner une image locale",
        enter_image_url: "Entrez l'URL de l'image",
        apply: "Appliquer",
        background_settings: "Paramètres d'arrière-plan",
        opacity: "Opacité :",
        blur: "Flou :"
    }
};

module.exports = translations; 